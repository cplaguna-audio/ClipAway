/*****************************************************************************\
 *                                 Delcip.js                                 *
 *                                                                           *
 *  Declipping implementation (sample replacement). For now, a placeholder   *
 *  processing unit (gain) is implemented to test the wave interactor.       *
 *****************************************************************************/

function CopyToBlock(channel, channel_length, start_idx, stop_idx, block, block_length) {

  for(var channel_idx = start_idx, block_idx = 0; 
      channel_idx <= stop_idx; 
      channel_idx++, block_idx++) {
    
    if(block_idx < block_length) {
      if(channel_idx < channel_length) {
        block[block_idx] = channel[channel_idx];
      }
      else {
        block[block_idx] = 0;
      }
    }
  }

}

function CopyToChannel(channel, channel_length, start_idx, stop_idx, block, block_length) {

  for(var channel_idx = start_idx, block_idx = 0; 
      channel_idx <= stop_idx; 
      channel_idx++, block_idx++) {
    
    if(channel_idx < channel_length) {
      if(block_idx < block_length) {
        channel[channel_idx] = block[block_idx];
      }
      else {
        channel[channel_idx] = 0;
      }
    }
  }

}

function OverlapAndAdd(channel, channel_length, start_idx, stop_idx, block, block_length) {
  for(var channel_idx = start_idx, block_idx = 0; 
      channel_idx <= stop_idx; 
      channel_idx++, block_idx++) {
    
    if(block_idx < block_length) {
      if(channel_idx < channel_length) {
        channel[channel_idx] = channel[channel_idx] + block[block_idx];
      }
    }
  }
}

function ApplyGainToChannel(channel, channel_idx, gain, params) {
  block_size = params[1];
  hop_size = params[2];
  channel_length = channel.length;

  var cur_block = new Float32Array(block_size);

  var start_idx = 0;
  var stop_idx = start_idx + block_size - 1;
  var block_idx = 0;

  var fft_real = new Float32Array(block_size);
  var fft_imag = new Float32Array(block_size);
  var fft_mag = new Float32Array(block_size);
  var fft_phase = new Float32Array(block_size);

  var imag_input = new Float32Array(block_size);

  // We don't care about this, but we need a spot to write the ifft imaginary
  // output.
  var imag_output = new Float32Array(block_size);

  // Input is real, so we need to zero out the imaginary.
  for(var imag_idx = 0; imag_idx < block_size; imag_idx++) {
    fft_imag[imag_idx] = 0;
  }

  // Gain, in the frequency domain.
  while(stop_idx < channel_length) {
    var cur_progress = start_idx / channel_length;
    postMessage([cur_progress, channel_idx]);

    CopyToBlock(channel, channel_length, start_idx, stop_idx, cur_block, block_size);

    FFT(cur_block, imag_input, fft_real, fft_imag);
    GetMagnitudeAndPhase(fft_real, fft_imag, fft_mag, fft_phase);

    for(var bin_idx = 0; bin_idx < block_size; bin_idx++) {
      fft_mag[bin_idx] = fft_mag[bin_idx] * gain;
    }

    GetRealAndImag(fft_mag, fft_phase, fft_real, fft_imag);
    IFFT(fft_real, fft_imag, cur_block, imag_output);

    CopyToChannel(channel, channel_length, start_idx, stop_idx, cur_block, block_size);
    start_idx = start_idx + hop_size;
    stop_idx = start_idx + block_size - 1;
    block_idx++;
  }
}
