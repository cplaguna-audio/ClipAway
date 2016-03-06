/*****************************************************************************\
 *                               FFTWrapper.js                               *
 *                                                                           *
 *  Wrapper to do fft by calling a third-party implementation.               *
 *                                                                           *
 *****************************************************************************/

var nayuki_fft;
var module = "kiss_fft_r";
var block_size;

function PolarToCartesian(radius, angle) {
  var x = radius * Math.cos(angle);
  var y = radius * Math.sin(angle);

  return [x, y];
}

function CartesianToPolar(x, y) {
  var radius = Math.sqrt((x * x) + (y * y));
  var angle = Math.atan2(y, x);

  return [radius, angle];
}

function GetMagnitudeAndPhase(real, imag, mag, phase) {

  for(var bin_idx = 0; bin_idx < block_size; bin_idx++) {
    var polar = CartesianToPolar(real[bin_idx], imag[bin_idx]);
    mag[bin_idx] = polar[0];
    phase[bin_idx] = polar[1];
  }
}

function GetRealAndImag(mag, phase, real, imag) {

  for(var bin_idx = 0; bin_idx < block_size; bin_idx++) {
    var cartesian = PolarToCartesian(mag[bin_idx], phase[bin_idx]);
    real[bin_idx] = cartesian[0];
    imag[bin_idx] = cartesian[1];
  }
}

function InitFFTWrapper(the_block_size) {
  nayuki_fft = new FFTNayuki(the_block_size);
  console.log(the_block_size);
  block_size = the_block_size;
}

function ShutdownFFTWrapper() { }

/*
 * FFT()
 *
 * Description
 * 
 * Parameters
 *   x (float array): The input signal.
 *
 * Return Value
 *   y (float array): The fourier transform of the input signal.
 */
function FFT(real_input, imag_input, real_output, imag_output) {

  for(var sample_idx = 0; sample_idx < block_size; sample_idx++) {
    real_output[sample_idx] = real_input[sample_idx];
    imag_output[sample_idx] = imag_input[sample_idx];

  }

  nayuki_fft.forward(real_output, imag_output);

}

function IFFT(real_input, imag_input, real_output, imag_output) {
  
  // Scale by the block size.
  for(var sample_idx = 0; sample_idx < block_size; sample_idx++) {
    real_output[sample_idx] = real_input[sample_idx];
    imag_output[sample_idx] = imag_input[sample_idx];

  }

  nayuki_fft.inverse(real_output, imag_output);

  // Scale by the block size.
  for(var sample_idx = 0; sample_idx < block_size; sample_idx++) {
    real_output[sample_idx] = real_output[sample_idx] / block_size;
    imag_output[sample_idx] = imag_output[sample_idx] / block_size;

  }
}

