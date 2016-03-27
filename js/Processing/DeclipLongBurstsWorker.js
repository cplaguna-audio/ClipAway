/*****************************************************************************\
 *                         DeclipLongBurstsWorker.js                         *
 *  The web worker that declips long bursts.                                 *
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
 *    e.data[3]: known points for interpolation.
 *    e.data[4]: params
 *      params[0]: sample rate
 *      params[1]: block size
 *      params[2]: hop size
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
  var known_points = e.data[3];
  var params = e.data[4];
  var block_size = params[1];
  
  InitFFTWrapper(block_size);
  var processed_audio = DeclipLongBursts(audio_buffer, clip_intervals, known_points, channel_idx, params);

  postMessage([1.1, channel_idx, processed_audio]);
}