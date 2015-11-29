/*****************************************************************************\
 *                            AudioController.js                             *
 *                                                                           *
 *  Controller for index.html. Interface between index.html UI and the audio *
 *  analysis and processing.                                                 *
 *                                                                           *
 *****************************************************************************/

function PlayAudio() {
  if(audio_loaded) {
    user_audio_source_node = audio_context.createBufferSource();
    user_audio_source_node.buffer = user_audio_buffer;
    user_audio_source_node.connect(audio_context.destination);
    user_audio_source_node.start(0);
  }
  else {
    alert("Load an audio file first.");
  }
}

function DoDetectClipping() {
  if(audio_loaded) {
    // Downmix First.
    mono_channel = user_audio_buffer.getChannelData(0);
    var clip_intervals = DetectClipping(mono_channel);
  }
  else {
    alert("Load an audio file first.");
  }

}
