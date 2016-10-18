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
 *                             SignalProcessing.js                           *
 *                                                                           *
 *  Functions for general signal processing and analysis.                    *
 *                                                                           *
 *****************************************************************************/

 define([
    /* Includes go here. */
  ], function() {

  function ZeroMatrix(num_rows, num_cols) {
    var x = [];
    for(var row_idx = 0; row_idx < num_rows; row_idx++) {
      x[row_idx] = [];
      for(var col_idx = 0; col_idx < num_cols; col_idx++) {
        x[row_idx][col_idx] = 0;
      }
    }
    return x;
  }

  function CircularShiftInPlace(x, shift_left_amount) {

    var x_length = x.length;

    // The number of values we've replaced. It will end up becomming x_length.
    var count = 0;

    // For non-prime x_length's.
    var offset = 0;

    while(count < x_length) {
      var write_idx = offset;
      var tmp = x[write_idx];
      var read_idx = (shift_left_amount + write_idx) % x_length;

      // Do a round of swapping.
      while(read_idx != offset) {
        x[write_idx] = x[read_idx];
        count++;

        write_idx = read_idx;
        read_idx = (shift_left_amount + write_idx) % x_length;
      }

      x[write_idx] = tmp;
      count++;

      // Move to the next round.
      offset++;
    }
  }


  /* 
   * Create a hann window of the specified length.
   */
  function HannWindow(len) {
    y = new Float32Array(len);
    for(var y_idx = 0; y_idx < len; y_idx++) {
      y[y_idx] = 0.5 * (1 - Math.cos( (2 * Math.PI * y_idx) / (len - 1) ));
    }

    return y;
  }

  function L2Norm(x) {
    var x_length = x.length;
    var norm = 0;

    for(var x_idx = 0; x_idx < x_length; x_idx++) {
      norm = norm + (x[x_idx] * x[x_idx]);
    }

    return Math.sqrt(norm);
  }

  /*
   * ExponentialSmoothingForwardBack()
   *
   * Feed-back, single coefficient moving average filter. Applied forwards and
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

  // Essentially convolution. Crops out results past the length of x.
  function ApplyFeedForwardFilter(x, ff_coeffs) {
    var x_length = x.length;
    var y = new Float32Array(x_length);
    var filter_length = ff_coeffs.length;

    for(var write_idx = 0; write_idx < x_length; write_idx++) {
      var cur_value = 0;
      for(var filter_idx = 0; filter_idx < filter_length; filter_idx++) {
        var read_idx = write_idx - filter_idx;
        if(read_idx < 0) {
          break;
        }
        cur_value = cur_value + (x[read_idx] * ff_coeffs[filter_idx]);
      }
      y[write_idx] = cur_value;
    }

    return y;
  }

  function ApplyFeedForwardFilterBackwards(x, ff_coeffs) {
    var filter_length = ff_coeffs.length;
    var x_length = x.length;

    var pad_length = filter_length - 1;
    var y = new Float32Array(x_length);

    for(var write_idx = 0; write_idx < x_length; write_idx++) {
      var cur_value = 0;
      for(var filter_idx = 0; filter_idx < filter_length; filter_idx++) {
        var read_idx = write_idx + filter_idx;
        if(read_idx >= x_length) {
          break;
        }
        var cur_x = 0;
        if(read_idx < x_length) {
          cur_x = x[read_idx];
        }
        cur_value = cur_value + (cur_x * ff_coeffs[filter_idx]);
      }
      y[write_idx] = cur_value;
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
    y = new Float32Array(x.length);
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

    z = new Float32Array(len);
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

    z = new Float32Array(len);
    for(var idx = 0; idx < len; idx++) {
      z[idx] = x[idx] - y[idx];
    }

    return z;
  }

  /*
   * Pointwise multiply x and y, store result in x.
   */
  function SignalPointwiseMultiplyInPlace(x_overwrite, y) {
    len = y.length < x_overwrite.length ? y.length : x_overwrite.length;
    for(var idx = 0; idx < len; idx++) {
      x_overwrite[idx] = x_overwrite[idx] * y[idx];
    }
  }

  /*
   * Pointwise multiply x and y, store result in x.
   */
  function SignalPointwiseDivideInPlace(x_overwrite, y) {
    len = y.length < x_overwrite.length ? y.length : x_overwrite.length;
    for(var idx = 0; idx < len; idx++) {
      x_overwrite[idx] = x_overwrite[idx] / y[idx];
    }
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
    var edges = [];
    for(var i = 0; i < num_bins + 1; i++) {
      edges[i] = min_amp + (i * bin_width);
    }

    edges[num_bins] = max_amp;

    var hist = Array.apply(null, Array(num_bins)).map(Number.prototype.valueOf,0);

    for(var i = 0; i < x.length; i++) {
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
    for(var i = 0; i < x.length; i++) {
      cur_x = x[i]
      if(cur_x > cur_max) {
        cur_max = cur_x;
      }
    }

    return cur_max;
  }

  function MyMin(x) {
    var cur_min = Infinity;
    for(var i = 0; i < x.length; i++) {
      cur_x = x[i]
      if(cur_x < cur_min) {
        cur_min = cur_x;
      }
    }

    return cur_min;
  }

  function MyAverage(x) {
    var normalization = x.length;
    var average = 0;
    for(var i = 0; i < x.length; i++) {
      average = average + x[i];
    }
    return average / normalization;
  }

  function DBToLinear(x) {
    return Math.pow(10, x / 20.0);
  }

  function LinearToDB(x) {
    return 20 * Math.log10(x);
  }

  /* Public variables go here. */
  return {
    ZeroMatrix: ZeroMatrix,
    CircularShiftInPlace: CircularShiftInPlace,
    HannWindow: HannWindow,
    L2Norm: L2Norm,
    ExponentialSmoothingForwardBack: ExponentialSmoothingForwardBack,
    ApplyFeedForwardFilter: ApplyFeedForwardFilter,
    ApplyFeedForwardFilterBackwards: ApplyFeedForwardFilterBackwards,
    SignalScale: SignalScale,
    SignalAdd: SignalAdd,
    SignalSubtract: SignalSubtract,
    SignalPointwiseMultiplyInPlace: SignalPointwiseMultiplyInPlace,
    SignalPointwiseDivideInPlace: SignalPointwiseDivideInPlace,
    FindPeaks: FindPeaks,
    Histogram: Histogram,
    FindBin: FindBin,
    MyMax: MyMax,
    MyMin: MyMin,
    MyAverage: MyAverage,
    DBToLinear: DBToLinear,
    LinearToDB: LinearToDB
  };
});
