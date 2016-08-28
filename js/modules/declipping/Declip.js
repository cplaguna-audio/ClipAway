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
    var cur_progress = interval_idx / clip_intervals.length;
    postMessage([cur_progress, channel_idx]);

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

function DeclipLongBursts(channel, clip_intervals, known_points, channel_idx, params) {
  var fs = params[0];

  var channel_length = channel.length;

  // Split audio into a low and high band, and only process the high band.
  var channel_bands = SplitIntoBands(channel, fs);
  var channel_low_band = channel_bands[0];
  var channel_high_band = channel_bands[1];

  /* 
   * Filtering expands the clipping regions by the length of the filter's 
   * impluse response. We need to enlarge the clip intervals to reflect this.
   */
  var filter_order = channel_bands[2];
  high_clip_intervals = EnlargeIntervals(clip_intervals, filter_order * 2, channel_length);

  /*
   * low_clip_intervals = XThinIntervals(clip_intervals, params.low_thin_length); 
   * low_clip_intervals = XMergeIntervalsSign(low_clip_intervals, params.low_merge_length);
   */

  // Replace the high band.
  DeclipLongBurstsHighBandInPlace(channel_high_band, high_clip_intervals, known_points, channel_idx, params);

  // TODO: Replace long bursts in low band.
  // y_low_band = XReplaceLongBurstsLow(y_low_band, low_clip_intervals, fs, params);

  var declipped_channel = SignalAdd(channel_high_band, channel_low_band);
  return declipped_channel;
}

function DeclipLongBurstsHighBandInPlace(high_band, clip_intervals, known_points, channel_idx, params) {

  var fs = params[0];
  var block_size = params[1];
  var hop_size = params[2];

  // Compute this up front to avoid recomputing.
  var hann_window = HannWindow(block_size);

  var x_length = high_band.length;
  var num_clip_intervals = clip_intervals.length;
  var clip_segments = GetClipSegments(clip_intervals, block_size, hop_size, x_length);
  var num_clip_segments = clip_segments.length;
  
  // For each interval of unreliable blocks, create replacement blocks.
  for(var segment_idx = 0; segment_idx < num_clip_segments - 1; segment_idx++) {

    var cur_progress = segment_idx / num_clip_segments;
    postMessage([cur_progress, channel_idx]);

    var cur_clip_segment = clip_segments[segment_idx];    
    
    // Time domain.
    var cur_replacements = ReplaceClipSegment(high_band, cur_clip_segment, known_points, block_size, hop_size, hann_window);
    var num_replacement_samples = cur_replacements.length;
    
    // Get the start and stop samples of the current segment, in order to
    // write to the outbut buffer.
    var start_block_idx = cur_clip_segment.start;
    var start_block_sample_idx = BlockIdxToSampleIdx(start_block_idx, hop_size);
    var stop_block_idx = cur_clip_segment.stop;
    var stop_block_sample_idx = BlockIdxToSampleIdx(stop_block_idx, hop_size);

    // Fade the replacement in/out.
    var fade_size = block_size / 2;
    CrossFadeReplacementsInPlace(high_band, cur_replacements, start_block_sample_idx, stop_block_sample_idx, hann_window);
  }


  return high_band;
}

