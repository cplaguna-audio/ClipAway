/*****************************************************************************\
 *                            AudioController.js                             *
 *                                                                           *
 *  Controller for index.html. Interface between index.html UI and the audio *
 *  analysis and processing.                                                 *
 *                                                                           *
 *****************************************************************************/

function ProcessAudio() {
  console.time('Gain');
  var num_channels = INPUT_AUDIO_BUFFER.numberOfChannels;

  // Start up the progress bar pop-up.
  PROGRESS_BAR_JQUERRY_ELEMENT.w2popup({showClose: false, modal:true});

  UpdateProgressBar(0);
  // Start the audio processing on a separate thread.
  var progress = new Float32Array(num_channels);
  for(channel_idx = 0; channel_idx < num_channels; channel_idx++) {
    progress[channel_idx] = 0;
  }

  if (window.Worker) {
    for(channel_idx = 0; channel_idx < num_channels; channel_idx++) {
      var audio_processing_worker = new Worker("js/Processing/AudioProcessingWorker.js");

      audio_processing_worker.onmessage = function(e) {
        cur_progress = e.data[0];
        the_channel_idx = e.data[1]
        progress[the_channel_idx] = cur_progress;
        if(cur_progress > 1) {
          processed_channel = e.data[2];
          PROCESSED_AUDIO_BUFFER.copyToChannel(processed_channel, the_channel_idx);
          WAVEFORM_INTERACTOR.UpdateProcessedAudio(PROCESSED_AUDIO_BUFFER);
          min_progress = MyMin(progress);
          if(min_progress > 1) {
            console.timeEnd('Gain');
            w2popup.close();

          }
        }
        else {
          avg_progress = MyAverage(progress);
          UpdateProgressBar(avg_progress);
        }

      };

      params = [INPUT_AUDIO_BUFFER.sampleRate, BLOCK_SIZE, HOP_SIZE];
      audio_processing_worker.postMessage([channel_idx, INPUT_AUDIO_BUFFER.getChannelData(channel_idx), params]);
    }
  }
}

function DoDeclipShortBursts() {
 console.time('DeclipShort');
  var num_channels = INPUT_AUDIO_BUFFER.numberOfChannels;

  // Start up the progress bar pop-up.
  PROGRESS_BAR_JQUERRY_ELEMENT.w2popup({showClose: false, modal:true});

  UpdateProgressBar(0);

  // Start the audio processing on a separate thread.
  var progress = new Float32Array(num_channels);
  for(channel_idx = 0; channel_idx < num_channels; channel_idx++) {
    progress[channel_idx] = 0;
  }

  if (window.Worker) {
    for(channel_idx = 0; channel_idx < num_channels; channel_idx++) {
      var audio_processing_worker = new Worker("js/Processing/DeclipShortBurstsWorker.js");

      audio_processing_worker.onmessage = function(e) {
        cur_progress = e.data[0];
        the_channel_idx = e.data[1]
        progress[the_channel_idx] = cur_progress;
        if(cur_progress > 1) {
          processed_channel = e.data[2];
          PROCESSED_AUDIO_BUFFER.copyToChannel(processed_channel, the_channel_idx);
          WAVEFORM_INTERACTOR.UpdateProcessedAudio(PROCESSED_AUDIO_BUFFER);
          min_progress = MyMin(progress);
          if(min_progress > 1) {
            console.timeEnd('DeclipShort');
            w2popup.close();

            STATE.did_declip_short_bursts = true;
            RefreshIndex();
          }
        }
        else {
          avg_progress = MyAverage(progress);
          UpdateProgressBar(avg_progress);
        }

      };

      params = [INPUT_AUDIO_BUFFER.sampleRate];
      audio_processing_worker.postMessage([channel_idx, INPUT_AUDIO_BUFFER.getChannelData(channel_idx), SHORT_CLIP_INTERVALS[channel_idx], params]);
    }
  }
}

