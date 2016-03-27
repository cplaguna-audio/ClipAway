/*****************************************************************************\
 *                             DetectClipping.js                             *
 *                                                                           *
 *  Contains main function and helper functions for detecting clipping.      *
 *                                                                           *
 *****************************************************************************/

/*
 * DetectClipping()
 *
 * Detect the indices of samples where clipping occurs. First, estimations of
 * clipping levels are computed, and then, the sections of the signal which are
 * above the clipping threshold are analyzed and the clipping indices are 
 * determined.
 *
 * Estimating The Clipping Threshold
 * First, note that natural audio signals have a smooth histogram which is 
 * high around the center of the histogram and slowly decays towards the sides.
 * The amplitude distribution of clipped signals is significantly skewed towards
 * the clipping level. So, we can detect the clipping level by analyzing the 
 * signal histogram. First, the histogram of the signal is computed. We search 
 * for 'bumps' in the histogram towards the sides of the signal. To find the
 * bumps, first a novelty function is computed:
 * |novelty = histogram - smoothed_histogram|
 * If a wide enough region of the novelty function is consecutively positive, 
 * then clipping is detected at the amplitude level corresponding to the index
 * of the innermost bin in the bump. Separate positive and negative clipping
 * levels are estimated.
 *
 * Finding Clipping Indices
 * Clipping indices are computed in intervals: that is, we look for the start
 * and stop samples of a clipping interval. Every local peak (and valley) above
 * the threshold corresponds to a clipping interval. From each peak, we stretch
 * the interval left and right until we reach some halting criterion. There are
 * two halting criterion:
 * 1. The derivative of the signal is steeper than a threshold.
 * 2. The distance of the current sample from the average value of the samples
 *    in the current interval is greater than a threshold.
 * For both of these halting criterion, the same threshold is chosen, which is
 * the width of the bump detected in the histogram. Intuitively, the bump width
 * tells us how much the signal deviates when it is above the clipping level.
 * 
 * Parameters
 *   x (float array): The input signal to smooth.
 *
 * Return Value
 *   clip_intervals (array of objects): The clipping intervals. 
 *     Object properties: 'start' -> The start index of the interval.
 *                        'stop' -> The stop index of the interval.
 * 
 */
function DetectClipping(x, params) {
  var NUM_BINS = 6000;
  var MIN_WIDTH = 18;
  var SEARCH_WIDTH_BINS = 600;

  // Compute the histogram.
  var hist_arr = Histogram(x, NUM_BINS);
  var amp_hist = hist_arr[0];
  var edges = hist_arr[1];

  amp_hist = ExponentialSmoothingForwardBack(amp_hist, 0.2);

  var smooth_amp_hist = ExponentialSmoothingForwardBack(amp_hist, 0.025);

  // Compute the novelty function.
  var novelty = SignalSubtract(amp_hist, smooth_amp_hist);

  // Find the clipping levels and widths of the bumps from the novelty. Do this
  // for positive and negative clipping separately.
  var negative_clip_lower_idx = -1;
  var negative_clip_upper_idx = -1;
  var in_bump = false;
  var width = 0;
  for(var idx = 0; idx < SEARCH_WIDTH_BINS; idx++) {
    cur_val = novelty[idx];

    // In a bump.
    if(cur_val > 0) {
      if(in_bump) {
        width = width + 1;
      }
      else {
        width = 1;
        in_bump = true;
      }
    }
    // Outside of bump
    else {
      if(in_bump) {
        // The clipping threshold has been found.
        if(width > MIN_WIDTH) {
          negative_clip_lower_idx = idx;
          negative_clip_upper_idx = negative_clip_lower_idx - width;
          break;
        }
        width = 0;
        in_bump = false;
      }
    }
  }

  var nov_len = novelty.length;
  var positive_clip_lower_idx = -1;
  var positive_clip_upper_idx = -1;
  in_bump = false;
  width = 0;
  for(var idx = nov_len - 1; idx >= nov_len - SEARCH_WIDTH_BINS + 1; idx--) {
    cur_val = novelty[idx];

    // In a bump.
    if(cur_val > 0) {
      if(in_bump) {
        width = width + 1;
      }
      else {
        width = 1;
        in_bump = true;
      }
    }
    // Outside of bump
    else {
      if(in_bump) {
        // The clipping threshold has been found.
        if(width > MIN_WIDTH) {
          positive_clip_lower_idx = idx;
          positive_clip_upper_idx = idx + width;
          break;
        }
        width = 0;
        in_bump = false;
      }
    }
  }

  // We now have the indices of the bins where clipping occurs, and we need to
  // translate that into amplitude values. At the same time, we can check if no
  // clipping occurred.
  var has_negative_clip = false;
  var negative_thresh = -100;
  var negative_width = -1;
  if(negative_clip_lower_idx > 0) {
    has_negative_clip = true;

    // We should use the lower edge for the clipping threshold and the upper edge
    // for the width.
    negative_thresh = edges[negative_clip_lower_idx + 1];
    var negative_upper = edges[negative_clip_upper_idx];
    negative_width = (negative_thresh - negative_upper) / 2;
  }

  var has_positive_clip = false;
  var positive_thresh = 100;
  var positive_width = -1;
  if(positive_clip_lower_idx > 0) {
    has_positive_clip = true;

    // We should use the lower edge for the clipping threshold and the upper edge
    // for the width.
    positive_thresh = edges[positive_clip_lower_idx];
    var positive_upper = edges[positive_clip_upper_idx + 1];
    positive_width = (positive_upper - positive_thresh) / 2;
  }

  // Now to find the clipping intervals based on the clipping levels.
  var negative_clip_intervals = [];
  if(has_negative_clip) {
    var invert_x = SignalScale(x, -1);
    var valleys = FindPeaks(invert_x, Math.abs(negative_thresh), true);
    negative_clip_intervals = GetClipIntervals(x, valleys, negative_width);
  }

  var positive_clip_intervals = [];
  if(has_positive_clip) {
    var peaks = FindPeaks(x, positive_thresh, true);
    var positive_clip_intervals = GetClipIntervals(x, peaks, positive_width);
  }

  // Aggregate the positive and negative clipping intervals.
  var clip_intervals = [];
  clip_intervals.push.apply(clip_intervals, negative_clip_intervals);
  clip_intervals.push.apply(clip_intervals, positive_clip_intervals);
  clip_intervals = MergeIntervals(clip_intervals, 1);

  // console.log('Negative level: ' + negative_thresh + ', negative width: ' + negative_width); 
  // console.log('Positive level: ' + positive_thresh + ', positive width: ' + positive_width);
  return clip_intervals;
}