function ReplaceClipSegment(x, clip_segment, known_points, block_size, hop_size, hann_window) {
  var x_length = x.length;
  var start_block_idx = clip_segment.start;
  var stop_block_idx = clip_segment.stop;

  var read_offset = BlockIdxToSampleIdx(start_block_idx, hop_size);

  var num_replacement_blocks = stop_block_idx - start_block_idx + 1; 

  var num_replacement_samples = ((num_replacement_blocks - 1) * hop_size) + block_size;
  var replacements = new Float32Array(num_replacement_samples);
  var window_compensation = new Float32Array(num_replacement_samples);

  var cur_block = new Float32Array(block_size);
  var fft_imag_input = new Float32Array(block_size);
  var ifft_imag_output = new Float32Array(block_size);
  var fft_real_output = new Float32Array(block_size);
  var fft_imag_output = new Float32Array(block_size);
  var clipped_mags = new Float32Array(block_size);
  var clipped_phase = new Float32Array(block_size);
  var estimate_mags = new Float32Array(block_size);
  for(var block_idx = start_block_idx; block_idx <= stop_block_idx; block_idx++) {
    var block_start_sample_idx = BlockIdxToSampleIdx(block_idx, hop_size);
    var block_stop_sample_idx = block_start_sample_idx + block_size - 1;
    CopyToBlock(x, x_length, block_start_sample_idx, block_stop_sample_idx, cur_block, block_size);

    // Window.
    SignalPointwiseMultiplyInPlace(cur_block, hann_window);
    FFTShift(cur_block);

    FFT(cur_block, fft_imag_input, fft_real_output, fft_imag_output);

    GetFFTMagnitudeAndPhase(fft_real_output, fft_imag_output, clipped_mags, clipped_phase);
    
    var cur_time = block_start_sample_idx + Math.ceil(block_size / 2);
    LinearInterpolate(known_points, cur_time, block_size, estimate_mags);
    
    // Don't use estimates when they are bad.
    for(var freq_idx = 0; freq_idx < block_size; freq_idx++) {
      if(estimate_mags[freq_idx] > clipped_mags[freq_idx]) {
        estimate_mags[freq_idx] = clipped_mags[freq_idx];
      }
    }
    
    GetFFTRealAndImag(estimate_mags, clipped_phase, fft_real_output, fft_imag_output)

    IFFT(fft_real_output, fft_imag_output, cur_block, ifft_imag_output)
    IFFTShift(cur_block);
    SignalPointwiseMultiplyInPlace(cur_block, hann_window);

    var write_start = block_start_sample_idx - read_offset;
    var write_stop = block_stop_sample_idx - read_offset;
    OverlapAndAdd(replacements, num_replacement_samples, write_start, write_stop, cur_block, block_size);
    OverlapAndAdd(window_compensation, num_replacement_samples, write_start, write_stop, hann_window, block_size);
  }

  // Ensure we don't divide by zero.
  for(var x_idx = 0; x_idx < x_length; x_idx++) {
    if(window_compensation[x_idx] < 0.00001) {
      window_compensation[x_idx] = 1;
    }
  }
  
  SignalPointwiseDivideInPlace(replacements, window_compensation);
  return replacements;
}

function LinearInterpolate(known_points, querry_time, block_size, estimate_mags) {
  var block_size = estimate_mags.length;

  // Search for the points closest to the querry time. This is made easier by the
  // fact that the known points are sorted by time. TODO: Binary search is faster.
  var num_points = known_points.length;
  for(var time_idx = 0; time_idx < num_points - 1; time_idx++) {
    var left_point = known_points[time_idx];
    var right_point = known_points[time_idx + 1];

    var left_time = left_point.time;
    var right_time = right_point.time;
    if(querry_time >= left_time && querry_time <= right_time) {
      var left_magnitudes = left_point.magnitudes;
      var right_magnitudes = right_point.magnitudes;

      var left_weight = Math.abs(querry_time - right_time) / (right_time - left_time);
      var right_weight = 1 - left_weight;

      for(var freq_idx = 0; freq_idx < block_size; freq_idx++) {
        estimate_mags[freq_idx] = (left_magnitudes[freq_idx] * left_weight) + (right_magnitudes[freq_idx] * right_weight);
      }
      return;
    }
  }
}

