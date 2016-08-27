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
 *                                   Test.js                                 *
 *                                                                           *
 *  Unit tests. TODO.                                                        *
 *                                                                           *
 *****************************************************************************/

function RunTests() {
  var tests_pass = true;
  tests_pass = TestFileDetectClipping();
  tests_pass = tests_pass && TestFileSignalProcessing();
  tests_pass = tests_pass && TestFileBlocking();
  tests_pass = tests_pass && TestFileCubicSplineInterpolation();
  tests_pass = tests_pass && TestFileClipIntervalUtilities();

  if(tests_pass) {
    alert("All tests passed!");
  }
  else {
    alert("One or more tests failed. Check the console for details.");
  }
}

///////////////////////////////////
//       DetectClipping.js       //
///////////////////////////////////
function TestFileDetectClipping() {
  var tests_pass = true;

  // No unit tests here. To test, run DetectClipping on a clipped audio file and
  // verify the output.

  return tests_pass;
}

///////////////////////////////////
//      SignalProcessing.js      //
///////////////////////////////////
function TestFileSignalProcessing() {
  var tests_pass = true;  
  tests_pass = tests_pass && TestZeroMatrix();
  tests_pass = tests_pass && TestCircularShiftInPlace();
  tests_pass = tests_pass && TestHannWindow();
  tests_pass = tests_pass && TestL2Norm();
  tests_pass = tests_pass && TestExponentialSmoothingForwardBack();
  tests_pass = tests_pass && TestApplyFeedForwardFilter();
  tests_pass = tests_pass && TestApplyFeedForwardFilterBackwards();
  tests_pass = tests_pass && TestSignalScale();
  tests_pass = tests_pass && TestSignalAdd();
  tests_pass = tests_pass && TestSignalSubtract();
  tests_pass = tests_pass && TestFindPeaks();
  tests_pass = tests_pass && TestHistogram();
  tests_pass = tests_pass && TestFindBin();
  tests_pass = tests_pass && TestMyMax();
  tests_pass = tests_pass && TestMyMin();
  tests_pass = tests_pass && TestMyAverage();
  return tests_pass;
}

function TestZeroMatrix() {
  var tests_pass = true;
 
  var correct = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];

  var result = ZeroMatrix(4, 4);
  if(!MatrixEquality(result, correct)) {
    console.log('Test failed: TestZeroMatrix() #1');
    console.log(result);
    tests_pass = false;
  }
  return tests_pass;
}

function TestCircularShiftInPlace() {
  var tests_pass = true;

  var x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  CircularShiftInPlace(x, 4);

  var correct = [4, 5, 6, 7, 8, 9, 0, 1, 2, 3];

  if(!ArrayEquality(x, correct)) {
    console.log('Test failed: TestCircularShiftInPlace() #1');
    console.log(x);
    tests_pass = false;
  }
  return tests_pass;
}

function TestHannWindow() {
  var tests_pass = true;
 
  var TOLERANCE = 0.001;
  var x1 = 4;
  var correct1 = [0, 0.75, 0.75, 0];

  var result1 = HannWindow(x1);
  if(!ArrayEqualityTolerance(result1, correct1, TOLERANCE)) {
    console.log('Test failed: HannWindow() #1');
    tests_pass = false;
  }

  var x2 = 8;
  var correct2 = [0, 0.1883, 0.6113, 0.9505, 0.9505, 0.6113, 0.1883, 0];

  var result2 = HannWindow(x2);
  if(!ArrayEqualityTolerance(result2, correct2, TOLERANCE)) {
    console.log('Test failed: HannWindow() #2');
    tests_pass = false;
  }

  return tests_pass;
}

function TestL2Norm() {
  var TOLERANCE = 0.0001;
  var tests_pass = true;

  var x = [0.0344, 0.4387, 0.3816, 0.7655, 0.7952, 0.1869, 0.4898, 0.4456, 0.6463, 0.7094];
  var correct = 1.7181;

  var result = L2Norm(x);
  if(!(Math.abs(result - correct) < TOLERANCE)) {
    console.log('Test failed: TestL2Norm() #1');
    tests_pass = false;
  }

  return tests_pass;
}

function TestExponentialSmoothingForwardBack() {
  var tests_pass = true;

  var x1 = [0, 1, 0];
  var a1 = 0.5;
  var correct1 = [0.1875, 0.375, 0.25];

  var result = ExponentialSmoothingForwardBack(x1, a1);
  if(!ArrayEquality(result, correct1)) {
    console.log('Test failed: ExponentialSmoothingForwardBack() #1');
    tests_pass = false;
  }

  return tests_pass;
}

