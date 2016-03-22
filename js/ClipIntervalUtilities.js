/*****************************************************************************\
 *                         ClipIntervalUtilities.js                          *
 *                                                                           *
 *  Helper functions for managing clip intervals.                            *
 *****************************************************************************/

/*
 * Splits intervals into short and long, according to the cutoff. Bursts of the
 * length of the cutoff are considered short.
 *
 * Returns [short_clip_intervals, long_clip_intervals]
 */
function SplitClipIntervals(clip_intervals, short_burst_cutoff_samples) {
  var num_intervals = clip_intervals.length;
  var short_intervals = [];
  var long_intervals = [];
  var short_interval_end = 0;
  var long_interval_end = 0;

  for(var interval_idx = 0; interval_idx < num_intervals; interval_idx++) {
    var cur_interval = clip_intervals[interval_idx];
    var interval_length = cur_interval.stop - cur_interval.start + 1;
    if(interval_length <= short_burst_cutoff_samples) {
      short_intervals[short_interval_end] = cur_interval;
      short_interval_end++;
    }
    else {
      long_intervals[long_interval_end] = cur_interval;
      long_interval_end++;
    }
  }  

  return [short_intervals, long_intervals];
}

// Same as matlab's burst_start:burst_stop operator.
function RangeToIndices(unknown_indices, start_idx, stop_idx) {
  var num_indices = stop_idx - start_idx + 1;
  for(var write_idx = 0; write_idx < num_indices; write_idx++) {
    var cur_idx = start_idx + write_idx;
    unknown_indices[write_idx] = cur_idx;
  }
}