function CrossFadeReplacementsInPlace(x, replacements, write_start_idx, write_stop_idx, fade_window) {
  var x_length = x.length;
  var num_replacement_samples = replacements.length;
  var block_size = fade_window.length;
  var fade_size = Math.ceil(block_size / 2);

  // TODO: Don't need allocation here.
  var fade_in_curve = new Float32Array(fade_size);
  CopyToBlock(fade_window, block_size, 0, fade_size - 1, fade_in_curve, fade_size);
  var fade_out_curve = new Float32Array(fade_size);
  for(var idx = 0; idx < fade_size; idx++) {
    fade_out_curve[idx] = 1 - fade_in_curve[idx];
  }
  
  // On the left, fade in the replacements.
  var left_fade_in_start = 0;
  var left_fade_in_stop = fade_size - 1;

  // On the left, fade out x.
  var left_fade_out_start = write_start_idx;
  var left_fade_out_stop = left_fade_out_start + fade_size - 1;
  
  // On the right, fade in x.
  var right_fade_in_stop = write_stop_idx + block_size - 1;
  var right_fade_in_start = right_fade_in_stop - (fade_size - 1);

  // On the right, fade out the replacements.
  var right_fade_out_stop = num_replacement_samples - 1;
  var right_fade_out_start = right_fade_out_stop - (fade_size - 1);
  
  // Fade on the left side.
  var left_fade_in = new Float32Array(fade_size);
  CopyToBlock(replacements, num_replacement_samples, left_fade_in_start, left_fade_in_stop, left_fade_in, fade_size);
  SignalPointwiseMultiplyInPlace(left_fade_in, fade_in_curve);

  var left_fade_out = new Float32Array(fade_size);
  CopyToBlock(x, x_length, left_fade_out_start, left_fade_out_stop, left_fade_out, fade_size);
  SignalPointwiseMultiplyInPlace(left_fade_out, fade_out_curve);
  
  var crossfade_result = SignalAdd(left_fade_in, left_fade_out);
  CopyToChannel(x, x_length, left_fade_out_start, left_fade_out_stop, crossfade_result, fade_size);
  
  // Write over the middle.
  var write_start = left_fade_out_stop + 1;
  var write_stop = right_fade_in_start - 1;
  var read_start = fade_size;
  var read_stop = num_replacement_samples - 1 - fade_size;

  // TODO: We don't need this middle copy if we write another CopyToChannel()
  // that takes start/stop indices for the reading from block.
  var num_middle_replacements = read_stop - read_start + 1;
  var middle_replacements = new Float32Array(num_middle_replacements);
  CopyToBlock(replacements, num_replacement_samples, read_start, read_stop, middle_replacements, num_middle_replacements);
  CopyToChannel(x, x_length, write_start, write_stop, middle_replacements, num_middle_replacements);
  
  // Fade on the right side. TODO: Can reuse the memory from the left crossfade.
  var right_fade_in = new Float32Array(fade_size);
  CopyToBlock(x, x_length, right_fade_in_start, right_fade_in_stop, right_fade_in, fade_size);
  SignalPointwiseMultiplyInPlace(right_fade_in, fade_in_curve);

  var right_fade_out = new Float32Array(fade_size);
  CopyToBlock(replacements, num_replacement_samples, right_fade_out_start, right_fade_out_stop, right_fade_out, fade_size);
  SignalPointwiseMultiplyInPlace(right_fade_out, fade_out_curve);

  crossfade_result = SignalAdd(right_fade_in, right_fade_out);
  CopyToChannel(x, x_length, right_fade_in_start, right_fade_in_stop, crossfade_result, fade_size);
}

/*
 * Splits x into low and high frequency bands. |x| is lowpass filtered to get
 * the low band. The high band is obtained by subtracting the low band from x.
 * This method allows us to reconstruct x by adding the low and high bands.
 *
 * The lowpas filter is applied forwards and backwards to ensure zero phase, 
 * which means that the clipping regions will remain in the same locations. Each
 * clipping regions is, however, extended by the length of the impulse response
 * on either side.
 *
 * The lowpass filter was designed using Matlab's fdesign. The cutoff frequency is
 * 100 Hz, and it is meant to maximize steepness and minimize impulse response 
 * length. The steepness influences how good the separation between bands is, 
 * while the impulse response length determines how much the filter expands the
 * clipping intervals.
 *
 * Returns [low_band, high_band, filter_order]. The filter-order is returned so 
 * we can update our clip intervals to reflect the processing.
 *
 * TODO: Define filters for other sample rates.
 */
function SplitIntoBands(x, fs) {
  var ff_coefficients_44100 = [0.1304, 0.0218, 0.0233, 0.0248, 0.0262, 0.0276, 0.0288,
                               0.0299, 0.0307, 0.0314, 0.0319, 0.0325, 0.0326, 0.0326,
                               0.0325, 0.0319, 0.0314, 0.0307, 0.0299, 0.0288, 0.0276,
                               0.0262, 0.0248, 0.0233, 0.0218, 0.1304];
  if(fs == 44100) {
    var ff_coeffs = ff_coefficients_44100;
    var filter_order = 25;
  }
  else {
    console.log("Warning (SplitIntoBands()): unsupported sample rate: " + fs.toString());
    return x;
  }

  var low_band = ApplyFeedForwardFilter(x, ff_coeffs);
  var low_band = ApplyFeedForwardFilterBackwards(low_band, ff_coeffs);
  var high_band = SignalSubtract(x, low_band);
  return [low_band, high_band, filter_order];
}

