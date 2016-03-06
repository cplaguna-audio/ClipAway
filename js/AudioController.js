/*****************************************************************************\
 *                            AudioController.js                             *
 *                                                                           *
 *  Controller for index.html. Interface between index.html UI and the audio *
 *  analysis and processing.                                                 *
 *                                                                           *
 *****************************************************************************/

function PlayInputAudio() {
  if(audio_loaded) {
    input_audio_source_node = audio_context.createBufferSource();
    input_audio_source_node.buffer = input_audio_buffer;
    input_audio_source_node.connect(audio_context.destination);
    input_audio_source_node.start(0);
  }
  else {
    alert("Load an audio file first.");
  }
}

function PlayProcessedAudio() {
  if(audio_loaded) {
    processed_audio_source_node = audio_context.createBufferSource();
    processed_audio_source_node.buffer = processed_audio_buffer;
    processed_audio_source_node.connect(audio_context.destination);
    processed_audio_source_node.start(0);
  }
  else {
    alert("Load an audio file first.");
  }
}

function ProcessAudio() {
  // Reset the audio buffer.
  processed_audio_buffer = CopyAudioBuffer(audio_context, input_audio_buffer);
  ApplyGain(processed_audio_buffer);
  waveform_interactor.UpdateProcessedAudio(processed_audio_buffer);
}

function DoDetectClipping() {
  if(audio_loaded) {
    // Downmix First.
    var mono_channel = input_audio_buffer.getChannelData(0);
    for(var idx = 1; idx < input_audio_buffer.numberOfChannels; idx++) {
      mono_channel = SignalAdd(mono_channel, input_audio_buffer.getChannelData(idx));
    }
    mono_channel = SignalScale(mono_channel, 1.0 / input_audio_buffer.numberOfChannels);

    var clip_intervals = DetectClipping(mono_channel);
    var interval_str = IntervalToString(clip_intervals);
    PrintInTab(interval_str);
  }
  else {
    alert("Load an audio file first.");
  }

}