function TestApplyFeedForwardFilter(x, ff_coeffs) {
  var TOLERANCE = 0.0001;
  var tests_pass = true;

  var x1 = [0, 0, 1, 0, 0];
  var ff_coeffs1 = [0.5, 0.2, 0.1, 0.05];
  var correct1 = [0, 0, 0.5, 0.2, 0.1];

  var result1 = ApplyFeedForwardFilter(x1, ff_coeffs1)
  if(!ArrayEqualityTolerance(result1, correct1, TOLERANCE)) {
    console.log('Test failed: TestApplyFeedForwardFilter() #1');
    console.log(result1);
    tests_pass = false;
  }

  var x2 = [0.0975, 0.2785, 0.5469, 0.9575, 0.9649, 0.1576, 0.9706, 0.9572];
  var ff_coeffs2 = [0.4854, 0.8003, 0.1419, 0.4218, 0.9157];
  var correct2 = [0.0473, 0.2132, 0.5022, 0.9831, 1.5190, 1.4702, 1.6388, 2.5475];

  var result2 = ApplyFeedForwardFilter(x2, ff_coeffs2)
  if(!ArrayEqualityTolerance(result2, correct2, TOLERANCE)) {
    console.log('Test failed: TestApplyFeedForwardFilter() #2');
    console.log(result2);
    console.log(correct2);

    tests_pass = false;
  }

  return tests_pass;
}

function TestApplyFeedForwardFilterBackwards(x, ff_coeffs) {
  var TOLERANCE = 0.0001;
  var tests_pass = true;

  var x1 = [0, 0, 1, 0, 0];
  var ff_coeffs1 = [0.5, 0.2, 0.1, 0.05];
  var correct1 = [0.1, 0.2, 0.5, 0, 0];

  var result1 = ApplyFeedForwardFilterBackwards(x1, ff_coeffs1)
  if(!ArrayEqualityTolerance(result1, correct1, TOLERANCE)) {
    console.log('Test failed: TestApplyFeedForwardFilterBackwards() #1');
    console.log(result1);
    tests_pass = false;
  }

  var x2 = [0.7431, 0.3922, 0.6555, 0.1712, 0.7060, 0.0318, 0.2769, 0.0462];
  var ff_coeffs2 = [0.0971, 0.8235, 0.6948, 0.3171, 0.9502];
  var correct2 = [1.5758, 0.9509, 0.9684, 0.7518, 0.3018, 0.2632, 0.0649, 0.0045]; 

  var result2 = ApplyFeedForwardFilterBackwards(x2, ff_coeffs2)
  if(!ArrayEqualityTolerance(result2, correct2, TOLERANCE)) {
    console.log('Test failed: TestApplyFeedForwardFilterBackwards() #2');
    console.log(result2);
    tests_pass = false;
  }

  return tests_pass;
}

function TestSignalScale() {
  var tests_pass = true;

  var x1 = [0, 1, -2, 3, 4];
  var a1 = 1.5;
  var correct1 = [0, 1.5, -3, 4.5, 6];

  var result = SignalScale(x1, a1);
  if(!ArrayEquality(result, correct1)) {
    console.log('Test Failed: SignalScale() #1');
    tests_pass = false;
  }

  var x2 = [];
  var a2 = 10;
  var correct2 = [];

  var result = SignalScale(x2, a2);
  if(!ArrayEquality(result, correct2)) {
    console.log('Test Failed: SignalScale() #2');
    tests_pass = false;
  }  

  return tests_pass;
}

function TestSignalAdd() {
  var tests_pass = true;

  var x1 = [0, 1, 2, 3];
  var y1 = [4, 6, 8, 10];
  var correct1 = [4, 7, 10, 13];

  var result = SignalAdd(x1, y1);
  if(!ArrayEquality(result, correct1)) {
    console.log('Test Failed: SignalAdd() #1.1');
    tests_pass = false;
  }

  var correct2 = [4, 7, 10, 13];
  result = SignalAdd(y1, x1);
  if(!ArrayEquality(result, correct2)) {
    console.log('Test Failed: SignalAdd() #1.2');
    tests_pass = false;
  }

  var x2 = [1,  2,  3,  4,  5,  6,  7,  8];
  var y2 = [-1, -2, -3, -4, -5, -6, -7, -8];
  var correct3 = [0, 0, 0, 0, 0, 0, 0, 0];

  result = SignalAdd(x2, y2);
  if(!ArrayEquality(result, correct3)) {
    console.log('Test Failed: SignalAdd() #2');
    tests_pass = false;
  }

  var x3 = [1, 2, 3, 4, 5];
  var y3 = [1, 2, 1];
  var correct4 = [2, 4, 4];

  result = SignalAdd(x3, y3);
  if(!ArrayEquality(result, correct4)) {
    console.log('Test Failed: SignalAdd() #3');
    tests_pass = false;
  }

  return tests_pass;
}

