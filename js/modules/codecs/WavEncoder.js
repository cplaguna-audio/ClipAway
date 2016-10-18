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
 *                               WavEncoder.js                               *
 *                                                                           *
 *  Functions to encode an AudioBuffer to a WAV blob.                        *
 *                                                                           *
 *****************************************************************************/

 define([
    /* Includes go here. */
  ], function() {

  /* 
   * Implemented with the help of these references: 
   * 1. http://typedarray.org/from-microphone-to-wav-with-getusermedia-and-web-audio/
   * 2. https://github.com/mattdiamond/Recorderjs
   */
  function AudioBufferToWavBlob(audio_buffer) {
    var num_channels = audio_buffer.numberOfChannels;
    var fs = audio_buffer.sampleRate;
    if(num_channels > 2) {
      console.log("Encoding > 2 channels is not yet supported. Only writing first two channels.");
    }

    // Interleave channels.
    if(num_channels == 1) {
      var interleaved = audio_buffer.getChannelData(0);
    }
    else if(num_channels == 2) {
      var interleaved = Interleave(audio_buffer.getChannelData(0), audio_buffer.getChannelData(1));
    }
    var num_interleaved_samples = interleaved.length;
    
    // Raw data of the .wav file.
    var buffer = new ArrayBuffer(44 + num_interleaved_samples * 2);
    var view = new DataView(buffer);

    // The WAV header.
    // RIFF identifier.
    writeString(view, 0, 'RIFF');
    // RIFF chunk length.
    view.setUint32(4, 36 + num_interleaved_samples * 2, true);
    // RIFF type.
    writeString(view, 8, 'WAVE');
    // Format chunk identifier.
    writeString(view, 12, 'fmt ');
    // Format chunk length.
    view.setUint32(16, 16, true);
    // Sample format (raw).
    view.setUint16(20, 1, true);
    // Channel count.
    view.setUint16(22, num_channels, true);
    // Sample rate.
    view.setUint32(24, fs, true);
    // Byte rate (sample rate * block align).
    view.setUint32(28, fs * 4, true);
    // Block align (channel count * bytes per sample).
    view.setUint16(32, num_channels * 2, true);
    // Bits per sample.
    view.setUint16(34, 16, true);
    // Data chunk identifier.
    writeString(view, 36, 'data');
    // Data chunk length.
    view.setUint32(40, num_interleaved_samples * 2, true);

    // Write the PCM samples.
    var offset = 44;
    for (var i = 0; i < num_interleaved_samples; i++){
      view.setInt16(offset, interleaved[i] * 0x7FFF, true);
      offset += 2;
    }

    var blob = new Blob([view], { type : 'audio/wav' });
    return blob;
  }

  function Interleave(left_channel, right_channel){
    var total_length = left_channel.length + right_channel.length;
    var result = new Float32Array(total_length);
   
    var input_index = 0;
   
    for(var index = 0; index < total_length; ) {
      result[index] = left_channel[input_index];
      index++;
      result[index] = right_channel[input_index];
      index++;
      input_index++;
    }
    return result;
  }

  function writeString(view, offset, string){
    for(var i = 0; i < string.length; i++){
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /* Public variables go here. */
  return {
      AudioBufferToWavBlob: AudioBufferToWavBlob,
  };
});
