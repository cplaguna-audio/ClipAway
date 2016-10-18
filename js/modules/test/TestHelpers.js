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
 *                                TestHelpers.js                             *
 *                                                                           *
 *  Helper functions for the test framework.                                 *
 *                                                                           *
 *****************************************************************************/

define([
  /* Includes go here. */
  ], function() {

  function MatrixEquality(x, y) {
    if(x.length != y.length) {
      return false;
    }

    for(var row_idx = 0; row_idx < x.length; row_idx++) {
      var cur_x_col = x[row_idx];
      var cur_y_col = y[row_idx];

      if(cur_x_col.length !== cur_y_col.length) {
        return false;
      }

      for(var col_idx = 0; col_idx < cur_x_col.length; col_idx++) {
        var cur_x = cur_x_col[col_idx];
        var cur_y = cur_y_col[col_idx];
        if(cur_x !== cur_y) {
          return false;
        }
      }
    }
    return true;
  }

  function ArrayEquality(x, y) {
    if(x.length != y.length) {
      return false;
    }

    for(var idx = 0; idx < x.length; idx++) {
      var cur_x = x[idx];
      var cur_y = y[idx];
      if(cur_x != cur_y) {
        return false;
      }
    }

    return true;
  }

  function ArrayEqualityTolerance(x, y, t) {
    if(x.length != y.length) {
      return false;
    }

    for(var idx = 0; idx < x.length; idx++) {
      var cur_x = x[idx];
      var cur_y = y[idx];
      if(Math.abs(cur_x - cur_y) > t) {
        return false;
      }
    }

    return true;
  }

  function ClipIntervalEquality(x, y) {
    if(x.length != y.length) {
      return false;
    }

    for(var idx = 0; idx < x.length; idx++) {
      var cur_x = x[idx];
      var cur_y = y[idx];
      if(cur_x.start != cur_y.start) {
        return false;
      }
      if(cur_x.stop != cur_y.stop) {
        return false;
      }
    }

    return true;
  }

  /* Public variables go here. */
  return {
    MatrixEquality: MatrixEquality,
    ArrayEquality: ArrayEquality,
    ArrayEqualityTolerance: ArrayEqualityTolerance,
    ClipIntervalEquality: ClipIntervalEquality
  };
});