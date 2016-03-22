/*****************************************************************************\
 *                        AudioProcessingWorker.js                           *
 *  The web worker that processes a channel of audio.                        *
 *****************************************************************************/
var channel_idx = -1;
var progress = 0;
var GAIN = 0.4;

self.importScripts('Blocking.js',
                   'Declip.js', 
                   '../FFTWrapper.js',
                   '../SignalProcessing.js',
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