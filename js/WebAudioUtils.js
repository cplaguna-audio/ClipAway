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
 *                             WebAudioUtils.js                              *
 *                                                                           *
 *  Utility functions for the web audio api.                                 *
 *                                                                           *
 *****************************************************************************/

define([
    /* Includes go here. */
  ], function() {

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

  /* Public variables go here. */
  return {
      CopyAudioBuffer: CopyAudioBuffer
  };
});