function TestSignalSubtract() {
  var tests_pass = true;

  var x1 = [0, 1, 2, 3];
  var y1 = [4, 6, 8, 10];
  var correct1 = [-4, -5, -6, -7];

  var result = SignalSubtract(x1, y1);
  if(!ArrayEquality(result, correct1)) {
    console.log('Test Failed: SignalSubtract() #1.1');
    tests_pass = false;
  }

  var correct2 = [4, 5, 6, 7];
  result = SignalSubtract(y1, x1);
  if(!ArrayEquality(result, correct2)) {
    console.log('Test Failed: SignalSubtract() #1.2');
    tests_pass = false;
  }

  var x2 = [1,  2,  3,  4,  5,  6,  7,  8];
  var y2 = [-1, -2, -3, -4, -5, -6, -7, -8];
  var correct3 = [2, 4, 6, 8, 10, 12, 14, 16];

  result = SignalSubtract(x2, y2);
  if(!ArrayEquality(result, correct3)) {
    console.log('Test Failed: SignalSubtract() #2');
    tests_pass = false;
  }

  var x3 = [1, 2, 3, 4, 5];
  var y3 = [1, 2, 1];
  var correct4 = [0, 0, 2];

  result = SignalSubtract(x3, y3);
  if(!ArrayEquality(result, correct4)) {
    console.log('Test Failed: SignalSubtract() #3');
    tests_pass = false;
  }

  return tests_pass;
}

function TestFindPeaks() {
  var tests_pass = true;

  var x = [0, 0.2, 0.6, 0.7, 0.4, 0.1, 0.0, 0.2, 0.0, 0.9, 0.6];
  var thresh = 0.5;
  var peaks = FindPeaks(x, thresh, false);

  if(!(peaks[0].val == 0.7 && peaks[1].val == 0.9)) {
    console.log('Test Failed: TestFindPeaks() #2.1');
    tests_pass = false;
  }
  if(!(peaks[0].loc == 3 && peaks[1].loc == 9)) {
    console.log('Test Failed: TestFindPeaks() #2.2');
    tests_pass = false;
  }

  peaks = FindPeaks(x, thresh, true);
  if(!(peaks[0].val == 0.9 && peaks[1].val == 0.7)) {
    console.log('Test Failed: TestFindPeaks() #2.1');
    tests_pass = false;
  }
  if(!(peaks[0].loc == 9 && peaks[1].loc == 3)) {
    console.log('Test Failed: TestFindPeaks() #2.2');
    tests_pass = false;
  }
  return tests_pass;
}

function TestHistogram() {
  var tests_pass = true;

  var x1 = [-1, -0.5, 0.1, 0.5, 1];
  var b1 = 2;
  var correct_edges = [-1, 0, 1];
  var correct_vals = [2, 3];

  var result = Histogram(x1, b1);
  var result_values = result[0];
  var result_edges = result[1];
  if(!ArrayEquality(result_edges, correct_edges)) {
    console.log('Test Failed: TestHistogram() #1.1');
    tests_pass = false;
  }

  if(!ArrayEquality(result_values, correct_vals)) {
    console.log('Test Failed: TestHistogram() #1.2');
    tests_pass = false;
  }

  return tests_pass;
}

function TestFindBin() {
  var tests_pass = true;

  var edges = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0];
  var x1 = 0.6;
  var result = FindBin(x1, edges);
  if(result != 0) {
    console.log('Test Failed: TestFindBin() #1');
    tests_pass = false;
  }

  var x2 = 4.1;
  var result = FindBin(x2, edges);
  if(result != 4) {
    console.log('Test Failed: TestFindBin() #2');
    tests_pass = false;
  }

  // Input directly on an edge can go into the left or right bin.
  var x3 = 3.0;
  var result = FindBin(x3, edges);
  if(result != 2 && result != 3) {
    console.log('Test Failed: TestFindBin() #3');
    tests_pass = false;
  }

  var x4 = -1;
  var result = FindBin(x4, edges);
  if(result != -1) {
    console.log('Test Failed: TestFindBin() #4');
    tests_pass = false;
  }

  return tests_pass;
}

function TestMyMax() {
  var tests_pass = true;

  var x1 = [1, 2, 3, 4, 9, 2];
  var result = MyMax(x1);
  if(result != 9) {
    console.log('Test Failed: TestMyMax() #1');
    tests_pass = false;
  }

  var x2 = [-1, -3, -5, -4, -2];
  result = MyMax(x2);
  if(result != -1) {
    console.log('Test Failed: TestMyMax() #2');
    tests_pass = false;
  }

  var x3 = [];
  result = MyMax(x3);
  if(result != -Infinity) {
    console.log('Test Failed: TestMyMax() #3');
    tests_pass = false;
  }

  return tests_pass;
}

