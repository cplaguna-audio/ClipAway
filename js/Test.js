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
  tests_pass = TestMergeClipIntervals();
  return tests_pass;
}

function TestMergeClipIntervals() {
  var tests_pass = true;

  var ci1 = { 'start': 10, 'stop': 15 };
  var ci2 = { 'start': 13, 'stop': 19 };
  var ci3 = { 'start': 1, 'stop': 5 };
  var clip_intervals = [ci1, ci2, ci3];
  
  var cr1 = { 'start': 1, 'stop': 5 };
  var cr2 = { 'start': 10, 'stop': 19 };
  var correct1 = [cr1, cr2];

  var result = MergeClipIntervals(clip_intervals);

  if(!ClipIntervalEquality(correct1, result)) {
    console.log('Test Failed: MergeClipIntervals() #1');
    tests_pass = false;
  }

  return tests_pass;
}

///////////////////////////////////
//      SignalProcessing.js      //
///////////////////////////////////
function TestFileSignalProcessing() {
  var tests_pass = true;
  tests_pass = TestExponentialSmoothingForwardBack();
  tests_pass = tests_pass && TestSignalScale();
  tests_pass = tests_pass && TestSignalAdd();
  tests_pass = tests_pass && TestSignalSubtract();
  tests_pass = tests_pass && TestFindPeaks();
  tests_pass = tests_pass && TestHistogram();
  tests_pass = tests_pass && TestFindBin();
  tests_pass = tests_pass && TestMyMax();
  tests_pass = tests_pass && TestMyMin();
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

///////////////////////////////////
//            Helpers            //
///////////////////////////////////
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