function DoDetectClipping() {
  if(STATE.audio_loaded) {

    console.time('ClipDetection');
    var num_channels = INPUT_AUDIO_BUFFER.numberOfChannels;
    SHORT_CLIP_INTERVALS = [];
    LONG_CLIP_INTERVALS = [];
    for(var channel_idx = 0; channel_idx < num_channels; channel_idx++) {
      SHORT_CLIP_INTERVALS[channel_idx] = [];
      LONG_CLIP_INTERVALS[channel_idx] = [];
    }

    // Start up the progress bar pop-up.
    PROGRESS_BAR_JQUERRY_ELEMENT.w2popup({showClose: false, modal:true});

    UpdateProgressBar(0);

    // Start the audio processing on a separate thread.
    var progress = new Float32Array(num_channels);
    for(channel_idx = 0; channel_idx < num_channels; channel_idx++) {
      progress[channel_idx] = 0;
    }

    if (window.Worker) {
      for(channel_idx = 0; channel_idx < num_channels; channel_idx++) {
        var clipping_detection_worker = new Worker("js/Processing/ClippingDetectionWorker.js");

        clipping_detection_worker.onmessage = function(e) {
          var cur_progress = e.data[0];
          var the_channel_idx = e.data[1]
          progress[the_channel_idx] = cur_progress;
          if(cur_progress > 1) {
            var cur_short_clip_intervals = e.data[2];
            var cur_long_clip_intervals = e.data[3];
            SHORT_CLIP_INTERVALS[the_channel_idx] = cur_short_clip_intervals;
            LONG_CLIP_INTERVALS[the_channel_idx] = cur_long_clip_intervals;

            min_progress = MyMin(progress);
            if(min_progress > 1) {
              console.timeEnd('ClipDetection');
              w2popup.close();

              STATE.did_clipping_detection = true;
              RefreshIndex();
            }
          }
          else {
            avg_progress = MyAverage(progress);
            UpdateProgressBar(avg_progress);
          }

        };

        params = [INPUT_AUDIO_BUFFER.sampleRate];
        clipping_detection_worker.postMessage([channel_idx, INPUT_AUDIO_BUFFER.getChannelData(channel_idx), params]);
      }
    }
  }
  else {
    alert("Load an audio file first.");
  }
}

function UpdateProgressBar(progress) {
  progress_percent = Math.floor(progress * 100);
  progress_element = document.getElementById('progress_bar_progress');
  progress_element.style.width = progress_percent.toString() + '%'; 
  $('#w2ui-popup .w2ui-msg-body').html(PROGRESS_BAR_ELEMENT.innerHTML);
}

function DownloadInputAudio() {
  var wav_blob = AudioBufferToWavBlob(INPUT_AUDIO_BUFFER); 

  // Click the link programmatically.
  var download_element = document.getElementById("download_processed_audio");
  var url = window.URL.createObjectURL(wav_blob);
  download_element.href = url;
  download_element.download = "ClipAway-Unprocessed-" + FILE_NAME + '.wav';
  download_element.click();
  window.URL.revokeObjectURL(url);
}

function DownloadProcessedAudio() {
  var wav_blob = AudioBufferToWavBlob(PROCESSED_AUDIO_BUFFER); 

  // Click the link programmatically.
  var download_element = document.getElementById("download_processed_audio");
  var url = window.URL.createObjectURL(wav_blob);
  download_element.href = url;
  download_element.download = "ClipAway-Declipped-" + FILE_NAME + '.wav';
  download_element.click();
  window.URL.revokeObjectURL(url);
}

