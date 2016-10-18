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
 *                       CubicSplineInterpolation.js                         *
 *                                                                           *
 *  Code for time-domain cubic spline interpolation.                         *
 *                                                                           *
 *****************************************************************************/

 define([
    'modules/signal_processing/SignalProcessing'
    /* Includes go here. */
  ], function(SignalProcessing) {

  /*
   * Implemented with help from this reference code:
   * https://dafeda.wordpress.com/2010/11/28/cubic-spline-interpolation-code/
   */
  function CubicSplineInterpolation(left_xi, left_yi, right_xi, right_yi, inter) {
   
    var num_left_train = left_xi.length;
    var num_right_train = right_xi.length;
    var num_train = num_left_train + num_right_train;
     
    // Vector h with subintervals.
    var h = new Float32Array(num_train - 1);
    for(var j = 0; j <= num_train - 2; j++) {
      h[j] = ValueFromVectors(left_xi, right_xi, j + 1) - ValueFromVectors(left_xi, right_xi, j);
    }

    var A = SignalProcessing.ZeroMatrix(num_train, num_train);   

    // Natural spline boundary conditions.
    A[0][0] = 1;
    A[num_train - 1][num_train - 1] = 1;
     
    for(var i = 1; i <= num_train - 2; i++) {
      A[i][i - 1] = h[i - 1];
      A[i][i] = 2 * (h[i - 1] + h[i]);
      A[i][i + 1] = h[i];
    }
     
    // Vector b.
    var b = new Float32Array(num_train);
     
    for(var i = 1; i <= num_train - 2; i++) {
      var next_a = ValueFromVectors(left_yi, right_yi, i + 1);
      var cur_a = ValueFromVectors(left_yi, right_yi, i);
      var prev_a = ValueFromVectors(left_yi, right_yi, i - 1);
      b[i] = (3 / h[i]) * (next_a - cur_a) - (3 / h[i - 1]) * (cur_a - prev_a);
    }
     
    // Coefficient vector cj = inv(A) * b.
    var cj = SolveTridiagonal(A, b);
     
    // Coefficient vector bj.
    var bj = new Float32Array(num_train);
    for(var i = 0; i <= num_train - 2; i++) {
     var next_a = ValueFromVectors(left_yi, right_yi, i + 1);
     var cur_a = ValueFromVectors(left_yi, right_yi, i);
     bj[i] = ((1 / h[i]) * (next_a - cur_a)) - ((1 / 3 * h[i]) * ((2 * cj[i]) + cj[i + 1]));
    }
     
    // Coefficient vector dj.
    var dj = new Float32Array(num_train - 1);
    for(var i = 0; i <= num_train - 2; i++) {
     dj[i] = (1 / (3 * h[i])) * (cj[i + 1] - cj[i]);
    }
     
    var poly_idx = num_left_train - 1; 

    var num_inters = inter.length;
    var a_inter = new Float32Array(num_inters);
    for(var inter_idx = 0; inter_idx < num_inters; inter_idx++) {
      var cur_x = ValueFromVectors(left_xi, right_xi, poly_idx);
      var cur_a = ValueFromVectors(left_yi, right_yi, poly_idx);
      var cur_t = inter[inter_idx] - cur_x;

      a_inter[inter_idx] = MyCubicEval(dj[poly_idx], cj[poly_idx], bj[poly_idx], cur_a, cur_t);
    }
    return a_inter;
  }

  /*
   * Evaluate the cubic equation |y = dx^3 + cx^2 + bx + a| at time x = t;
   */
  function MyCubicEval(d, c, b, a, t) {
    return (d * Math.pow(t, 3)) + (c * Math.pow(t, 2)) + (b * t) + a;
  }

  /*
   * Pretend you have vector [left_x right_x] and you are indexing into it. Having
   * this reduces some clones in our DeclipShortBursts() implementation.
   */
  function ValueFromVectors(left_x, right_x, idx) {
    var total_length = left_x.length + right_x.length;
    if(idx < 0 || idx >= total_length) {
      console.log("Warning: Out of bounds error from ValueFromVectors: idx = " + idx.toString());
      return 0;
    }
    
    if(idx < left_x.length) {
      return left_x[idx];
    }

    var true_right_idx = idx - left_x.length;
    return right_x[true_right_idx];
  }

  /*
   * Computes the solution to d = Ax, where A is tridiagonal.
   * See https://en.wikipedia.org/wiki/Tridiagonal_matrix_algorithm.
   */
  function SolveTridiagonal(A, d) {
    var n = d.length;
    var c_hat = new Float32Array(n - 1);
    var d_hat = new Float32Array(n);
    var prev_c = 0;
    var prev_d = 0;

    for(var i = 0; i < n - 1; i++) {
      var cur_b = A[i][i];
      var cur_c = A[i][i + 1];
      var cur_d = d[i];
      
      if(i == 0) {
        c_hat[i] = cur_c / cur_b;
        d_hat[i] = cur_d / cur_b;
      }
      else {
        var cur_a = A[i][i - 1];
        c_hat[i] = cur_c / (cur_b - (cur_a * prev_c));
        d_hat[i] = (cur_d - (cur_a * prev_d)) / (cur_b - (cur_a * prev_c));
      }
      prev_c = c_hat[i];
      prev_d = d_hat[i];
    }

    d_hat[n - 1] = (d[n - 1] - (A[n - 1][n - 2] * d_hat[n - 2])) / (A[n - 1][n - 1] - A[n - 1][n - 2] * c_hat[n - 2]);
    
    x = new Float32Array(n);
    x[n - 1] = d_hat[n - 1];
    prev_x = x[n - 1];
    for(var i = n - 2; i >= 0; i--) {
      x[i] = d_hat[i] - (c_hat[i] * prev_x);
      prev_x = x[i];
    }

    return x;
  }

  /* Public variables go here. */
  return {
    CubicSplineInterpolation: CubicSplineInterpolation,
    MyCubicEval: MyCubicEval,
    ValueFromVectors: ValueFromVectors,
    SolveTridiagonal: SolveTridiagonal
  };
});