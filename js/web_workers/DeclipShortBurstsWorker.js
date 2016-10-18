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
 *                           DeclipShortBursts.js                            *
 *  The web worker that declips short bursts by interpolating using cubic    *
 *  spline interpolation.                                                    *
 *****************************************************************************/

self.importScripts('../third_party/requirejs/require.js');

require({
        baseUrl: '../'
    }, [
      'modules/signal_processing/Blocking',
      'modules/signal_processing/CubicSplineInterpolation',
      'modules/signal_processing/SignalProcessing',
      'modules/declipping/ClipIntervalUtilities',
      'modules/declipping/Declip'
    ], function(Blocking, 
                CubicSplineInterpolation,
                SignalProcessing, 
                ClipIntervalUtilities,
                Declip) {

  var channel_idx = -1;
  var progress = 0;

  /*
   *  Input:
   *    e.data[0]: channel index
   *    e.data[1]: input audio buffer (Float32Array)
   *    e.data[2]: short_clip_intervals of this channel
   *    e.data[3]: params
   *      params[0]: sample rate
   *
   *  Output:
   *    [0]: progress
   *    [1]: channel_idx
   *    [2]: processed channel
   */
  onmessage = function(e) {
    var channel_idx = e.data[0];
    var audio_buffer = e.data[1];
    var clip_intervals = e.data[2];
    var params = e.data[3];

    Declip.DeclipShortBurstsInPlace(audio_buffer, clip_intervals, channel_idx, params);

    postMessage([1.1, channel_idx, audio_buffer]);
  }
});