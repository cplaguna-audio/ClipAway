/*****************************************************************************\
 *                               FFTWrapper.js                               *
 *                                                                           *
 *  Wrapper to do fft by calling a third-party implementation.               *
 *                                                                           *
 *****************************************************************************/

var NAYUKI_FFT;
var NAYUKI_BLOCK_SIZE;

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

  for(var bin_idx = 0; bin_idx < NAYUKI_BLOCK_SIZE; bin_idx++) {
    var polar = CartesianToPolar(real[bin_idx], imag[bin_idx]);
    mag[bin_idx] = polar[0];
    phase[bin_idx] = polar[1];
  }
}

function GetRealAndImag(mag, phase, real, imag) {

  for(var bin_idx = 0; bin_idx < NAYUKI_BLOCK_SIZE; bin_idx++) {
    var cartesian = PolarToCartesian(mag[bin_idx], phase[bin_idx]);
    real[bin_idx] = cartesian[0];
    imag[bin_idx] = cartesian[1];
  }
}

function InitFFTWrapper(the_block_size) {
  NAYUKI_FFT = new FFTNayuki(the_block_size);
  console.log(the_block_size);
  NAYUKI_BLOCK_SIZE = the_block_size;
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

  for(var sample_idx = 0; sample_idx < NAYUKI_BLOCK_SIZE; sample_idx++) {
    real_output[sample_idx] = real_input[sample_idx];
    imag_output[sample_idx] = imag_input[sample_idx];

  }

  NAYUKI_FFT.forward(real_output, imag_output);

}

function InPlaceFFT(real, imag) {
  NAYUKI_FFT.forward(real, imag);
}

function IFFT(real_input, imag_input, real_output, imag_output) {
  
  // Scale by the block size.
  for(var sample_idx = 0; sample_idx < NAYUKI_BLOCK_SIZE; sample_idx++) {
    real_output[sample_idx] = real_input[sample_idx];
    imag_output[sample_idx] = imag_input[sample_idx];

  }

  NAYUKI_FFT.inverse(real_output, imag_output);

  // Scale by the block size.
  for(var sample_idx = 0; sample_idx < NAYUKI_BLOCK_SIZE; sample_idx++) {
    real_output[sample_idx] = real_output[sample_idx] / NAYUKI_BLOCK_SIZE;
    imag_output[sample_idx] = imag_output[sample_idx] / NAYUKI_BLOCK_SIZE;
  }
}

function InPlaceIFFT(real, imag) {
  NAYUKI_FFT.inverse(real, imag);
  
  // Scale by the block size.
  for(var sample_idx = 0; sample_idx < NAYUKI_BLOCK_SIZE; sample_idx++) {
    real[sample_idx] = real[sample_idx] / NAYUKI_BLOCK_SIZE;
    imag[sample_idx] = imag[sample_idx] / NAYUKI_BLOCK_SIZE;
  }
}