function GetAllKnownPoints(x, clip_intervals, channel_idx, params) {
  var fs = params[0];
  var block_size = params[1];
  var hop_size = params[2];
  var min_fft_length = params[3];

  // Compute this up front to avoid recomputing.
  var big_window = HannWindow(block_size);

  var x_length = x.length;
  var num_clip_intervals = clip_intervals.length;
  var clip_segments = GetClipSegments(clip_intervals, block_size, hop_size, x_length);
  var num_clip_segments = clip_segments.length;

  /*
   * A zero-padded fft needs to be normalized--otherwise, it will have a smaller
   * magnitude than a non-zero-padded fft. We normalize so that the log-l2-norm
   * of the windowing function (note that the windowing function differs based 
   * on the amount of zero padding necessary) equals the log-l2-norm of a block 
   * of ones. Note that the l2-norm of a block of |block_size| ones is equal to
   * sqrt(block_size).
   */
  var desired_log_energy = Math.log(Math.sqrt(block_size));
  
  var known_points = [];
  var num_known_points = 0;
  for(var segment_idx = 0; segment_idx < num_clip_segments; segment_idx++) {
    var cur_progress = segment_idx / num_clip_segments;
    postMessage([cur_progress, channel_idx]);

    var cur_segment = clip_segments[segment_idx];

    var segment_start_block_idx = cur_segment.start;
    var segment_stop_block_idx = cur_segment.stop;
    var segment_start_sample_idx = BlockIdxToSampleIdx(segment_start_block_idx, hop_size);
    var segment_stop_sample_idx = BlockIdxToSampleIdx(segment_stop_block_idx, hop_size) + block_size - 1;
   
    /*
     * For each segment, get a known point to the left and right of it.
     * We want to account for any reliable samples inside of the block, so
     * we need to get these points based on the clip_interval information,
     * not the clip_block information.
     */
    var leftmost_clip_interval_idx = GetIdxOfLeftmostClipInterval(clip_intervals, segment_start_sample_idx);
    var leftmost_clip_interval = clip_intervals[leftmost_clip_interval_idx];
    var left_stop = leftmost_clip_interval.start - 1;
    if(leftmost_clip_interval_idx === 0) {
      left_start = 1;
    }
    else {
      var adjacent_interval = clip_intervals[leftmost_clip_interval_idx - 1];
      var left_start = adjacent_interval.stop + 1;
    }

    var left_block_length = left_stop - left_start + 1;

    // Trim the block down to the block size.
    if(left_block_length > block_size) {
      left_start = left_stop - (block_size - 1);
      left_block_length = block_size;
    }
    
    // If we go out of the signal range, just assume a block of zeros.
    if(left_stop < 0) {
      var left_time = 1;
      var left_mags = new Float32Array(block_size);
      var left_known_point = { magnitudes: left_mags, time: left_time };
    }
    else {
      var left_known_block = new Float32Array(left_block_length);
      CopyToBlock(x, x_length, left_start, left_stop, left_known_block, left_block_length);
      var left_known_points = GetLocalKnownPoints(left_known_block, big_window, desired_log_energy, block_size, min_fft_length, left_start);

      // We know that there is only one point because we trimmed the size already.
      var left_known_point = left_known_points[0];
    }  
    known_points[num_known_points] = left_known_point;
    num_known_points++;

    // All known points within the segment are extracted here.

    // The known points are going to be between the clip_intervals.
    var cropped_clip_intervals = CropIntervals(clip_intervals, segment_start_sample_idx, segment_stop_sample_idx);
    var reliable_intervals = InvertIntervals(cropped_clip_intervals, segment_start_sample_idx, segment_stop_sample_idx);
    var reliable_intervals = ThinIntervals(reliable_intervals, min_fft_length);
    var num_reliable_intervals = reliable_intervals.length;
    for(var interval_idx = 0; interval_idx < num_reliable_intervals; interval_idx++) {
      var cur_interval = reliable_intervals[interval_idx];
      var cur_interval_length = cur_interval.stop - cur_interval.start + 1;

      var cur_known_block = new Float32Array(cur_interval_length);
      CopyToBlock(x, x_length, cur_interval.start, cur_interval.stop, cur_known_block, cur_interval_length);

      var cur_points = GetLocalKnownPoints(cur_known_block, big_window, desired_log_energy, block_size, min_fft_length, cur_interval.start);
      var num_points = cur_points.length;
      for(var point_idx = 0; point_idx < num_points; point_idx++) {
        var cur_point = cur_points[point_idx];
        known_points[num_known_points] = cur_point;
        num_known_points++;
      }

    }

    // Get the known point on the right of the segment.
    var rightmost_clip_interval_idx = GetIdxOfRightmostClipInterval(clip_intervals, segment_stop_sample_idx);
    var rightmost_clip_interval = clip_intervals[rightmost_clip_interval_idx];
    var right_start = rightmost_clip_interval.stop + 1;
    if(rightmost_clip_interval_idx == num_clip_intervals - 1) {
      var right_stop = x_length;
    }
    else {
      var adjacent_interval = clip_intervals[rightmost_clip_interval_idx + 1];
      var right_stop = adjacent_interval.start - 1;
    }

    var right_block_length = right_stop - right_start + 1;
    
    // Trim the block down to the block size.
    if(right_block_length > block_size) {
      right_stop = right_start + block_size - 1;
      right_block_length = block_size;
    }
    
    // If we go out of the signal range, just assume a block of zeros.
    if(right_start >= x_length) {
      var right_time = 1;
      var right_mags = new Float32Array(right_block_length);
      var right_known_point = { magnitudes: right_mags, time: right_time };
    }
    else {
      var right_known_block = new Float32Array(right_block_length);
      CopyToBlock(x, x_length, right_start, right_stop, right_known_block, right_block_length);
      var right_known_points = GetLocalKnownPoints(right_known_block, big_window, desired_log_energy, block_size, min_fft_length, right_start);
      
      // We know that there is only one point because we trimmed the size already.
      var right_known_point = right_known_points[0];
    }  

    known_points[num_known_points] = right_known_point;
    num_known_points++;
  }

  return known_points;
}

