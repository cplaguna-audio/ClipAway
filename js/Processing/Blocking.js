/*****************************************************************************\
 *                                Blocking.js                                *
 *                                                                           *
 *  Utilities for blocking audio.                                            *
 *****************************************************************************/

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