/*
 * GetClipIntervals()
 *
 * Given a signal and locations of clipping peaks, find the clipping intervals. 
 *
 * 
 * Parameters
 *   x (float array): The input signal to smooth.
 *   peaks (array of objects): The locations of peaks where clipping occurs.
 *                             Object properties: 'val' -> sample value,
 *                             'loc' -> sample index.
 *   thresh (float): The threshold for halting. If the slope is greater than
 *                   this value, we reached the edge of a clipping interval.
 *
 * Return Value
 *   clip_intervals (array of objects): The clipping intervals. 
 *     Object properties: 'start' -> The start index of the interval.
 *                        'stop' -> The stop index of the interval.
 * 
 */
function GetClipIntervals(x, peaks, thresh) {
  clip_intervals = [];
  for(var peak_number = 0; peak_number < peaks.length; peak_number++) {
    var cur_peak_loc = peaks[peak_number].loc;
    
    // Descend left.
    var working_avg = Math.abs(x[cur_peak_loc]);
    var start_idx = cur_peak_loc;
    var left_idx = cur_peak_loc - 1;
    var num_iters = 1;
    while(left_idx >= 1) {
      num_iters = num_iters + 1;
      
      var cur_mag = Math.abs(x[left_idx]);
      var prev_mag = Math.abs(x[left_idx + 1]);
      working_avg = (((num_iters - 1) * working_avg) / num_iters) + (cur_mag / num_iters);
      
      var avg_diff = Math.abs(working_avg - cur_mag);
      if(avg_diff > thresh) {
        start_idx = left_idx + 1;
        break;
      }
      
      // We hit a sample outside of the clipping range. Save the sample to
      // the right, because it's the last sample in the clipping range.
      var cur_derivative = Math.abs(cur_mag - prev_mag);
      if(cur_derivative > thresh) {
        start_idx = left_idx + 1;
        break;
      }
      
      left_idx = left_idx - 1;
    }
    
    // Decend right.
    working_avg = Math.abs(x[cur_peak_loc]);
    var stop_idx = cur_peak_loc;
    var right_idx = cur_peak_loc + 1;
    num_iters = 1;
    while(right_idx <= x.length) {
      num_iters = num_iters + 1;
      
      var cur_mag = Math.abs(x[right_idx]);
      var prev_mag = Math.abs(x[right_idx - 1]);
      working_avg = (((num_iters - 1) * working_avg) / num_iters) + (cur_mag / num_iters);

      var avg_diff = Math.abs(working_avg - cur_mag);
      if(avg_diff > thresh) {
        stop_idx = right_idx - 1;
        break;
      }
      
      // We hit a sample outside of the clipping range. Save the sample to
      // the right, because it's the last sample in the clipping range.
      var cur_derivative = Math.abs(cur_mag - prev_mag);
      if(cur_derivative > thresh) {
        stop_idx = right_idx - 1;
        break;
      }
      
      right_idx = right_idx + 1;
    }
    
    clip_intervals.push({ 'start': start_idx, 'stop': stop_idx });
  }
  clip_intervals = MergeIntervals(clip_intervals, 1);
  return clip_intervals;
}