function GetLocalKnownPoints(block, big_window, desired_log_energy, block_size, min_length, start_sample) {
  var fft_output_real = new Float32Array(block_size);
  var fft_output_imag = new Float32Array(block_size);
  var fft_imag_input = new Float32Array(block_size);

  var block_length = block.length;

  // There aren't enough samples to make any blocks. 
  if(block_length < min_length) {
    return [];
  }

  // We have extra samples. Make two blocks, one on the left and one on the 
  // right. Note that we don't need any points in the middle, because there
  // isn't any clipping, so there will be know querry points in the middle.
  if(block_length > block_size) {
    var first_block_start = 1;
    var first_block_stop = first_block_start + block_size - 1;
    var first_block = new Float32Array(block_size);

    // Yeesh, my naming conventions really got the better of me. We want to copy FROM
    // |block| TO |first_block|, because |block| has enough samples for use to do
    // two ffts.
    CopyToBlock(block, block_length, first_block_start, first_block_stop, first_block, block_size);
    
    // Window.
    SignalPointwiseMultiplyInPlace(first_block, big_window);
    FFT(first_block, fft_imag_input, fft_output_real, fft_output_imag);

    var first_mags = new Float32Array(block_size);
    GetFFTMagnitude(fft_output_real, fft_output_imag, first_mags);
    var first_time = start_sample + Math.ceil(block_size / 2);
    var first_known_point = { magnitudes: first_mags, time: first_time };

    var second_block_stop = block_length;
    var second_block_start = second_block_stop - block_size + 1;

    // TODO: We can reuse the same memory from the first block here, if things
    // are too slow.
    var second_block = new Float32Array(block_size);
    CopyToBlock(block, block_length, second_block_start, second_block_stop, second_block, block_size);

    // Window.
    SignalPointwiseMultiplyInPlace(second_block, big_window);
    FFT(second_block, fft_imag_input, fft_output_real, fft_output_imag);

    var second_mags = new Float32Array(block_size);
    GetFFTMagnitude(fft_output_real, fft_output_imag, second_mags);
    var second_time = start_sample + second_block_start - 1 + Math.ceil(block_size / 2);
    var second_known_point = { magnitudes: second_mags, time: second_time };

    return [first_known_point, second_known_point];
  }
  else if(block_length == block_size) {

    // Window.
    SignalPointwiseMultiplyInPlace(block, big_window);
    FFT(block, fft_imag_input, fft_output_real, fft_output_imag);

    var cur_mags = new Float32Array(block_size);
    GetFFTMagnitude(fft_output_real, fft_output_imag, cur_mags)
    var cur_time = start_sample + Math.ceil(block_length / 2);
    var known_point = { magnitudes: cur_mags, time: cur_time };
    return [known_point];
  }
  else {
    var cur_window = HannWindow(block_length);

    // Window.
    SignalPointwiseMultiplyInPlace(block, cur_window);
    var padded_block = ZeroPadForFFT(block, block_size);
    FFT(padded_block, fft_imag_input, fft_output_real, fft_output_imag);

    var cur_mags = new Float32Array(block_size);
    GetFFTMagnitude(fft_output_real, fft_output_imag, cur_mags);

    var cur_window_energy = L2Norm(cur_window);
    var scale_factor = Math.exp(desired_log_energy - Math.log(cur_window_energy));
    var scaled_mags = SignalScale(cur_mags, scale_factor);
    var cur_time = start_sample + Math.ceil(block_length / 2);

    var known_point = { magnitudes: scaled_mags, time: cur_time };
    return [known_point];
  }
}