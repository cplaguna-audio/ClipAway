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
 *                              TestDeclipping.js                            *
 *                                                                           *
 *  Tests for the declipping module.                                         *
 *                                                                           *
 *****************************************************************************/
 define([
    /* Includes go here. */
    'modules/declipping/ClipIntervalUtilities',
    'modules/test/TestHelpers'
  ], function(ClipIntervalUtilities,
              TestHelpers) {

  function TestModuleDeclipping() {
    var tests_pass = true;  
    tests_pass = tests_pass && TestFileClipIntervalUtilities();
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

    var result = ClipIntervalUtilities.SplitClipIntervals(clip_intervals, cutoff);
    var result_short = result[0];
    var result_long = result[1];

    if(!TestHelpers.ClipIntervalEquality(result_short, correct_short) || !TestHelpers.ClipIntervalEquality(result_long, correct_long)) {
      console.log('Test Failed: SplitClipIntervals() #1');
      console.log('Result short:');
      console.log(result_short);
      console.log('Result long:');
      console.log(result_long);
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

    var result = ClipIntervalUtilities.MergeIntervals(clip_intervals, max_dist_apart);
    if(!TestHelpers.ClipIntervalEquality(correct, result)) {
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

    var result = ClipIntervalUtilities.CropIntervals(clip_intervals, start_idx, stop_idx);
    if(!TestHelpers.ClipIntervalEquality(correct, result)) {
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

    var result = ClipIntervalUtilities.ThinIntervals(clip_intervals, thin_length);
    if(!TestHelpers.ClipIntervalEquality(correct, result)) {
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

    var result = ClipIntervalUtilities.InvertIntervals(clip_intervals, start_idx, stop_idx);
    if(!TestHelpers.ClipIntervalEquality(correct, result)) {
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

    var result = ClipIntervalUtilities.GetIdxOfLeftmostClipInterval(clip_intervals, start_idx);
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

    var result = ClipIntervalUtilities.GetIdxOfRightmostClipInterval(clip_intervals, stop_idx);
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

    var result = ClipIntervalUtilities.EnlargeIntervals(clip_intervals, enlarge_size, signal_length);
    if(!TestHelpers.ClipIntervalEquality(correct, result)) {
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

    var result_1 = ClipIntervalUtilities.AreOverlapping(clip_intervals, start_idx_1, stop_idx_1);
    if(!(correct_1 === result_1)) {
      console.log('Test Failed: TestAreOverlapping() #1');
      tests_pass = false;
    }

    var start_idx_2 = 55;
    var stop_idx_2 = 62;

    var correct_2 = true;

    var result_2 = ClipIntervalUtilities.AreOverlapping(clip_intervals, start_idx_2, stop_idx_2);
    if(!(correct_2 === result_2)) {
      console.log('Test Failed: TestAreOverlapping() #2');
      tests_pass = false;
    }

    var start_idx_3 = 110;
    var stop_idx_3 = 120;

    var correct_3 = true;

    var result_3 = ClipIntervalUtilities.AreOverlapping(clip_intervals, start_idx_3, stop_idx_3);
    if(!(correct_3 === result_3)) {
      console.log('Test Failed: TestAreOverlapping() #3');
      tests_pass = false;
    }

    var start_idx_4 = 7;
    var stop_idx_4 = 9;

    var correct_4 = true;

    var result_4 = ClipIntervalUtilities.AreOverlapping(clip_intervals, start_idx_4, stop_idx_4);
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

    var result = ClipIntervalUtilities.GetClipSegments(clip_intervals, block_size, hop_size, x_length);
    if(!TestHelpers.ClipIntervalEquality(correct, result)) {
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

    var result = ClipIntervalUtilities.SortIntervalsByStart(clip_intervals);
    if(!TestHelpers.ClipIntervalEquality(correct, result)) {
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
    ClipIntervalUtilities.RangeToIndices(result_1, start_idx_1, stop_idx_1); 
    if(!TestHelpers.ArrayEquality(result_1, correct_1)) {
      console.log('Test Failed: TestRangeToIndices() #1');
      console.log(result_1);
      tests_pass = false;
    }

    var start_idx_2 = 0;
    var stop_idx_2 = 1;
    var correct_2 = [0, 1];

    var result_2 = [];
    ClipIntervalUtilities.RangeToIndices(result_2, start_idx_2, stop_idx_2); 
    if(!TestHelpers.ArrayEquality(result_2, correct_2)) {
      console.log('Test Failed: TestRangeToIndices() #2');
      console.log(result_2);
      tests_pass = false;
    }

    return tests_pass;
  }

  /* Public variables go here. */
  return {
    TestModuleDeclipping: TestModuleDeclipping
  };
});
