/*****************************************************************************\
 *                         GetKnownPointsWorker.js                           *
 *  The web worker that gets points at which the fft magnitudes are known.   *
 *  Long bursts are replaced by interpolating these magnitudes.
 *****************************************************************************/
var channel_idx = -1;
var progress = 0;

self.importScripts('Blocking.js',
                   'Declip.js',
                   '../ClipIntervalUtilities.js',
                   '../FFTWrapper.js',
                   '../SignalProcessing.js',
                   '../third_party/nayuki-obj/fft.js');

/*
 *  Input:
 *    e.data[0]: channel index
 *    e.data[1]: input audio buffer (Float32Array)
 *    e.data[2]: long_clip_intervals of this channel
 *    e.data[4]: params
 *      params[0]: sample rate
 *      params[1]: block size
 *      params[2]: hop size
 *      params[3]: mininum number of consecutive samples in order for a zero-padded
 *                 fft to be worthwhile.
 *
 *  Output:
 *    [0]: progress
 *    [1]: channel_idx
 *    [2]: known points
 */
onmessage = function(e) {
  var channel_idx = e.data[0];
  var audio_buffer = e.data[1];
  var clip_intervals = e.data[2];
  var params = e.data[3];
  var fs = params[0];
  var block_size = params[1];

  InitFFTWrapper(block_size);

  var channel_bands = SplitIntoBands(audio_buffer, fs);
  var channel_low_band = channel_bands[0];
  var channel_high_band = channel_bands[1];

  /* 
   * Filtering expands the clipping regions by the length of the filter's 
   * impluse response. We need to enlarge the clip intervals to reflect this.
   */
  var filter_order = channel_bands[2];
  high_clip_intervals = EnlargeIntervals(clip_intervals, filter_order * 2, audio_buffer.length);

  var known_points = GetAllKnownPoints(channel_high_band, high_clip_intervals, channel_idx, params);

  postMessage([1.1, channel_idx, known_points]);
}