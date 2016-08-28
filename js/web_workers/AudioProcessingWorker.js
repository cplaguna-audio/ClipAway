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
 *                        AudioProcessingWorker.js                           *
 *  The web worker that processes a channel of audio.                        *
 *****************************************************************************/
var channel_idx = -1;
var progress = 0;
var GAIN = 0.4;

self.importScripts('../modules/declipping/Declip.js', 
                   '../modules/signal_processing/Blocking.js',
                   '../modules/signal_processing/FFTWrapper.js',
                   '../modules/signal_processing/SignalProcessing.js',
                   '../third_party/nayuki-obj/fft.js');

/*
 *  Input:
 *    e.data[0]: channel index
 *    e.data[1]: input audio buffer (Float32Array)
 *    e.data[2]: params
 *      params[0]: sample rate
 *      params[1]: block size
 *      params[2]: hop size
 *
 *  Output:
 *    [0]: progress
 *    [1]: channel_idx
 *    [2]: output audio (Float32Array) 
 */
onmessage = function(e) {
  channel_idx = e.data[0];
  audio_buffer = e.data[1];
  params = e.data[2];
  block_size = params[1];

  InitFFTWrapper(block_size); 
  out_buffer = new Float32Array(audio_buffer.length);
  ApplyGainToChannel(audio_buffer, out_buffer, channel_idx, GAIN, params);

  postMessage([1.1, channel_idx, out_buffer]);
}