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
 *                               IndexGlobal.js                              *
 *                                                                           *
 *  All global variables for index.html are delcared here. Initialization    *
 *  that happens onload also happens here.                                   *
 *                                                                           *
 *****************************************************************************/

define([
    /* Includes go here. */
  ], function() {

  // Global Variables for main.html.
  var RUN_TESTS = false;

  var MAX_NUM_CHANNELS = 2;
  var BLOCK_SIZE = 512;
  var HOP_SIZE = 128;
  var MIN_FFT_LENGTH = 128;
  var TARGET_LUFS = -14;

  var STATE = { audio_loaded: false,
                did_clipping_detection: false,
                did_declip_short_bursts: false,
                did_get_known_points: false,
                did_declip_long_bursts: false };

  var AUDIO_CONTEXT = new AudioContext();

  // The audio uploaded by the user.
  var INPUT_AUDIO_BUFFER;  

  // The processed audio.
  var PROCESSED_AUDIO_BUFFER;

  var WAVEFORM_INTERACTOR;

  // Array(channels) of clip_intervals(array of clip_interval object).
  var SHORT_CLIP_INTERVALS;
  var LONG_CLIP_INTERVALS;

  // Array(channels) of array of known_points({ magnitude, time }).
  var KNOWN_POINTS;

  var FILE_NAME = "";
  var PROGRESS_BAR_JQUERRY_ELEMENT;
  var PROGRESS_BAR_ELEMENT;
  var CONTENT_WIDTH_PERCENTAGE = 0.95;
  var CONTENT_WIDTH_PIXELS;

  function IntervalToString(clip_intervals) {
    var the_str = "";
    var precision = 9;
    for(var idx = 0; idx < clip_intervals.length; idx++) {
      var cur_start = clip_intervals[idx].start;
      var cur_stop = clip_intervals[idx].stop;

      the_str = the_str + cur_start + " " + cur_stop + "\n";
    }

    return the_str;
  }

  function SignalToString(x) {
    var the_str = "";
    var precision = 9;
    for(var idx = 0; idx < x.length; idx++) {
      var cur_x = floorFigure(x[idx], precision);
      if(x[idx] >= 0) {
        the_str = the_str + " ";
      }
      the_str = the_str + cur_x + "\n";
    }

    return the_str;
  }

  function floorFigure(figure, decimals){
      if (!decimals) decimals = 2;
      var d = Math.pow(10,decimals);
      return (parseInt(figure*d)/d).toFixed(decimals);
  };


  function PrintInTab(text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('target', '_blank');
    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  // For testing.
  function PlotArray(the_array) {

    var the_indices = Array.apply(null, Array(num_bins + 1)).map(function(x, i){ 
      return i;
    });

    var trace_1 = {
      x: the_indices,
      y: the_array,
      type: 'scatter'
    };

    Plotly.newPlot(plot_div, [trace_1], {title:'Array'});
  }

  /* Public variables go here. */
  return {
      RUN_TESTS: RUN_TESTS,

      MAX_NUM_CHANNELS: MAX_NUM_CHANNELS,
      BLOCK_SIZE: BLOCK_SIZE,
      HOP_SIZE: HOP_SIZE,
      MIN_FFT_LENGTH: MIN_FFT_LENGTH,
      TARGET_LUFS: TARGET_LUFS,
      WAVEFORM_INTERACTOR: WAVEFORM_INTERACTOR,

      STATE: STATE,

      AUDIO_CONTEXT: AUDIO_CONTEXT,

      INPUT_AUDIO_BUFFER: INPUT_AUDIO_BUFFER,
      PROCESSED_AUDIO_BUFFER: PROCESSED_AUDIO_BUFFER,

      SHORT_CLIP_INTERVALS: SHORT_CLIP_INTERVALS,
      LONG_CLIP_INTERVALS: LONG_CLIP_INTERVALS,
      KNOWN_POINTS: KNOWN_POINTS,

      FILE_NAME: FILE_NAME,
      PROGRESS_BAR_ELEMENT: PROGRESS_BAR_ELEMENT,
      PROGRESS_BAR_JQUERRY_ELEMENT: PROGRESS_BAR_JQUERRY_ELEMENT,
      CONTENT_WIDTH_PERCENTAGE: CONTENT_WIDTH_PERCENTAGE,
      CONTENT_WIDTH_PIXELS: CONTENT_WIDTH_PIXELS,
  };
});