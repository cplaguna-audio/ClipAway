/*****************************************************************************\
 *                               IndexGlobal.js                              *
 *                                                                           *
 *  All global variables for index.html are delcared here. Initialization    *
 *  that happens onload also happens here.                                   *
 *                                                                           *
 *****************************************************************************/

// Global Variables for main.html.
var fs = 44100;
var length_secs = 40;
var num_channels = 2;
var audio_loaded = false;

var audio_context = new AudioContext();

var user_audio_buffer;  // Current audio uploaded by the user.
var user_audio_source_node; 
var declipped_audio_source_node;

var detection_buffer_size = 4096;
var declip_detection_node = (function() {
    var block_idx = 0;
    var node = audio_context.createScriptProcessor(detection_buffer_size, 1, 1);
    node.onaudioprocess = function(e) {
        var input = e.inputBuffer.getChannelData(0);
        var output = e.outputBuffer.getChannelData(0);
        for (var i = 0; i < detection_buffer_size; i++) {
            output[i] = input[i];
        }
        console.log(block_idx);
        block_idx++;
    }
    return node;
})();

// Called after the <body> has been loaded.
function InitIndex() {  

  // Audio buffer source.
  var fileInput = document.getElementById("audio_input");

  fileInput.addEventListener("change", function() {
    var reader = new FileReader();
    reader.onload = function(ev) {
      audio_context.decodeAudioData(ev.target.result, function(buffer) {
        user_audio_buffer = buffer; // Attatch our Audio Data as it's Buffer
        audio_loaded = true;
      });
    };
    reader.readAsArrayBuffer(this.files[0]);
  }, false);

  RunTests();
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