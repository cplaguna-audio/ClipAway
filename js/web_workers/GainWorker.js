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
 *                                  Gain.js                                  *
 *  The web worker to apply a gain to a channel of audio.                    *
 *****************************************************************************/
self.importScripts('../third_party/requirejs/require.js');

require({
        baseUrl: '../'
    }, [
      'modules/signal_processing/SignalProcessing'
    ], function(SignalProcessing) {

  var channel_idx = -1;

  /*
   *  Input:
   *    e.data[0]: channel index
   *    e.data[1]: input audio buffer (Float32Array)
   *    e.data[2]: params
   *      params[0]: sample rate
   *      params[1]: block size
   *      params[2]: hop size
   *    e.data[3]: do_input_buffer
   *
   *  Output:
   *    [0]: progress
   *    [1]: channel_idx
   *    [2]: output audio (Float32Array) 
   *    [3]: do_input_buffer
   */
  onmessage = function(e) {
    channel_idx = e.data[0];
    var audio_buffer = e.data[1];
    var params = e.data[2];
    var gain = params[0];
    var do_input_buffer = e.data[3];

    var out_buffer = SignalProcessing.SignalScale(audio_buffer, gain);
    postMessage([1.1, channel_idx, out_buffer, do_input_buffer]);
  }

});