function TestMyMin() {
  var tests_pass = true;

  var x1 = [1, 2, 3, 4, 9, 2];
  var result = MyMin(x1);
  if(result != 1) {
    console.log('Test Failed: TestMyMin() #1');
    tests_pass = false;
  }

  var x2 = [-1, -3, -5, -4, -2];
  result = MyMin(x2);
  if(result != -5) {
    console.log('Test Failed: TestMyMin() #2');
    tests_pass = false;
  }

  var x3 = [];
  result = MyMin(x3);
  if(result != Infinity) {
    console.log('Test Failed: TestMyMin() #3');
    tests_pass = false;
  }

  return tests_pass;
}

function TestMyAverage() {
  var tests_pass = true;

  var x1 = [1, 2, 3, 4, 9, 2];
  var result1 = MyAverage(x1);
  var correct1 = 3.5
  if(result1 != correct1) {
    console.log('Test Failed: TestMyAverage() #1');
    console.log(result1);
    tests_pass = false;
  }

  var x2 = [-1, -3, -5, -4, -2];
  var result2 = MyAverage(x2);
  var correct2 = -3
  if(result2 != correct2) {
    console.log('Test Failed: TestMyAverage() #2');
    console.log(result2);
    tests_pass = false;
  }

  return tests_pass;
}

///////////////////////////////////
//          Blocking.js          //
///////////////////////////////////
function TestFileBlocking() {
  var tests_pass = true;  
  tests_pass = tests_pass && TestBlockIdxToSampleIdx();
  tests_pass = tests_pass && TestCopyToBlock();
  tests_pass = tests_pass && TestCopyToChannel();
  tests_pass = tests_pass && TestOverlapAndAdd();

  return tests_pass;
}

function TestBlockIdxToSampleIdx() {
  var tests_pass = true;

  var result1 = BlockIdxToSampleIdx(0, 10);
  if(result1 != 0) {
    console.log('Test Failed: BlockIdxToSampleIdx() #1');
    return false;
  }

  var result1 = BlockIdxToSampleIdx(5, 256);
  if(result1 != 1280) {
    console.log('Test Failed: BlockIdxToSampleIdx() #2');
    return false;
  }

  return tests_pass;
}

function TestCopyToBlock() {
  var tests_pass = true;

  var channel = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  var channel_length = channel.length;
  var block_1 = [];
  var block_length = 4;
  var start_idx = 2;
  var stop_idx = 5;
  CopyToBlock(channel, channel_length, start_idx, stop_idx, block_1, block_length);
  
  var correct_1 = [2, 3, 4, 5];
  if(!ArrayEquality(block_1, correct_1)) {
    console.log('Test Failed: TestCopyToBlock() #1');
    tests_pass = false;
  }

  channel = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  channel_length = channel.length;
  var block_2 = [];
  block_length = 10;
  start_idx = 5;
  stop_idx = 14;
  var correct_2 = [5, 6, 7, 8, 9, 10, 11, 0, 0, 0];
  CopyToBlock(channel, channel_length, start_idx, stop_idx, block_2, block_length);
  if(!ArrayEquality(block_2, correct_2)) {
    console.log('Test Failed: TestCopyToBlock() #2');
    console.log(block_2);
    tests_pass = false;
  }

  channel = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  channel_length = channel.length;
  var block_3 = [];
  block_length = 4;
  start_idx = 5;
  stop_idx = 14;
  var correct_3 = [5, 6, 7, 8];
  CopyToBlock(channel, channel_length, start_idx, stop_idx, block_3, block_length);
  if(!ArrayEquality(block_3, correct_3)) {
    console.log('Test Failed: TestCopyToBlock() #3');
    console.log(block_3);
    tests_pass = false;
  }

  return tests_pass;
}


function TestCopyToChannel() {
  var tests_pass = true;

  var channel_1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  var channel_length = channel_1.length;
  var block_1 = [50, 51, 52, 53];
  var block_length_1 = block_1.length;
  var start_idx = 7;
  var stop_idx = 10;
  CopyToChannel(channel_1, channel_length, start_idx, stop_idx, block_1, block_length_1);
  
  correct_1 = [0, 1, 2, 3, 4, 5, 6, 50, 51, 52, 53, 11];
  if(!ArrayEquality(channel_1, correct_1)) {
    console.log('Test Failed: TestCopyToChannel() #1');
    console.log(channel_1);
    tests_pass = false;
  }

  channel_2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  channel_length = channel_2.length;
  var block_2 = [50, 51, 52, 53];
  var block_length_2 = block_2.length;
  start_idx = 5;
  stop_idx = 10;
  var correct_2 = [0, 1, 2, 3, 4, 50, 51, 52, 53, 0, 0, 11];
  CopyToChannel(channel_2, channel_length, start_idx, stop_idx, block_2, block_length_2);
  if(!ArrayEquality(channel_2, correct_2)) {
    console.log('Test Failed: TestCopyToChannel() #2');
    console.log(channel_2);
    tests_pass = false;
  }

  channel_3 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  channel_length = channel_3.length;
  var block_3 = [50, 51, 52, 53, 54];
  block_length_3 = block_3.length;
  start_idx = 10;
  stop_idx = 14;
  var correct_3 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 50, 51];
  CopyToChannel(channel_3, channel_length, start_idx, stop_idx, block_3, block_length_3);
  if(!ArrayEquality(channel_3, correct_3)) {
    console.log('Test Failed: TestCopyToChannel() #3');
    console.log(channel_3);
    tests_pass = false;
  }

  return tests_pass;
}

