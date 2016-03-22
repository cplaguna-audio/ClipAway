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
  channel_idx = e.data[0];
  audio_buffer = e.data[1];
  params = e.data[2];
  block_size = params[1];

  clip_intervals = DetectClipping(audio_buffer, params);
  split_clip_intervals = SplitClipIntervals(clip_intervals, SHORT_BURST_CUTOFF_SAMPLES);

  postMessage([1.1, channel_idx, split_clip_intervals[0], split_clip_intervals[1]]);
}