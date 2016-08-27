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

function GetFFTMagnitude(real, imag, mag) {
  for(var bin_idx = 0; bin_idx < NAYUKI_BLOCK_SIZE; bin_idx++) {
    var x = real[bin_idx];
    var y = imag[bin_idx];
    mag[bin_idx] = Math.sqrt((x * x) + (y * y));
  }
}

function GetFFTMagnitudeAndPhase(real, imag, mag, phase) {

  for(var bin_idx = 0; bin_idx < NAYUKI_BLOCK_SIZE; bin_idx++) {
    var polar = CartesianToPolar(real[bin_idx], imag[bin_idx]);
    mag[bin_idx] = polar[0];
    phase[bin_idx] = polar[1];
  }
}

function GetFFTRealAndImag(mag, phase, real, imag) {

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

/*
 * Pad x with zeros up to block_size.
 */
function ZeroPadForFFT(x, block_size) {
  var y = new Float32Array(block_size);
  for(var x_idx = 0; x_idx < block_size; x_idx++) {
    if(x_idx < x.length) {
      y[x_idx] = x[x_idx];
    }
    else {
      // The padding.
      y[x_idx] = 0;
    }
  }
  return y;
}

function FFTShift(x) {
  var shift_left_amount = Math.ceil(x.length / 2);
  CircularShiftInPlace(x, shift_left_amount);
};

function IFFTShift(x) {
  var shift_left_amount = Math.floor(x.length / 2);
  CircularShiftInPlace(x, shift_left_amount);
};

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
