/*****************************************************************************\
 *                                 Delcip.js                                 *
 *                                                                           *
 *  Declipping implementation (sample replacement). For now, a placeholder   *
 *  processing unit (gain) is implemented to test the wave interactor.       *
 *****************************************************************************/

/*
 * Do a cubic spline interpolation to fix short bursts. The idea is that short
 * bursts consist of a single peak in the waveform, so a smooth interpolation 
 * should be good enough. For speed, we build our spline using at most
 * |MAX_TRAIN_SIZE| samples to the left and right of the burst.
 */
function DeclipShortBurstsInPlace(channel, clip_intervals, channel_idx, params) {
  var channel_length = channel.length;

  /* 
   * If we have < MIN_TRAIN samples either to the left or to the right, we don't
   * have enough samples to build reliable splines. We have to ignore the
   * interval.
   */
  var MIN_TRAIN = 3;
  var MAX_TRAIN_SIZE = 20;

  // Do a separate interpolation for each clip interval.
  for(var interval_idx = 0; interval_idx < clip_intervals.length; interval_idx++) {
    var cur_interval = clip_intervals[interval_idx];
    var burst_start = cur_interval.start;
    var burst_stop = cur_interval.stop;
    var num_burst_samples = burst_stop - burst_start + 1;
    
    // These intervals are used to find the reliable samples surrounding the
    // current clip interval.
    var has_prev_interval = interval_idx > 0;
    var prev_interval = 0;
    if(has_prev_interval) {
      prev_interval = clip_intervals[interval_idx - 1];
    }

    var has_next_interval = interval_idx < clip_intervals.length - 1;
    var next_interval = 0;
    if(has_next_interval) {
      next_interval = clip_intervals[interval_idx + 1];
    }
    
    // Find the consecutive reliable samples to the left and right of the
    // burst.
    var left_start = 1;
    if(has_prev_interval) {
      left_start = prev_interval.stop + 1;
    }
    var left_stop = burst_start - 1;
    var num_left_samples = left_stop - left_start + 1;
    if(num_left_samples > MAX_TRAIN_SIZE) {
      left_start = left_stop - MAX_TRAIN_SIZE + 1;
      num_left_samples = left_stop - left_start + 1;
    }    

    var right_start = burst_stop + 1;
    var right_stop = channel_length - 1;
    if(has_next_interval) {
      right_stop = next_interval.start - 1;
    }
    var num_right_samples = right_stop - right_start + 1;
    if(num_right_samples > MAX_TRAIN_SIZE) {
      right_stop = right_start + MAX_TRAIN_SIZE - 1;
      num_right_samples = right_stop - right_start + 1;
    }

    if(num_left_samples < MIN_TRAIN || num_right_samples < MIN_TRAIN) {
      continue;
    }
    
    // TODO: Move these indices outside of the loop, aka make this efficient.
    var left_samples = new Float32Array(num_left_samples);
    var right_samples = new Float32Array(num_right_samples);

    CopyToBlock(channel, channel_length, left_start, left_stop, left_samples, left_samples.length); 
    CopyToBlock(channel, channel_length, right_start, right_stop, right_samples, right_samples.length); 

    var left_indices = new Float32Array(num_left_samples);
    RangeToIndices(left_indices, left_start, left_stop);

    var right_indices = new Float32Array(num_right_samples);
    RangeToIndices(right_indices, right_start, right_stop);

    var unknown_indices = new Float32Array(num_burst_samples);
    RangeToIndices(unknown_indices, burst_start, burst_stop);
    
    var replacements = CubicSplineInterpolation(left_indices, left_samples, right_indices, right_samples, unknown_indices);
    CopyToChannel(channel, channel_length, burst_start, burst_stop, replacements, replacements.length);
  }
}

function ApplyGainToChannel(in_channel, out_channel, channel_idx, gain, params) {
  block_size = params[1];
  hop_size = params[2];
  channel_length = in_channel.length;

  var cur_block = new Float32Array(block_size);
  var cur_window = HannWindow(block_size);

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

    CopyToBlock(in_channel, channel_length, start_idx, stop_idx, cur_block, block_size); 

    FFT(cur_block, imag_input, fft_real, fft_imag);
    GetMagnitudeAndPhase(fft_real, fft_imag, fft_mag, fft_phase);

    for(var bin_idx = 0; bin_idx < block_size; bin_idx++) {
      if(bin_idx > 50 && bin_idx < 452) {
        fft_mag[bin_idx] = 0;
      }
      else {
      }
    }

    GetRealAndImag(fft_mag, fft_phase, fft_real, fft_imag);
    IFFT(fft_real, fft_imag, cur_block, imag_output);

    // Apply window.
    SignalPointwiseMultiplyInPlace(cur_block, cur_window);

    OverlapAndAdd(out_channel, channel_length, start_idx, stop_idx, cur_block, block_size);
    start_idx = start_idx + hop_size;
    stop_idx = start_idx + block_size - 1;
    block_idx++;
  }

  // Window Compensation.
  var num_blocks = block_idx;
  var window_compensation = new Float32Array(channel_length);
  start_idx = 0;
  stop_idx = block_size - 1;
  for(var block_idx = 0; block_idx < num_blocks; block_idx++) {
    OverlapAndAdd(window_compensation, channel_length, start_idx, stop_idx, cur_window, block_size);
    start_idx = start_idx + hop_size;
    stop_idx = start_idx + block_size - 1;
  }
  
  // Ensure we don't divide by zero.
  for(var signal_idx = 0; signal_idx < channel_length; signal_idx++) {
    if(window_compensation[signal_idx] < 0.01) {
      window_compensation[signal_idx] = 0.01;
    }
  }
  
  SignalPointwiseDivideInPlace(out_channel, window_compensation);
}
