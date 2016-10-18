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
 *  Test framework for ClipAway.                                             *
 *                                                                           *
 *****************************************************************************/

define([
  /* Includes go here. */
  'modules/declipping/TestDeclipping',
  'modules/signal_processing/TestSignalProcessing'
  ], function(TestDeclipping,
              TestSignalProcessing) {

  /*
   * Runs tests for all modules. Creates a popup displaying whether all tests
   * passed or not.
   */
  function RunTests() {
    var tests_pass = true;
    tests_pass = tests_pass && TestDeclipping.TestModuleDeclipping();
    tests_pass = tests_pass && TestSignalProcessing.TestModuleSignalProcessing();

    if(tests_pass) {
      alert("All tests passed!");
    }
    else {
      alert("One or more tests failed. Check the console for details.");
    }
  }

  /* Public variables go here. */
  return {
    RunTests: RunTests
  };
});