function TestOverlapAndAdd() {
  var tests_pass = true;

  var channel_1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  var channel_length = channel_1.length;
  var block_1 = [50, 51, 52, 53];
  var block_length_1 = block_1.length;
  var start_idx = 7;
  var stop_idx = 10;
  OverlapAndAdd(channel_1, channel_length, start_idx, stop_idx, block_1, block_length_1);
  
  correct_1 = [0, 1, 2, 3, 4, 5, 6, 57, 59, 61, 63, 11];
  if(!ArrayEquality(channel_1, correct_1)) {
    console.log('Test Failed: TestOverlapAndAdd() #1');
    console.log(channel_1);
    tests_pass = false;
  }

  channel_2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  channel_length = channel_2.length;
  var block_2 = [50, 51, 52, 53];
  var block_length_2 = block_2.length;
  start_idx = 5;
  stop_idx = 10;
  var correct_2 = [0, 1, 2, 3, 4, 55, 57, 59, 61, 9, 10, 11];
  OverlapAndAdd(channel_2, channel_length, start_idx, stop_idx, block_2, block_length_2);
  if(!ArrayEquality(channel_2, correct_2)) {
    console.log('Test Failed: TestOverlapAndAdd() #2');
    console.log(channel_2);
    tests_pass = false;
  }

  channel_3 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  channel_length = channel_3.length;
  var block_3 = [50, 51, 52, 53, 54];
  block_length_3 = block_3.length;
  start_idx = 10;
  stop_idx = 14;
  var correct_3 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 60, 62];
  OverlapAndAdd(channel_3, channel_length, start_idx, stop_idx, block_3, block_length_3);
  if(!ArrayEquality(channel_3, correct_3)) {
    console.log('Test Failed: TestOverlapAndAdd() #3');
    console.log(channel_3);
    tests_pass = false;
  }

  return tests_pass;
}

///////////////////////////////////
//  CubicSplineInterpolation.js  //
///////////////////////////////////
function TestFileCubicSplineInterpolation() {
  var tests_pass = true;  
  tests_pass = tests_pass && TestMyCubicEval();
  tests_pass = tests_pass && TestValueFromVectors();
  tests_pass = tests_pass && TestSolveTridiagonal();
  tests_pass = tests_pass && TestCubicSplineInterpolation();

  return tests_pass;
}

function TestCubicSplineInterpolation() {
  var tests_pass = true;
  var TOLERANCE = 0.004;

  var left_xs = [1, 2, 3, 4, 5];
  var right_xs = [11, 12, 13, 14, 15];
  var left_ys = [0.9937, 0.2187, 0.1058, 0.1097, 0.0636];
  var right_ys = [0.4046, 0.4484, 0.3658, 0.7635, 0.6279];
  var interp_xs = [6, 7, 8, 9, 10];
  var correct_interp_ys = [0.0413, 0.0606, 0.1142, 0.1943, 0.2936];

  var result_interp_ys = CubicSplineInterpolation(left_xs, left_ys, right_xs, right_ys, interp_xs);
  if(!ArrayEqualityTolerance(correct_interp_ys, result_interp_ys, TOLERANCE)) {
    console.log('Test Failed: TestCubicSplineInterpolation() #1');
    console.log(result_interp_ys);
    tests_pass = false;
  }

  return tests_pass;
}

function TestMyCubicEval() {
  var TOLERANCE = 0.0005;
  var tests_pass = true;

  var d = 0.8147;
  var c = 0.9058;
  var b = 0.1270;
  var a = 0.9134;
  var t = 0.6324;

  var correct = 1.5619;
  var result = MyCubicEval(d, c, b, a, t);
  if(Math.abs(correct - result) > TOLERANCE) {
    console.log('Test Failed: TestMyCubicEval() #1');
    console.log(result);
    tests_pass = false;
  }

  return tests_pass;
}

