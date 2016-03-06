/*****************************************************************************\
 *                             WebAudioUtils.js                              *
 *                                                                           *
 *  Utility functions for the web audio api.                                 *
 *                                                                           *
 *****************************************************************************/

function CopyAudioBuffer(audio_context, audio_buffer) {
  var num_channels = audio_buffer.numberOfChannels;
  var sample_rate = audio_buffer.sampleRate;
  var buffer_length = audio_buffer.length;
  var buffer_copy = audio_context.createBuffer(num_channels, buffer_length, sample_rate);

  for(var channel_idx = 0; channel_idx < num_channels; channel_idx++) {
    cur_input_channel = audio_buffer.getChannelData(channel_idx);
    cur_output_channel = buffer_copy.getChannelData(channel_idx);
    for (var sample_idx = 0; sample_idx < buffer_length; sample_idx++ ) {
      cur_output_channel[sample_idx] = cur_input_channel[sample_idx];
    }
  }

  return buffer_copy;
}