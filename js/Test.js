/*****************************************************************************\
 *                                   Test.js                                 *
 *                                                                           *
 *  Unit tests. TODO.                                                        *
 *                                                                           *
 *****************************************************************************/

function RunTests() {
  TestFindPeaks();
}

function TestFindPeaks() {
  console.log("Testing FindPeaks()...");
  var tests_pass = true;

  var x = [0, 0.2, 0.6, 0.7, 0.4, 0.1, 0.0, 0.2, 0.0, 0.9, 0.6];
  var thresh = 0.5;
  var peaks = FindPeaks(x, thresh, true);

  if(!(peaks[0].val == 0.9 && peaks[1].val == 0.7)) {
    console.log('  FindPeaks returned the wrong values.');
    tests_pass = false;
  }
  if(!(peaks[0].loc == 9 && peaks[1].loc == 3)) {
    console.log('  FindPeaks returned the wrong indices.');
    tests_pass = false;
  }

  if(tests_pass) {
    console.log("All tests passed!");
  }
  else {
    console.log("Some test failed.");
  }
}