//ValueFromVectors(left_x, right_x, idx)
function TestValueFromVectors() {
  var tests_pass = true;

  var left = [0, 1, 2, 3, 4];
  var right = [5, 6, 7, 8, 9];

  var correct_0 = 0;
  var result_0 = ValueFromVectors(left, right, 0);
  if(correct_0 != result_0) {
    console.log('Test Failed: TestValueFromVectors() #0');
    console.log(result_0);
    tests_pass = false;
  }

  var correct_1 = 2;
  var result_1 = ValueFromVectors(left, right, 2);
  if(correct_1 != result_1) {
    console.log('Test Failed: TestValueFromVectors() #1');
    console.log(result_1);
    tests_pass = false;
  }

  var correct_2 = 4;
  var result_2 = ValueFromVectors(left, right, 4);
  if(correct_2 != result_2) {
    console.log('Test Failed: TestValueFromVectors() #2');
    console.log(result_2);
    tests_pass = false;
  }

  var correct_3 = 5;
  var result_3 = ValueFromVectors(left, right, 5);
  if(correct_3 != result_3) {
    console.log('Test Failed: TestValueFromVectors() #3');
    console.log(result_3);
    tests_pass = false;
  }

  var correct_4 = 8;
  var result_4 = ValueFromVectors(left, right, 8);
  if(correct_4 != result_4) {
    console.log('Test Failed: TestValueFromVectors() #4');
    console.log(result);
    tests_pass = false;
  }

  var correct_5 = 9;
  var result_5 = ValueFromVectors(left, right, 9);
  if(correct_5 != result_5) {
    console.log('Test Failed: TestValueFromVectors() #5');
    console.log(result_5);
    tests_pass = false;
  }
  return tests_pass;
}

function TestSolveTridiagonal() {
  var tests_pass = true;
  var TOLERANCE = 0.008;

  var x = ZeroMatrix(5, 5);
  x[0][0] = 0.8235;
  x[0][1] = 0.4387;
  x[0][2] = 0;
  x[0][3] = 0;
  x[0][4] = 0;

  x[1][0] = 0.6948;
  x[1][1] = 0.3816;
  x[1][2] = 0.4456;
  x[1][3] = 0;
  x[1][4] = 0;

  x[2][0] = 0;
  x[2][1] = 0.7655;
  x[2][2] = 0.6463;
  x[2][3] = 0.6551;
  x[2][4] = 0;

  x[3][0] = 0;
  x[3][1] = 0;
  x[3][2] = 0.7094;
  x[3][3] = 0.1626;
  x[3][4] = 0.5853;

  x[4][0] = 0;
  x[4][1] = 0;
  x[4][2] = 0;
  x[4][3] = 0.1190;
  x[4][4] = 0.2238;

  var d = [0.7060, 0.0318, 0.2769, 0.0462, 0.0971];

  var correct = [-2.4355, 6.1804, -1.4230, -5.3955, 3.3027];

  var result = SolveTridiagonal(x, d);
  if(!ArrayEqualityTolerance(correct, result, TOLERANCE)) {
    console.log('Test Failed: TestSolveTridiagonal() #1');
    console.log('result: ' + result.toString());
    console.log('d: ' + d.toString());
    for(var r = 0; r < 5; r++) {
      var str = "";
      for(var c = 0; c < 5; c++) {
        str = str + x[r][c].toString() + " "
      }
      console.log(str);
    }

    tests_pass = false;
  }

  return tests_pass;
}

///////////////////////////////////
//   ClipIntervalUtilities.js    //
///////////////////////////////////
function TestFileClipIntervalUtilities() {
  var tests_pass = true;  
  tests_pass = tests_pass && TestSplitClipIntervals();
  tests_pass = tests_pass && TestRangeToIndices();
  tests_pass = tests_pass && TestSortIntervalsByStart();
  tests_pass = tests_pass && TestCropIntervals();
  tests_pass = tests_pass && TestThinIntervals();
  tests_pass = tests_pass && TestInvertIntervals();
  tests_pass = tests_pass && TestGetIdxOfLeftmostClipInterval();
  tests_pass = tests_pass && TestGetIdxOfRightmostClipInterval();
  tests_pass = tests_pass && TestEnlargeIntervals();
  tests_pass = tests_pass && TestAreOverlapping();
  tests_pass = tests_pass && TestGetClipSegments();

  return tests_pass;
}

function TestSplitClipIntervals() {
  var tests_pass = true;

  var cutoff = 6;
  var c1 = {start: 1, stop: 1};
  var c2 = {start: 4, stop: 8};
  var c3 = {start: 12, stop: 21};
  var c4 = {start: 60, stop: 63};
  var c5 = {start: 100 , stop: 150};
  var clip_intervals = [c1, c2, c3, c4, c5];

  var correct_short = [c1, c2, c4];
  var correct_long = [c3, c5];

  var result = SplitClipIntervals(clip_intervals, cutoff);
  var result_short = result[0];
  var result_long = result[1];

  if(!ClipIntervalEquality(result_short, correct_short) || !ClipIntervalEquality(result_long, correct_long)) {
    console.log('Test Failed: SplitClipIntervals() #1');
    console.log(result_1);
    tests_pass = false;
  }

  return tests_pass;
}