// Decide which buttons should be enable/disabled depending on the current
// state.
function RefreshIndex() {

  // 1. Check to allow wavesurfer interaction.
  if(ShouldAllowWaveformInteraction()) {
    WAVEFORM_INTERACTOR.EnableInteraction();

    var toggle_waveform_button = document.getElementById("toggle_waveform_button");
    toggle_waveform_button.addEventListener('click', function(e) {
      WAVEFORM_INTERACTOR.ToggleActiveWaveSurfer();
    });
    toggle_waveform_button.style.opacity = "1";

    var play_pause_button = document.getElementById("play_pause_button");
    play_pause_button.addEventListener('click', function(e) {
      WAVEFORM_INTERACTOR.PlayPausePressed()
    });
    play_pause_button.style.opacity = "1";

    var play_selection_button = document.getElementById("play_selection_button");
    play_selection_button.addEventListener('click', function(e) {
      WAVEFORM_INTERACTOR.PlayRegion();
    });
    play_selection_button.style.opacity = "1";

    var zoom_in_button = document.getElementById("zoom_in_button");
    zoom_in_button.addEventListener('click', function(e) {
      WAVEFORM_INTERACTOR.ZoomIn();
    });
    zoom_in_button.style.opacity = "1";

    var zoom_out_button = document.getElementById("zoom_out_button");
    zoom_out_button.addEventListener('click', function(e) {
      WAVEFORM_INTERACTOR.ZoomOut();
    });
    zoom_out_button.style.opacity = "1";

    WAVEFORM_INTERACTOR.original_audio_element.addEventListener('click', function() {
      if(!WAVEFORM_INTERACTOR.original_on) {
        WAVEFORM_INTERACTOR.TurnOnOriginal();
      }
    })

    WAVEFORM_INTERACTOR.processed_audio_element.addEventListener('click', function() {
      if(WAVEFORM_INTERACTOR.original_on) {
        WAVEFORM_INTERACTOR.TurnOnProcessed();
      }
    })
  }
  else {
    WAVEFORM_INTERACTOR.DisableInteraction();

    var toggle_waveform_button = document.getElementById("toggle_waveform_button");
    toggle_waveform_button.style.opacity = "0.2";

    var play_pause_button = document.getElementById("play_pause_button");
    play_pause_button.style.opacity = "0.2";

    var play_selection_button = document.getElementById("play_selection_button");
    play_selection_button.style.opacity = "0.2";

    buttons = document.getElementsByClassName("zoom_image");
    for(var i = 0; i < buttons.length; i++) {
      buttons[i].removeEventListener('click', function() {});
      buttons[i].style.opacity = "0.2";
    } 
  }

  if(ShouldEnableDetectClipping()) {
    var detect_clipping_button = document.getElementById("detect_clipping_button");
    detect_clipping_button.disabled = false;
    detect_clipping_button.style.opacity = "1";
  }
  else {
    var detect_clipping_button = document.getElementById("detect_clipping_button");
    detect_clipping_button.disabled = true;
    detect_clipping_button.style.opacity = "0.2";
  }

  if(ShouldEnableDeclipShortBursts()) {
    var declip_short_bursts_button = document.getElementById("declip_short_bursts_button");
    declip_short_bursts_button.disabled = false;
    declip_short_bursts_button.style.opacity = "1";
  }
  else {
    var declip_short_bursts_button = document.getElementById("declip_short_bursts_button");
    declip_short_bursts_button.disabled = true;
    declip_short_bursts_button.style.opacity = "0.2";
  }

  // 4. Check remove long bursts button.

}

function FlushIndex() {
  FlushState();

  FILE_NAME = "";
  INPUT_AUDIO_BUFFER = [];
  SHORT_CLIP_INTERVALS = [];
  LONG_CLIP_INTERVALS = [];
  PROCESSED_AUDIO_BUFFER = [];
}

function FlushState() {
  STATE.audio_loaded = false;
  STATE.did_clipping_detection = false;
  STATE.did_declip_short_bursts = false;
  STATE.did_declip_long_bursts = false;
}

function ShouldAllowWaveformInteraction() {
  return STATE.audio_loaded;
}

function ShouldEnableDetectClipping() {
  return STATE.audio_loaded;
}

function ShouldEnableDeclipShortBursts() {
  return STATE.audio_loaded && STATE.did_clipping_detection;
}