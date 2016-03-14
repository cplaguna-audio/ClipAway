/*****************************************************************************\
 *                            AudioController.js                             *
 *                                                                           *
 *  Controller for index.html. Interface between index.html UI and the audio *
 *  analysis and processing.                                                 *
 *                                                                           *
 *****************************************************************************/

function PlayInputAudio() {
  if(AUDIO_LOADED) {
    INPUT_AUDIO_SOURCE_NODE = AUDIO_CONTEXT.createBufferSource();
    INPUT_AUDIO_SOURCE_NODE.buffer = INPUT_AUDIO_BUFFER;
    INPUT_AUDIO_SOURCE_NODE.connect(AUDIO_CONTEXT.destination);
    INPUT_AUDIO_SOURCE_NODE.start(0);
  }
  else {
    alert("Load an audio file first.");
  }
}

function PlayProcessedAudio() {
  if(AUDIO_LOADED) {
    PROCESSED_AUDIO_SOURCE_NODE = AUDIO_CONTEXT.createBufferSource();
    PROCESSED_AUDIO_SOURCE_NODE.buffer = PROCESSED_AUDIO_BUFFER;
    PROCESSED_AUDIO_SOURCE_NODE.connect(AUDIO_CONTEXT.destination);
    PROCESSED_AUDIO_SOURCE_NODE.start(0);
  }
  else {
    alert("Load an audio file first.");
  }
}

function ProcessAudio() {
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
            w2popup.close();
          }
        }
        else {
          min_progress = MyMin(progress);
          UpdateProgressBar(min_progress);
        }

      };

      params = [FS, BLOCK_SIZE, HOP_SIZE];
      audio_processing_worker.postMessage([channel_idx, INPUT_AUDIO_BUFFER.getChannelData(channel_idx), params]);
    }
  }
}

function DoDetectClipping() {
  if(AUDIO_LOADED) {
    // Downmix First.
    var mono_channel = INPUT_AUDIO_BUFFER.getChannelData(0);
    for(var idx = 1; idx < INPUT_AUDIO_BUFFER.numberOfChannels; idx++) {
      mono_channel = SignalAdd(mono_channel, INPUT_AUDIO_BUFFER.getChannelData(idx));
    }
    mono_channel = SignalScale(mono_channel, 1.0 / INPUT_AUDIO_BUFFER.numberOfChannels);

    var clip_intervals = DetectClipping(mono_channel);
    var interval_str = IntervalToString(clip_intervals);
    PrintInTab(interval_str);
  }
  else {
    alert("Load an audio file first.");
  }

}

function UpdateProgressBar(progress) {
  progress_percent = Math.floor(progress * 100);
  console.log(progress_percent.toString());
  progress_element = document.getElementById('progress_bar_progress');
  progress_element.style.width = progress_percent.toString() + '%'; 
  $('#w2ui-popup .w2ui-msg-body').html(PROGRESS_BAR_ELEMENT.innerHTML);

}