function TestMergeIntervals() {
  var tests_pass = true;

  var c1 = {start: 1, stop: 1};
  var c2 = {start: 4, stop: 15};
  var c3 = {start: 12, stop: 21};
  var c4 = {start: 60, stop: 63};
  var c5 = {start: 100 , stop: 150};
  var clip_intervals = [c1, c2, c3, c4, c5];
  var max_dist_apart = 5;

  var cc1 = {start: 1, stop: 1};
  var cc2 = {start: 4, stop: 21};
  var cc3 = {start: 50 , stop: 63};
  var cc4 = {start: 100, stop: 150};
  var correct = [cc1, cc2, cc3, cc4];

  var result = MergeIntervals(clip_intervals, max_dist_apart);
  if(!ClipIntervalEquality(correct, result)) {
    console.log('Test Failed: EnlargeIntervals() #1');
    console.log(result);
    tests_pass = false;
  }

  return tests_pass;
}

function TestCropIntervals() {
  var tests_pass = true;

  var c1 = {start: 1, stop: 1};
  var c2 = {start: 4, stop: 8};
  var c3 = {start: 12, stop: 21};
  var c4 = {start: 60, stop: 63};
  var c5 = {start: 100 , stop: 150};
  var clip_intervals = [c1, c2, c3, c4, c5];
  var start_idx = 15;
  var stop_idx = 115;

  var cc1 = {start: 15, stop: 21};
  var cc2 = {start: 60 , stop: 63};
  var cc3 = {start: 100, stop: 115};
  var correct = [cc1, cc2, cc3];

  var result = CropIntervals(clip_intervals, start_idx, stop_idx);
  if(!ClipIntervalEquality(correct, result)) {
    console.log('Test Failed: CropIntervals() #1');
    console.log(result);
    tests_pass = false;
  }

  return tests_pass;
}

function TestThinIntervals() {
  var tests_pass = true;

  var c1 = {start: 1, stop: 1};
  var c2 = {start: 4, stop: 8};
  var c3 = {start: 12, stop: 21};
  var c4 = {start: 60, stop: 63};
  var c5 = {start: 100 , stop: 150};
  var clip_intervals = [c1, c2, c3, c4, c5];
  var thin_length = 7;

  var correct = [c3, c5];

  var result = ThinIntervals(clip_intervals, thin_length);
  if(!ClipIntervalEquality(correct, result)) {
    console.log('Test Failed: ThinIntervals() #1');
    console.log(result);
    tests_pass = false;
  }

  return tests_pass;
}

function TestInvertIntervals() {
  var tests_pass = true;

  var c1 = {start: 12, stop: 21};
  var c2 = {start: 32, stop: 44};
  var c3 = {start: 60, stop: 63};
  var clip_intervals = [c1, c2, c3];
  var start_idx = 10;
  var stop_idx = 70;

  var cc1 = {start:10, stop:11};
  var cc2 = {start:22, stop:31};
  var cc3 = {start:45, stop:59};
  var cc4 = {start:64, stop:70};

  var correct = [cc1, cc2, cc3, cc4];

  var result = InvertIntervals(clip_intervals, start_idx, stop_idx);
  if(!ClipIntervalEquality(correct, result)) {
    console.log('Test Failed: InvertIntervals() #1');
    console.log(result);
    tests_pass = false;
  }

  return tests_pass;
}

function TestGetIdxOfLeftmostClipInterval() {
  var tests_pass = true;

  var c1 = {start: 1, stop: 1};
  var c2 = {start: 4, stop: 8};
  var c3 = {start: 12, stop: 21};
  var c4 = {start: 60, stop: 63};
  var c5 = {start: 100 , stop: 150};
  var clip_intervals = [c1, c2, c3, c4, c5];
  var start_idx = 16;

  var correct = 2;

  var result = GetIdxOfLeftmostClipInterval(clip_intervals, start_idx);
  if(correct !== result) {
    console.log('Test Failed: GetIdxOfLeftmostClipInterval() #1');
    console.log(result);
    tests_pass = false;
  }

  return tests_pass;
}

function TestGetIdxOfRightmostClipInterval() {
  var tests_pass = true;

  var c1 = {start: 1, stop: 1};
  var c2 = {start: 4, stop: 8};
  var c3 = {start: 12, stop: 21};
  var c4 = {start: 60, stop: 63};
  var c5 = {start: 100 , stop: 150};
  var clip_intervals = [c1, c2, c3, c4, c5];
  var stop_idx = 62;

  var correct = 3;

  var result = GetIdxOfRightmostClipInterval(clip_intervals, stop_idx);
  if(correct !== result) {
    console.log('Test Failed: GetIdxOfRightmostClipInterval() #1');
    console.log(result);
    tests_pass = false;
  }

  return tests_pass;
}

