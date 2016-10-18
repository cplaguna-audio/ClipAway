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
 *                                Blocking.js                                *
 *                                                                           *
 *  Utilities for blocking audio.                                            *
 *****************************************************************************/

 define([
    /* Includes go here. */
  ], function() {

  /*
   * Convert from a block index to a sample index.
   */
  function BlockIdxToSampleIdx(block_idx, hop_size) {
    return ((block_idx) * hop_size);
  }

  /* 
   * Copy channel[start_idx:stop_idx] to block[0:copy_length]. If copy_length is
   * greater than block_length, only copy block_length samples. If we overrun 
   * channel's memory, then copy the remaining amount of zeros into block.
   */
  function CopyToBlock(channel, channel_length, start_idx, stop_idx, block, block_length) {

    for(var channel_idx = start_idx, block_idx = 0; 
        channel_idx <= stop_idx; 
        channel_idx++, block_idx++) {
      
      if(block_idx < block_length) {
        if(channel_idx < channel_length) {
          block[block_idx] = channel[channel_idx];
        }
        else {
          block[block_idx] = 0;
        }
      }
    }

  }

  /* 
   * Copy block[0:copy_length] to channel[start_idx:stop_idx]. If copy_length is
   * greater than channel_length, only copy block_length samples. If we overrun 
   * blocks's memory, then copy the remaining amount of zeros into channel.
   */
  function CopyToChannel(channel, channel_length, start_idx, stop_idx, block, block_length) {

    for(var channel_idx = start_idx, block_idx = 0; 
        channel_idx <= stop_idx; 
        channel_idx++, block_idx++) {
      
      if(channel_idx < channel_length) {
        if(block_idx < block_length) {
          channel[channel_idx] = block[block_idx];
        }
        else {
          channel[channel_idx] = 0;
        }
      }
    }

  }

  /* 
   * Overlap and add block[0:copy_length] to channel[start_idx:stop-idx]. If 
   * copy_length is greater than channel_length, only ola block_length samples. 
   * If we overrun blocks's memory, then leave the remaining section of channel 
   * unmodified.
   */
  function OverlapAndAdd(channel, channel_length, start_idx, stop_idx, block, block_length) {
    for(var channel_idx = start_idx, block_idx = 0; 
        channel_idx <= stop_idx; 
        channel_idx++, block_idx++) {
      
      if(block_idx < block_length) {
        if(channel_idx < channel_length) {
          channel[channel_idx] = channel[channel_idx] + block[block_idx];
        }
      }
    }
  }

  /* Public variables go here. */
  return {
    BlockIdxToSampleIdx: BlockIdxToSampleIdx,
    CopyToBlock: CopyToBlock,
    CopyToChannel: CopyToChannel,
    OverlapAndAdd: OverlapAndAdd
  };
});