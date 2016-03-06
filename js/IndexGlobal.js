/*****************************************************************************\
 *                               IndexGlobal.js                              *
 *                                                                           *
 *  All global variables for index.html are delcared here. Initialization    *
 *  that happens onload also happens here.                                   *
 *                                                                           *
 *****************************************************************************/

// Global Variables for main.html.
var RUN_TESTS = false;

var fs = 44100;
var length_secs = 40;
var num_channels = 2;
var audio_loaded = false;
var block_size = 2048;
var hop_size = 2048;
var waveform_interactor;

var audio_context = new AudioContext();

// The audio uploaded by the user.
var input_audio_buffer;  
var input_audio_source_node; 

// The processed audio.
var processed_audio_buffer;
var processed_audio_source_node;


// Called after the <body> has been loaded.
function InitIndex() {  

  InitFFTWrapper(block_size); 

  // Audio buffer source.
  var file_input = document.getElementById("audio_input");

  file_input.addEventListener("change", function() {
    var reader = new FileReader();
    reader.onload = function(ev) {
      audio_context.decodeAudioData(ev.target.result, function(buffer) {
        input_audio_buffer = buffer;
        processed_audio_buffer = CopyAudioBuffer(audio_context, input_audio_buffer);
        audio_loaded = true;
      });
    };
    reader.readAsArrayBuffer(this.files[0]);
    waveform_interactor.LoadAudio(this.files[0]);
  }, false);

  waveform_interactor = new WaveformInteractor();
  waveform_interactor.Init("original_audio_waveform", "processed_audio_waveform");

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