/*****************************************************************************\
 *                               IndexGlobal.js                              *
 *                                                                           *
 *  All global variables for index.html are delcared here. Initialization    *
 *  that happens onload also happens here.                                   *
 *                                                                           *
 *****************************************************************************/

$(document).ready(InitIndex);

// Global Variables for main.html.
var RUN_TESTS = false;

var BLOCK_SIZE = 512;
var HOP_SIZE = 128;
var MIN_FFT_LENGTH = 128;
var WAVEFORM_INTERACTOR;

var STATE = { audio_loaded: false,
              did_clipping_detection: false,
              did_declip_short_bursts: false,
              did_get_known_points: false,
              did_declip_long_bursts: false };


var AUDIO_CONTEXT = new AudioContext();

var FILE_NAME = "";

// The audio uploaded by the user.
var INPUT_AUDIO_BUFFER;  

// Array(channels) of clip_intervals(array of clip_interval object).
var SHORT_CLIP_INTERVALS;
var LONG_CLIP_INTERVALS;

// Array(channels) of array of known_points({ magnitude, time }).
var KNOWN_POINTS;

// The processed audio.
var PROCESSED_AUDIO_BUFFER;

var PROGRESS_BAR_JQUERRY_ELEMENT;
var PROGRESS_BAR_ELEMENT;

// Called after the <body> has been loaded.
function InitIndex() {  

  // Audio buffer source.
  PROGRESS_BAR_JQUERRY_ELEMENT = $('#audio_processing_progress_popup');
  PROGRESS_BAR_ELEMENT = document.getElementById('audio_processing_progress_popup');
  var file_input = document.getElementById("audio_file_chooser");
  file_input.addEventListener("change", function() {
    FlushIndex();

    var full_path = file_input.value;
    if (full_path) {
      var start_idx = (full_path.indexOf('\\') >= 0 ? full_path.lastIndexOf('\\') : full_path.lastIndexOf('/'));
      var file_name = full_path.substring(start_idx);
      if(file_name.indexOf('\\') === 0 || file_name.indexOf('/') === 0) {
        file_name = file_name.substring(1);
      }
      // Remove extension.
      file_name = file_name.substring(0, file_name.lastIndexOf('.'));
    }
    FILE_NAME = file_name;
    
    var reader = new FileReader();
    reader.onload = function(ev) {
      AUDIO_CONTEXT.decodeAudioData(ev.target.result, function(buffer) {
        INPUT_AUDIO_BUFFER = buffer;
        PROCESSED_AUDIO_BUFFER = CopyAudioBuffer(AUDIO_CONTEXT, INPUT_AUDIO_BUFFER);
        STATE.audio_loaded = true;
        DoDetectClipping();
      });
    };
    reader.readAsArrayBuffer(this.files[0]);

    WAVEFORM_INTERACTOR.LoadAudio(this.files[0]);
    RefreshIndex();
  }, false);

  WAVEFORM_INTERACTOR = new WaveformInteractor();
  WAVEFORM_INTERACTOR.Init("original_audio_waveform", "processed_audio_waveform");
  RefreshIndex();

  if(RUN_TESTS) {
    RunTests();
  }

}

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