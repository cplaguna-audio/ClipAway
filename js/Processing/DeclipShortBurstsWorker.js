/*****************************************************************************\
 *                           DeclipShortBursts.js                            *
 *  The web worker that declips short bursts by interpolating using cubic    *
 *  spline interpolation.                                                    *
 *****************************************************************************/
var channel_idx = -1;
var progress = 0;

self.importScripts('Blocking.js',
                   'Declip.js',
                   '../ClipIntervalUtilities.js',
                   '../CubicSplineInterpolation.js',
                   '../SignalProcessing.js');

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

  DeclipShortBurstsInPlace(audio_buffer, clip_intervals, channel_idx, params);

  postMessage([1.1, channel_idx, audio_buffer]);
}