function TestEnlargeIntervals() {
  var tests_pass = true;

  var c1 = {start: 1, stop: 1};
  var c2 = {start: 4, stop: 8};
  var c3 = {start: 12, stop: 21};
  var c4 = {start: 60, stop: 63};
  var c5 = {start: 100 , stop: 150};
  var clip_intervals = [c1, c2, c3, c4, c5];
  var enlarge_size = 5;
  var signal_length = 153;


  var cc1 = {start: 1, stop: 26};
  var cc2 = {start: 55, stop: 68};
  var cc3 = {start: 95 , stop: 153};
  var correct = [cc1, cc2, cc3];

  var result = EnlargeIntervals(clip_intervals, enlarge_size, signal_length);
  if(!ClipIntervalEquality(correct, result)) {
    console.log('Test Failed: EnlargeIntervals() #1');
    console.log(result);
    tests_pass = false;
  }

  return tests_pass;
}

function TestAreOverlapping() {
  var tests_pass = true;

  var c1 = {start: 1, stop: 1};
  var c2 = {start: 4, stop: 8};
  var c3 = {start: 12, stop: 21};
  var c4 = {start: 60, stop: 63};
  var c5 = {start: 100 , stop: 150};
  var clip_intervals = [c5, c2, c1, c4, c3];
  var start_idx_1 = 25;
  var stop_idx_1 = 40;

  var correct_1 = false;

  var result_1 = AreOverlapping(clip_intervals, start_idx_1, stop_idx_1);
  if(!(correct_1 === result_1)) {
    console.log('Test Failed: TestAreOverlapping() #1');
    tests_pass = false;
  }

  var start_idx_2 = 55;
  var stop_idx_2 = 62;

  var correct_2 = true;

  var result_2 = AreOverlapping(clip_intervals, start_idx_2, stop_idx_2);
  if(!(correct_2 === result_2)) {
    console.log('Test Failed: TestAreOverlapping() #2');
    tests_pass = false;
  }

  var start_idx_3 = 110;
  var stop_idx_3 = 120;

  var correct_3 = true;

  var result_3 = AreOverlapping(clip_intervals, start_idx_3, stop_idx_3);
  if(!(correct_3 === result_3)) {
    console.log('Test Failed: TestAreOverlapping() #3');
    tests_pass = false;
  }

  var start_idx_4 = 7;
  var stop_idx_4 = 9;

  var correct_4 = true;

  var result_4 = AreOverlapping(clip_intervals, start_idx_4, stop_idx_4);
  if(!(correct_4 === result_4)) {
    console.log('Test Failed: TestAreOverlapping() #4');
    tests_pass = false;
  }

  return tests_pass;
}

function TestGetClipSegments() {
  var tests_pass = true;

  var block_size = 16;
  var hop_size = 8;
  var x_length = 40;
  var c1 = {start: 2, stop: 7};
  var c2 = {start: 25, stop: 30};
  var clip_intervals = [c1, c2];

  var s1 = {start: 0, stop: 0};
  var s2 = {start: 2, stop: 3};
  var correct = [s1, s2];

  var result = GetClipSegments(clip_intervals, block_size, hop_size, x_length);
  if(!ClipIntervalEquality(correct, result)) {
    console.log('Test Failed: TestGetClipSegments() #1');
    console.log(result);
    tests_pass = false;
  }

  return tests_pass;
}

function TestSortIntervalsByStart() {
  var tests_pass = true;

  var c1 = {start: 1, stop: 1};
  var c2 = {start: 4, stop: 8};
  var c3 = {start: 12, stop: 21};
  var c4 = {start: 60, stop: 63};
  var c5 = {start: 100 , stop: 150};
  var clip_intervals = [c5, c2, c1, c4, c3];

  var correct = [c1, c2, c3, c4, c5];

  var result = SortIntervalsByStart(clip_intervals);
  if(!ClipIntervalEquality(correct, result)) {
    console.log('Test Failed: SortIntervalsByStart() #1');
    console.log(result);
    tests_pass = false;
  }

  return tests_pass;
}

function TestRangeToIndices() {
  var tests_pass = true;

  var start_idx_1 = 4;
  var stop_idx_1 = 8;
  var correct_1 = [4, 5, 6, 7, 8];

  var result_1 = [];
  RangeToIndices(result_1, start_idx_1, stop_idx_1); 
  if(!ArrayEquality(result_1, correct_1)) {
    console.log('Test Failed: TestRangeToIndices() #1');
    console.log(result_1);
    tests_pass = false;
  }

  var start_idx_2 = 0;
  var stop_idx_2 = 1;
  var correct_2 = [0, 1];

  var result_2 = [];
  RangeToIndices(result_2, start_idx_2, stop_idx_2); 
  if(!ArrayEquality(result_2, correct_2)) {
    console.log('Test Failed: TestRangeToIndices() #2');
    console.log(result_2);
    tests_pass = false;
  }

  return tests_pass;
}


///////////////////////////////////
//            Helpers            //
///////////////////////////////////
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
