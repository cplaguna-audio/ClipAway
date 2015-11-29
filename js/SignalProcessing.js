/*****************************************************************************\
 *                             SignalProcessing.js                           *
 *                                                                           *
 *  Functions for general signal processing and analysis.                    *
 *                                                                           *
 *****************************************************************************/

/*
 * ExponentialSmoothingForwardBack()
 *
 * Feed-forward, single coefficient moving average filter. Applied forwards and
 * backwards to compensate for delay.
 * 
 * Parameters
 *   x (float array): The input signal to smooth.
 *   alpha (float [0, 1]): The smoothing coefficient. Smaller -> more smoothing.
 *
 * Return Value
 *   y (float array): The smoothed signal.
 */
function ExponentialSmoothingForwardBack(x, alpha) {
  y = x.slice();
  for(var forward_idx = 1; forward_idx < x.length; forward_idx++) {
    y_0 = y[forward_idx];
    y_1 = y[forward_idx - 1];
    y[forward_idx] = alpha * y_0 + (1 - alpha) * y_1;
  }

  for(var back_idx = x.length - 2; back_idx >=0; back_idx--) {
    y_0 = y[back_idx];
    y_1 = y[back_idx + 1];
    y[back_idx] = alpha * y_0 + (1 - alpha) * y_1;
  }

  return y;
}

/*
 * SignalScale()
 *
 * Scalar multiplication.
 * 
 * Parameters
 *   x (float array): The input signal to smooth.
 *   alpha (float): The scalar.
 *
 * Return Value
 *   y (float array): The scaled signal.
 */
function SignalScale(x, alpha) {
  y = [];
  for(var idx = 0; idx < x.length; idx++) {
    y[idx] = x[idx] * alpha;
  }

  return y;
}

/*
 * SignalAdd()
 *
 * Vector addition. If the signals are different lengths, the summation only 
 * goes until the length of the shorter signal.
 * 
 * Parameters
 *   x (float array): The first addend.
 *   y (float array): The second addend.
 *
 * Return Value
 *   z (float array): The summed signal.
 */
function SignalAdd(x, y) {
  len = y.length < x.length ? y.length : x.length;

  z = [];
  for(var idx = 0; idx < len; idx++) {
    z[idx] = x[idx] + y[idx];
  }

  return z;
}

/*
 * SignalSubtract()
 *
 * Vector subtraction. If the signals are different lengths, the summation only 
 * goes until the length of the shorter signal.
 * 
 * Parameters
 *   x (float array): The minuend.
 *   y (float array): The subtrahend.
 *
 * Return Value
 *   z (float array): The difference signal.
 */
function SignalSubtract(x, y) {
  len = y.length < x.length ? y.length : x.length;

  z = [];
  for(var idx = 0; idx < len; idx++) {
    z[idx] = x[idx] - y[idx];
  }

  return z;
}

/*
 * FindPeaks()
 *
 * Finds local maxima of x that have a value greater than or equal to |thresh|.
 * A local maximum is defined as a sample whose value is greater than the values
 * of the previous and next samples in the signal. If |should_sort| is true, 
 * then sorts by value descending.
 * 
 * Parameters
 *   x (float array): The signal to analyze.
 *   thresh (float): Ignore peaks whose value is less than this threshold.
 *   should_sort (boolean): If true, sort the result by value.
 *
 * Return Value
 *   peaks (array of objects): The peaks found. Object properties: 
 *                             'val' -> peak amplitude, 'loc' -> peak index.
 */
function FindPeaks(x, thresh, should_sort) {
  var peaks = [];

  for(var idx = 1; idx < x.length - 1; idx++) {
    cur_x = x[idx];
    if(cur_x >= thresh) {
      prev_x = x[idx - 1];
      next_x = x[idx + 1];
      if(cur_x > prev_x && cur_x > next_x) {
        peaks.push( { 'val': cur_x, 'loc': idx } );
      }
    }
  }

  // Sort descending.
  if(should_sort) {
    peaks = peaks.sort(function(a,b) {
      return b.val - a.val;
    });
  }

  return peaks;
}

/*
 * Histogram()
 *
 * Creates a histogram of |x| with equally spaced bins. The extremeties of the
 * histogram are determined by the minimum and maximum signal values. If a value
 * occurs exactly on an edge, then it is valid for that value to be placed into
 * either adjacent bin (in this implementation, it depends on which bin is 
 * searched first).
 * 
 * Parameters
 *   x (float array): The signal to analyze.
 *   num_bins (int): The amount of bins to use.
 *
 * Return Value
 *   Array of length 2 - [hist, edges].
 *   hist (int array): The bin values (amount of samples whose amplitude was 
 *                     within the current bin range).
 *   edges (float array): The bin edge values. A bin whose index is |i| has the
 *                        range [edges[i], edges[i + 1]].
 */
function Histogram(x, num_bins) {
  var max_amp = MyMax(x);
  var min_amp = MyMin(x);

  var bin_width = (max_amp - min_amp) / num_bins;
  var edges = Array.apply(null, Array(num_bins + 1)).map(function(x, i){ 
    return min_amp + (i * bin_width);
  });

  var hist = Array.apply(null, Array(num_bins)).map(Number.prototype.valueOf,0);

  for(i = 0; i < x.length; i++) {
    var cur_x = x[i];
    var cur_bin = FindBin(cur_x, edges);
    hist[cur_bin] = hist[cur_bin] + 1;
  }

  return [hist, edges];
}

/*
 *  Helper function for Histogram(). Finds the index of the bin in which x lies
 *  using binary search.
 */
function FindBin(x, edges) {
  num_bins = edges.length - 1;

  start_bin = 0;
  stop_bin = num_bins - 1;

  while(true) {
    idx = Math.floor(start_bin + (stop_bin - start_bin + 1) / 2);

    left_val = edges[idx];
    right_val = edges[idx + 1];
    if(left_val <= x && x <= right_val) {
      return idx;
    }

    // Value was not found.
    if((stop_bin - start_bin + 1) / 2 < 1) {
      return -1;
    }

    if(x > right_val) {
      start_bin = idx + 1;
    }
    else {
      stop_bin = idx - 1;
    }
  }
}

/*
 *  Find the max/min value of an array.
 *
 *  Parameters
 *    x (float array): The input signal.
 *
 *  Return Value
 *    y (float): The max/min value of the signal.
 */
function MyMax(x) {
  var cur_max = -Infinity;
  for(i = 0; i < x.length; i++) {
    cur_x = x[i]
    if(cur_x > cur_max) {
      cur_max = cur_x;
    }
  }

  return cur_max;
}

function MyMin(x) {
  var cur_min = Infinity;
  for(i = 0; i < x.length; i++) {
    cur_x = x[i]
    if(cur_x < cur_min) {
      cur_min = cur_x;
    }
  }

  return cur_min;
}

