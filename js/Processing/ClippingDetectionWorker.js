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
 *                       ClippingDetectionWorker.js                          *
 *  The web worker that detects clipping intervals.                          *
 *****************************************************************************/
var channel_idx = -1;
var progress = 0;
var SHORT_BURST_CUTOFF_SAMPLES = 19;

self.importScripts('../ClipIntervalUtilities.js',
                   '../DetectClipping.js',
                   '../SignalProcessing.js');

/*
 *  Input:
 *    e.data[0]: channel index
 *    e.data[1]: input audio buffer (Float32Array)
 *    e.data[2]: params
 *      params[0]: sample rate
 *
 *  Output:
 *    [0]: progress
 *    [1]: channel_idx
 *    [2]: short_clip_intervals: array of clip_interval
 *      clip_interval.start: start idx
 *      clip_interval.stop: stop idx
 *      TODO: clip_interval.sign: sign of clipping (-1 or 1) 
 *    [3]: long_clip_intervals: array of clip_interval (see above)
 */
onmessage = function(e) {
  var channel_idx = e.data[0];
  var audio_buffer = e.data[1];
  var params = e.data[2];
  var block_size = params[1];

  var clip_intervals = DetectClipping(audio_buffer, channel_idx, params);
  var split_clip_intervals = SplitClipIntervals(clip_intervals, SHORT_BURST_CUTOFF_SAMPLES);

  postMessage([1.1, channel_idx, split_clip_intervals[0], split_clip_intervals[1]]);
}