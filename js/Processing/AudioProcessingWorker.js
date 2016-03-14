/*****************************************************************************\
 *                        AudioProcessingWorker.js                           *
 *  This web worker that processes a channel of audio.                       *
 *****************************************************************************/
var channel_idx = -1;
var progress = 0;
var GAIN = 0.4;

self.importScripts('Declip.js', 
                   '../FFTWrapper.js',
                   '../third_party/nayuki-obj/fft.js');

onmessage = function(e) {
  channel_idx = e.data[0]
  audio_buffer = e.data[1];
  params = e.data[2];
  block_size = params[1];

  InitFFTWrapper(block_size); 
  ApplyGainToChannel(audio_buffer, channel_idx, GAIN, params);

  postMessage([1.1, channel_idx, audio_buffer]);
}