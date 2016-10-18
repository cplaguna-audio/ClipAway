/*
 * ClipAway
 *
 * Copyright (c) 2016 Christopher Laguna
 * https://github.com/cplaguna-audio/ClipAway
 *
 * (MIT License)
 * Permission is hereby granted, free of charge, to any person obtaining a copy of 
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*****************************************************************************\
 *                            IndexController.js                             *
 *                                                                           *
 *  Controller for index.html. Interface between index.html UI and the audio *
 *  analysis and processing.                                                 *
 *                                                                           *
 *****************************************************************************/

define([
  /* Includes go here. */
    'IndexGlobal',
    'WaveformInteractor',
    'WebAudioUtils',

    'modules/codecs/WavEncoder',
    'modules/signal_processing/SignalProcessing',
    'modules/test/Test',

    'third_party/jquery/jquery-1.12.1.min',
    'third_party/w2ui/w2ui-1.4.3.min',

    'third_party/katspaugh-wavesurfer.js-fdd4b7f/wavesurfer.min',
    'third_party/katspaugh-wavesurfer.js-fdd4b7f/wavesurfer.regions.min',
    'third_party/katspaugh-wavesurfer.js-fdd4b7f/wavesurfer.timeline.min',

    'third_party/web_evaluation_toolkit/loudness'
  ], function(IndexGlobal,
              WaveformInteractor,
              WebAudioUtils,
              WavEncoder,
              SignalProcessing,
              Test) {

  PROGRESS = [];

  // Load the web workers at init time.
  CLIPPING_DETECTION_WORKERS = [];
  GAIN_WORKERS = [];
  DECLIP_SHORT_BURSTS_WORKERS = [];
  GET_KNOWN_POINTS_WORKERS = [];
  DECLIP_LONG_BURSTS_WORKERS = [];

  $(document).ready(InitIndex);

  // Queue of (audio processing) callbacks to be executed by a web worker.
  action_queue = [];

  function DoFirstAction() {
    if(action_queue.length >= 1) {
      top_callback = action_queue.shift();
      OpenProgressBar();
      top_callback();
    }
  }

  function DoNextAction() {
    if(action_queue.length >= 1) {
      top_callback = action_queue.shift();
      top_callback();
    }
    else {
      CloseProgressBar();
    }
  }

  // Event handlers.
  function LoadExampleClicked() {
    var blob = null;
    var xhr = new XMLHttpRequest(); 
    xhr.open("GET", "resources/audio_examples/1/1_clipped.wav"); 
    xhr.responseType = "blob";
    xhr.onload = function() {
      blob = xhr.response;
      IndexGlobal.FILE_NAME = "clipping_example.wav";

      var reader = new FileReader();
      reader.onload = function(ev) {
        IndexGlobal.AUDIO_CONTEXT.decodeAudioData(ev.target.result, function(buffer) {
          IndexGlobal.INPUT_AUDIO_BUFFER = buffer;
          IndexGlobal.PROCESSED_AUDIO_BUFFER = WebAudioUtils.CopyAudioBuffer(IndexGlobal.AUDIO_CONTEXT, IndexGlobal.INPUT_AUDIO_BUFFER);
          IndexGlobal.STATE.audio_loaded = true;
          action_queue.push(DoDetectClipping);
          action_queue.push(DoNormalizeInput);
          action_queue.push(DoNormalizeOutput);
          DoFirstAction();
        });
      };
      reader.readAsArrayBuffer(blob);
      IndexGlobal.WAVEFORM_INTERACTOR.LoadAudio(blob);
      RefreshIndex();
    }
    xhr.send();
  }

  function DeclipClicked() {
    action_queue.push(DoDeclipShortBursts);
    action_queue.push(DoGetKnownPoints);
    action_queue.push(DoDeclipLongBursts);
    action_queue.push(DoNormalizeInput);
    action_queue.push(DoNormalizeOutput);
    DoFirstAction();
  }

  function SaveOutputClicked() {
    var wav_blob = WavEncoder.AudioBufferToWavBlob(IndexGlobal.PROCESSED_AUDIO_BUFFER); 

    // Click the link programmatically.
    var download_element = document.getElementById("download_processed_audio");
    var url = window.URL.createObjectURL(wav_blob);
    download_element.href = url;
    download_element.download = "ClipAway-Declipped-" + IndexGlobal.FILE_NAME + '.wav';
    download_element.click();
    window.URL.revokeObjectURL(url);
  }

  // Callbacks for web worker progress updates.
  function GainCallback(e) {
    cur_progress = e.data[0];
    the_channel_idx = e.data[1]
    PROGRESS[the_channel_idx] = cur_progress;
    if(cur_progress > 1) {
      processed_channel = e.data[2];
      do_input_buffer = e.data[3];
      var audio_buffer = 0;
      if(do_input_buffer) {
        audio_buffer = IndexGlobal.INPUT_AUDIO_BUFFER;
      }
      else {
        audio_buffer = IndexGlobal.PROCESSED_AUDIO_BUFFER;
      }
      
      audio_buffer.copyToChannel(processed_channel, the_channel_idx);
      
      min_progress = SignalProcessing.MyMin(PROGRESS);
      console.timeEnd('Gain');

      if(min_progress > 1) {
        the_callback = function() {
          console.log('callback: gain');
          DoNextAction();
        }
      }
      if(do_input_buffer) {
        IndexGlobal.WAVEFORM_INTERACTOR.UpdateInputAudio(audio_buffer, the_callback);
      }
      else {
        IndexGlobal.WAVEFORM_INTERACTOR.UpdateProcessedAudio(audio_buffer, the_callback);
      }

    }
    else {
      avg_progress = SignalProcessing.MyAverage(PROGRESS);
      UpdateProgressBar(avg_progress);
    }
  };

  function ClippingDetectionCallback(e) {
    var cur_progress = e.data[0];
    var the_channel_idx = e.data[1]
    PROGRESS[the_channel_idx] = cur_progress;
    if(cur_progress > 1) {
      var cur_short_clip_intervals = e.data[2];
      var cur_long_clip_intervals = e.data[3];
      IndexGlobal.SHORT_CLIP_INTERVALS[the_channel_idx] = cur_short_clip_intervals;
      IndexGlobal.LONG_CLIP_INTERVALS[the_channel_idx] = cur_long_clip_intervals;

      min_progress = SignalProcessing.MyMin(PROGRESS);
      if(min_progress > 1) {
        console.timeEnd('ClipDetection');
        w2popup.close();

        IndexGlobal.STATE.did_clipping_detection = true;
        RefreshIndex();
      }
    }
    else {
      avg_progress = SignalProcessing.MyAverage(PROGRESS);
      UpdateProgressBar(avg_progress);
    }

  };  

  function DeclipShortBurstsCallback(e) {
    cur_progress = e.data[0];
    the_channel_idx = e.data[1]
    PROGRESS[the_channel_idx] = cur_progress;
    if(cur_progress > 1) {
      processed_channel = e.data[2];
      IndexGlobal.PROCESSED_AUDIO_BUFFER.copyToChannel(processed_channel, the_channel_idx);
      
      min_progress = SignalProcessing.MyMin(PROGRESS);
      console.timeEnd('DeclipShort');

      if(min_progress > 1) {
        the_callback = function() {
          console.log('callback: short declipping');

          IndexGlobal.STATE.did_declip_short_bursts = true;
          RefreshIndex();
          DoNextAction();
        }
      }
      IndexGlobal.WAVEFORM_INTERACTOR.UpdateProcessedAudio(IndexGlobal.PROCESSED_AUDIO_BUFFER, the_callback);

    }
    else {
      avg_progress = SignalProcessing.MyAverage(PROGRESS);
      UpdateProgressBar(avg_progress);
    }

  };    

  function GetKnownPointsCallback(e) {
    cur_progress = e.data[0];
    the_channel_idx = e.data[1]
    PROGRESS[the_channel_idx] = cur_progress;
    if(cur_progress > 1) {
      cur_known_points = e.data[2];
      KNOWN_POINTS[the_channel_idx] = cur_known_points;

      min_progress = SignalProcessing.MyMin(PROGRESS);
      if(min_progress > 1) {
        console.timeEnd('GetKnownPoints');

        IndexGlobal.STATE.did_get_known_points = true;
        RefreshIndex();
        DoNextAction();
      }
    }
    else {
      avg_progress = SignalProcessing.MyAverage(PROGRESS);
      UpdateProgressBar(avg_progress);
    }

  };

  function DeclipLongBurstsCallback(e) {
    cur_progress = e.data[0];
    the_channel_idx = e.data[1]
    PROGRESS[the_channel_idx] = cur_progress;
    if(cur_progress > 1) {
      processed_channel = e.data[2];
      IndexGlobal.PROCESSED_AUDIO_BUFFER.copyToChannel(processed_channel, the_channel_idx);
      min_progress = SignalProcessing.MyMin(PROGRESS);

      var the_callback = function() {};
      if(min_progress > 1) {
        console.timeEnd('DeclipLongBursts');
        the_callback = function() {
          console.log('callback: long declipping.');
          w2popup.close();

          IndexGlobal.STATE.did_declip_long_bursts = true;
          RefreshIndex();
          };
      }
      IndexGlobal.WAVEFORM_INTERACTOR.UpdateProcessedAudio(IndexGlobal.PROCESSED_AUDIO_BUFFER, the_callback);
    }
    else {
      avg_progress = SignalProcessing.MyAverage(PROGRESS);
      UpdateProgressBar(avg_progress);
    }
  };
 
  // Called after the <body> has been loaded.
  function InitIndex() {  

    // Add the click handlers.
    $("#load_example").click(function() { LoadExampleClicked(); });
    $("#declip_button").click(function() { DeclipClicked(); });
    $("#download_audio_button").click(function() { SaveOutputClicked(); });

    // Construct the web workers.
    if (window.Worker) {
      for(channel_idx = 0; channel_idx < IndexGlobal.MAX_NUM_CHANNELS; channel_idx++) {
        var clipping_detection_worker = new Worker("js/web_workers/ClippingDetectionWorker.js");
        clipping_detection_worker.onmessage = ClippingDetectionCallback;
        CLIPPING_DETECTION_WORKERS.push(clipping_detection_worker); 

        var gain_worker = new Worker("js/web_workers/GainWorker.js");
        gain_worker.onmessage = GainCallback;
        GAIN_WORKERS.push(gain_worker); 

        var declip_short_bursts_worker = new Worker("js/web_workers/DeclipShortBurstsWorker.js");
        declip_short_bursts_worker.onmessage = DeclipShortBurstsCallback;
        DECLIP_SHORT_BURSTS_WORKERS.push(declip_short_bursts_worker);

        var get_known_points_worker = new Worker("js/web_workers/GetKnownPointsWorker.js");
        get_known_points_worker.onmessage = GetKnownPointsCallback;
        GET_KNOWN_POINTS_WORKERS.push(get_known_points_worker);

        var declip_long_bursts_worker = new Worker("js/web_workers/DeclipLongBurstsWorker.js");
        declip_long_bursts_worker.onmessage = DeclipLongBurstsCallback;
        DECLIP_LONG_BURSTS_WORKERS.push(declip_long_bursts_worker);
      }
    }

    // Drag and drop.
    var toggleActive = function (e, toggle) {
        e.stopPropagation();
        e.preventDefault();
        toggle ? e.target.classList.add('wavesurfer-dragover') :
            e.target.classList.remove('wavesurfer-dragover');
    };

    var handlers = {
        drop: function (e) {
            toggleActive(e, false);

            if(e.dataTransfer.files.length) {

              IndexGlobal.FILE_NAME = e.dataTransfer.files[0].name;

              var reader = new FileReader();
              reader.onload = function(ev) {
                IndexGlobal.AUDIO_CONTEXT.decodeAudioData(ev.target.result, function(buffer) {
                  IndexGlobal.INPUT_AUDIO_BUFFER = buffer;
                  IndexGlobal.PROCESSED_AUDIO_BUFFER = WebAudioUtils.CopyAudioBuffer(IndexGlobal.AUDIO_CONTEXT, IndexGlobal.INPUT_AUDIO_BUFFER);
                  IndexGlobal.STATE.audio_loaded = true;
                  DoDetectClipping();
                });
              };
              reader.readAsArrayBuffer(e.dataTransfer.files[0]);
              IndexGlobal.WAVEFORM_INTERACTOR.LoadAudio(e.dataTransfer.files[0]);
              RefreshIndex();
            } 
            else {
                console.log('Tried to drag and drop a bad file.');
            }
        },

        dragover: function(e) {
            toggleActive(e, true);
        },

        dragleave: function(e) {
            toggleActive(e, false);
        }
    };

    var dropTarget = document.querySelector('#waveform_view');
    Object.keys(handlers).forEach(function (event) {
        dropTarget.addEventListener(event, handlers[event]);
    });

    var screen_width_pixels = window.screen.width;
    var CONTENT_WIDTH_PIXELS = screen_width_pixels * IndexGlobal.CONTENT_WIDTH_PERCENTAGE;
    var content_element = document.getElementById('my_content');
    content_element.style.width = CONTENT_WIDTH_PIXELS.toString() + "px";

    // Progress bar.
    PROGRESS = [];
    for(channel_idx = 0; channel_idx < IndexGlobal.MAX_NUM_CHANNELS; channel_idx++) {
      PROGRESS[channel_idx] = 0;
    }
    IndexGlobal.PROGRESS_BAR_JQUERRY_ELEMENT = $('#audio_processing_progress_popup');
    IndexGlobal.PROGRESS_BAR_ELEMENT = document.getElementById('audio_processing_progress_popup');

    // Waveform interactor.
    var waveform_view_element = document.getElementById('waveform_view');
    var padding = window.getComputedStyle(waveform_view_element, null).getPropertyValue('padding');
    padding = padding.substring(0, padding.length - 2);
    var waveform_view_width_px = CONTENT_WIDTH_PIXELS - (2 * Number(padding)) - 10;
    IndexGlobal.WAVEFORM_INTERACTOR = new WaveformInteractor.WaveformInteractor(waveform_view_width_px);
    IndexGlobal.WAVEFORM_INTERACTOR.Init("original_audio_waveform", "processed_audio_waveform");
    
    // Clear state.
    RefreshIndex();

    // Tests.
    if(IndexGlobal.RUN_TESTS) {
      Test.RunTests();
    }

  }

  function DoNormalizeInput() {
    DoLoudnessNormalization(true);
  }

  function DoNormalizeOutput() {
    DoLoudnessNormalization(false);
  }

  function DoLoudnessNormalization(do_input_buffer) {
    var audio_buffer = 0;
    if(do_input_buffer) {
      audio_buffer = IndexGlobal.INPUT_AUDIO_BUFFER;
    }
    else {
      audio_buffer = IndexGlobal.PROCESSED_AUDIO_BUFFER;
    }
    console.time('Gain');

    var loudness_wrapper = {
        buffer: audio_buffer, 
        ready: function() {}
    };

    var loudness_callback = function(buffer, do_input_buffer) {
      var gain_db = IndexGlobal.TARGET_LUFS - audio_buffer.lufs;
      var gain_linear = SignalProcessing.DBToLinear(gain_db);
      console.log('gain: ' + gain_linear)
      var num_channels = audio_buffer.numberOfChannels;

      // Start up the progress bar pop-up.
      ResetProgressBar('Normalizing Loudness');

      PROGRESS = [];
      for(var channel_idx = 0; channel_idx < num_channels; channel_idx++) {
        PROGRESS[channel_idx] = 0;
      }

      // Start the audio processing on a separate thread.
      if (window.Worker) {
        for(channel_idx = 0; channel_idx < num_channels; channel_idx++) {
          params = [gain_linear];
          GAIN_WORKERS[channel_idx].postMessage([channel_idx, audio_buffer.getChannelData(channel_idx), params, do_input_buffer]);
        }
      }
    };

    calculateLoudness(IndexGlobal.AUDIO_CONTEXT, loudness_wrapper, 'I', loudness_callback, do_input_buffer);
  }

  function DoDeclipShortBursts() {
    console.time('DeclipShort');
    var num_channels = IndexGlobal.INPUT_AUDIO_BUFFER.numberOfChannels;

    // Start up the progress bar pop-up.
    ResetProgressBar('1/3: Declipping Short Bursts');

    PROGRESS = [];
    for(channel_idx = 0; channel_idx < num_channels; channel_idx++) {
      PROGRESS[channel_idx] = 0;
    }

    // Start the audio processing on a separate thread.
    if (window.Worker) {
      for(channel_idx = 0; channel_idx < num_channels; channel_idx++) {
        params = [IndexGlobal.INPUT_AUDIO_BUFFER.sampleRate];
        DECLIP_SHORT_BURSTS_WORKERS[channel_idx].postMessage([channel_idx, IndexGlobal.INPUT_AUDIO_BUFFER.getChannelData(channel_idx), IndexGlobal.SHORT_CLIP_INTERVALS[channel_idx], params]);
      }
    }
  }

  function DoGetKnownPoints() {  
    console.time('GetKnownPoints');
    var num_channels = IndexGlobal.INPUT_AUDIO_BUFFER.numberOfChannels;

    KNOWN_POINTS = [];
    for(var channel_idx = 0; channel_idx < num_channels; channel_idx++) {
      KNOWN_POINTS[channel_idx] = [];
    }

    // Start up the progress bar pop-up.
    ResetProgressBar('2/3: Finding Reliable FFT Magnitudes');

    PROGRESS = [];
    for(channel_idx = 0; channel_idx < num_channels; channel_idx++) {
      PROGRESS[channel_idx] = 0;
    }

    // Start the audio processing on a separate thread.
    if (window.Worker) {
      for(channel_idx = 0; channel_idx < num_channels; channel_idx++) {
        params = [IndexGlobal.INPUT_AUDIO_BUFFER.sampleRate, IndexGlobal.BLOCK_SIZE, IndexGlobal.HOP_SIZE, IndexGlobal.MIN_FFT_LENGTH];
        GET_KNOWN_POINTS_WORKERS[channel_idx].postMessage([channel_idx, IndexGlobal.PROCESSED_AUDIO_BUFFER.getChannelData(channel_idx), IndexGlobal.LONG_CLIP_INTERVALS[channel_idx], params]);
      }
    }
  }

  function DoDeclipLongBursts() {
    console.time('DeclipLongBursts');
    var num_channels = IndexGlobal.INPUT_AUDIO_BUFFER.numberOfChannels;

    // Start up the progress bar pop-up.
    ResetProgressBar('3/3: Declipping Long Bursts');

    PROGRESS = [];
    for(channel_idx = 0; channel_idx < num_channels; channel_idx++) {
      PROGRESS[channel_idx] = 0;
    }

    if (window.Worker) {
      for(channel_idx = 0; channel_idx < num_channels; channel_idx++) {
        params = [IndexGlobal.INPUT_AUDIO_BUFFER.sampleRate, IndexGlobal.BLOCK_SIZE, IndexGlobal.HOP_SIZE];
        DECLIP_LONG_BURSTS_WORKERS[channel_idx].postMessage([channel_idx, IndexGlobal.PROCESSED_AUDIO_BUFFER.getChannelData(channel_idx), IndexGlobal.LONG_CLIP_INTERVALS[channel_idx], KNOWN_POINTS[channel_idx], params]);
      }
    }  
  }

  function DoDetectClipping() {
    if(IndexGlobal.STATE.audio_loaded) {

      console.time('ClipDetection');
      var num_channels = IndexGlobal.INPUT_AUDIO_BUFFER.numberOfChannels;
      IndexGlobal.SHORT_CLIP_INTERVALS = [];
      IndexGlobal.LONG_CLIP_INTERVALS = [];
      PROGRESS = [];
      for(var channel_idx = 0; channel_idx < num_channels; channel_idx++) {
        IndexGlobal.SHORT_CLIP_INTERVALS[channel_idx] = [];
        IndexGlobal.LONG_CLIP_INTERVALS[channel_idx] = [];
        PROGRESS[channel_idx] = 0;
      }

      ResetProgressBar("Detect Clipping");
      if (window.Worker) {
        for(channel_idx = 0; channel_idx < num_channels; channel_idx++) {
          params = [IndexGlobal.INPUT_AUDIO_BUFFER.sampleRate];
          CLIPPING_DETECTION_WORKERS[channel_idx].postMessage([channel_idx, IndexGlobal.INPUT_AUDIO_BUFFER.getChannelData(channel_idx), params]);
        }
      }
    }
    else {
      alert("Load an audio file first.");
    }
  }

  /* 
   ********** Progress Bar Functions ***********
   */
  function OpenProgressBar() {
    IndexGlobal.PROGRESS_BAR_JQUERRY_ELEMENT.w2popup({showClose: false, modal:true});
  }
  function CloseProgressBar() {
    w2popup.close();
  }

  function ResetProgressBar(progress_text) {
    var progress_title_element = document.getElementById('progress_title');
    progress_title_element.innerHTML = progress_text;
    UpdateProgressBar(0);
  }

  function UpdateProgressBar(progress) {
    progress_percent = Math.floor(progress * 100);
    progress_element = document.getElementById('progress_bar_progress');
    progress_element.style.width = progress_percent.toString() + '%'; 
    $('#w2ui-popup .w2ui-msg-body').html(IndexGlobal.PROGRESS_BAR_ELEMENT.innerHTML);
  }

  function DownloadInputAudio() {
    var wav_blob = WavEncoder.AudioBufferToWavBlob(IndexGlobal.INPUT_AUDIO_BUFFER); 

    var output_file_name = IndexGlobal.FILE_NAME.substring(0, IndexGlobal.FILE_NAME.lastIndexOf('.'));

    // Click the link programmatically.
    var download_element = document.getElementById("download_processed_audio");
    var url = window.URL.createObjectURL(wav_blob);
    download_element.href = url;
    download_element.download = "ClipAway-Unprocessed-" + output_file_name + '.wav';
    download_element.click();
    window.URL.revokeObjectURL(url);
  }

  // Decide which buttons should be enable/disabled depending on the current
  // state.
  function RefreshIndex() {
    var file_name_element = document.getElementById("file_name");
    file_name_element.innerHTML = IndexGlobal.FILE_NAME;

    // 1. Check to allow wavesurfer interaction.
    if(ShouldAllowWaveformInteraction()) {
      IndexGlobal.WAVEFORM_INTERACTOR.EnableInteraction();

      var toggle_waveform_button = document.getElementById("toggle_waveform_button");
      toggle_waveform_button.removeEventListener('click', ToggleWaveformHandler);
      toggle_waveform_button.addEventListener('click', ToggleWaveformHandler);
      toggle_waveform_button.style.opacity = "1";

      var play_pause_button = document.getElementById("play_pause_button");
      play_pause_button.removeEventListener('click', PlayPauseHandler);
      play_pause_button.addEventListener('click', PlayPauseHandler);
      play_pause_button.style.opacity = "1";

      var play_selection_button = document.getElementById("play_selection_button");
      play_selection_button.removeEventListener('click', PlaySelectionHandler);
      play_selection_button.addEventListener('click', PlaySelectionHandler);
      play_selection_button.style.opacity = "1";

      var zoom_in_button = document.getElementById("zoom_in_button");
      zoom_in_button.removeEventListener('click', ZoomInHandler);
      zoom_in_button.addEventListener('click', ZoomInHandler);
      zoom_in_button.style.opacity = "1";

      var zoom_out_button = document.getElementById("zoom_out_button");
      zoom_out_button.removeEventListener('click', ZoomOutHandler);
      zoom_out_button.addEventListener('click', ZoomOutHandler);
      zoom_out_button.style.opacity = "1";

      var processing_buttons = document.getElementsByClassName("processing_button");
      for(var i = 0; i < processing_buttons.length; i++) {
        processing_buttons[i].style.opacity = "1";
        processing_buttons[i].disabled = false;
      } 

      IndexGlobal.WAVEFORM_INTERACTOR.original_audio_element.addEventListener('click', function() {
        if(!IndexGlobal.WAVEFORM_INTERACTOR.original_on) {
          IndexGlobal.WAVEFORM_INTERACTOR.TurnOnOriginal();
        }
      })

      IndexGlobal.WAVEFORM_INTERACTOR.processed_audio_element.addEventListener('click', function() {
        if(IndexGlobal.WAVEFORM_INTERACTOR.original_on) {
          IndexGlobal.WAVEFORM_INTERACTOR.TurnOnProcessed();
        }
      })
    }
    else {
      IndexGlobal.WAVEFORM_INTERACTOR.DisableInteraction();

      var toggle_waveform_button = document.getElementById("toggle_waveform_button");
      toggle_waveform_button.style.opacity = "0.2";

      var play_pause_button = document.getElementById("play_pause_button");
      play_pause_button.style.opacity = "0.2";

      var play_selection_button = document.getElementById("play_selection_button");
      play_selection_button.style.opacity = "0.2";

      var zoom_in_button = document.getElementById("zoom_in_button");
      zoom_in_button.removeEventListener('click', ZoomInHandler);
      zoom_in_button.style.opacity = "0.2";

      var zoom_out_button = document.getElementById("zoom_out_button");
      zoom_out_button.removeEventListener('click', ZoomOutHandler);
      zoom_out_button.style.opacity = "0.2";

      var processing_buttons = document.getElementsByClassName("processing_button");
      for(var i = 0; i < processing_buttons.length; i++) {
        processing_buttons[i].style.opacity = "0.2";
        processing_buttons[i].disabled = true;
      } 
    }
  }

  function FlushIndex() {
    FlushState();

    IndexGlobal.FILE_NAME = "";
    IndexGlobal.INPUT_AUDIO_BUFFER = [];
    IndexGlobal.SHORT_CLIP_INTERVALS = [];
    IndexGlobal.LONG_CLIP_INTERVALS = [];
    IndexGlobal.PROCESSED_AUDIO_BUFFER = [];
  }

  function FlushState() {
    IndexGlobal.STATE.audio_loaded = false;
    IndexGlobal.STATE.did_clipping_detection = false;
    IndexGlobal.STATE.did_declip_short_bursts = false;
    IndexGlobal.STATE.did_declip_long_bursts = false;
  }

  function ShouldAllowWaveformInteraction() {
    return IndexGlobal.STATE.audio_loaded;
  }

  function ShouldEnableDetectClipping() {
    return IndexGlobal.STATE.audio_loaded;
  }

  function ShouldEnableDeclipShortBursts() {
    return IndexGlobal.STATE.audio_loaded && IndexGlobal.STATE.did_clipping_detection;
  }

  function ShouldEnableGetKnownPoints() {
    return IndexGlobal.STATE.audio_loaded && IndexGlobal.STATE.did_clipping_detection && IndexGlobal.STATE.did_declip_short_bursts;
  }

  function ShouldEnableDeclipLongBursts() {
    return IndexGlobal.STATE.audio_loaded && IndexGlobal.STATE.did_clipping_detection && IndexGlobal.STATE.did_declip_short_bursts && IndexGlobal.STATE.did_get_known_points;
  }

  // Button handlers.
  function ToggleWaveformHandler(event) {
    IndexGlobal.WAVEFORM_INTERACTOR.ToggleActiveWaveSurfer();
  }

  function PlayPauseHandler(event) {
    IndexGlobal.WAVEFORM_INTERACTOR.PlayPausePressed();
  }

  function PlaySelectionHandler(event) {
    IndexGlobal.WAVEFORM_INTERACTOR.PlayRegion();
  }

  function ZoomInHandler(event) {
    IndexGlobal.WAVEFORM_INTERACTOR.ZoomIn();
  }

  function ZoomOutHandler(event) {
    IndexGlobal.WAVEFORM_INTERACTOR.ZoomOut();
  }

  /* Public variables go here. */
  return {

  };
});