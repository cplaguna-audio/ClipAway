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
 *                         ClipIntervalUtilities.js                          *
 *                                                                           *
 *  Helper functions for managing clip intervals.                            *
 *****************************************************************************/

 define([
    /* Includes go here. */
  ], function() {

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

  /*
   * Extends each clip interval by |enlarge_amount| samples on the left and right
   * sides of the interval, and merges any overlapping intervals.
   *
   * Returns the enlarged intervals.
   *
   * TODO: consider in-place?
   */
  function EnlargeIntervals(clip_intervals, enlarge_amount, signal_length) {
    var new_intervals = [];
    var num_intervals = clip_intervals.length;
    for(var interval_idx = 0; interval_idx < num_intervals; interval_idx++) {
      var cur_interval = clip_intervals[interval_idx];
      cur_interval.start -= enlarge_amount;
      cur_interval.stop += enlarge_amount;
      new_intervals[interval_idx] = cur_interval;
    }

    // |max_distance_apart| is 1 because we also want to merge intervals with no
    // samples between them. Ex. [[1,5], [6,10]] should become [[1,10]].
    new_intervals = MergeIntervals(new_intervals, 1);
    var num_new_intervals = new_intervals.length;

    // Enlarged intervals might fall outside of the signal range, so we need to 
    // crop the intervals back into range.
    for(var interval_idx = 0; interval_idx < num_new_intervals; interval_idx++) {
      var cur_interval = new_intervals[interval_idx];
      if(cur_interval.start < 1) {
        cur_interval.start = 1;
      }

      if(cur_interval.stop > signal_length) {
        cur_interval.stop = signal_length;
      }
    }

    return new_intervals;
  }

  /*
   * Merges intervals that are separted by at most |max_distance_apart| samples.
   */
  function MergeIntervals(clip_intervals, max_distance_apart) {
    var num_intervals = clip_intervals.length;
    if(num_intervals == 0) {
      return [];
    }

    // Sorting the intervals places candidates for merging in adjacent slots in
    // the array.
    var sorted_intervals = SortIntervalsByStart(clip_intervals);
    var merged_intervals = [];

    // This loop calculates the distance between each pair of candidate intervals,
    // and merges them if the distance is smaller than |max_distance_apart|. 
    merged_intervals[0] = sorted_intervals[0];
    var num_merged_intervals = 1;
    for(var interval_idx = 0; interval_idx < num_intervals - 1; interval_idx++) {
      var left_interval = merged_intervals[num_merged_intervals - 1];
      var right_interval = sorted_intervals[interval_idx + 1];

      // Check to merge.
      var distance_apart = right_interval.start - left_interval.stop;
      if(distance_apart <= max_distance_apart) {
        var new_start = left_interval.start;

        // This handles the case when one interval is entirely within a bigger 
        // interval. 
        var new_stop = Math.max(left_interval.stop, right_interval.stop);
        var new_interval = { start: new_start, stop: new_stop };

        // We need to replace the most recent interval with the newly merged 
        // interval, or there will be duplicates.
        merged_intervals[num_merged_intervals - 1] = { start: new_start, stop: new_stop };
      }
      else {
        // We don't merge, so we can just append the right interval.
        merged_intervals[num_merged_intervals] = right_interval;
        num_merged_intervals++;
      }
    }

    return merged_intervals;
  }

  function ThinIntervals(clip_intervals, thin_length) {
    var num_intervals = clip_intervals.length;
    var new_intervals = [];
    var num_new_intervals = 0;
    for(var interval_idx = 0; interval_idx < num_intervals; interval_idx++) {
      var cur_interval = clip_intervals[interval_idx];
      var cur_length = cur_interval.stop - cur_interval.start + 1;
      if(cur_length > thin_length) {
        new_intervals[num_new_intervals] = cur_interval;
        num_new_intervals++;
      }
    }

    return new_intervals;
  }

  function CropIntervals(clip_intervals, start_idx, stop_idx) {
    var num_intervals = clip_intervals.length;
    var new_intervals = [];
    var num_new_intervals = 0;

    for(var interval_idx = 0; interval_idx < num_intervals; interval_idx++) {
      var cur_interval = clip_intervals[interval_idx];
      var cur_start = cur_interval.start;
      var cur_stop = cur_interval.stop;
      
      // If the entire interval is before |start_idx|, ignore it.
      if(cur_stop < start_idx) {
        continue;
      }
      // If the interval contains some samples to the left of |start_idx|, crop
      // the interval so it starts at |start_idx|.
      if(cur_start < start_idx) {
        cur_interval.start = start_idx;
        new_intervals[num_new_intervals] = cur_interval;
        num_new_intervals++;
        continue;
      }
      
      // If the entire interval is after |stop_idx|, ignore it.
      if(cur_start > stop_idx) {
        continue;
      }
      // If the interval contains some samples to the right of |stop_idx|, crop
      // the interval so it stops at |stop_idx|.
      if(cur_stop > stop_idx) {
        cur_interval.stop = stop_idx;
        new_intervals[num_new_intervals] = cur_interval;
        num_new_intervals++;
        continue;
      }
      
      // If the interval is entirely within the range, add it.
      new_intervals[num_new_intervals] = cur_interval;
      num_new_intervals++;
    }

    return new_intervals;
  }

  function InvertIntervals(clip_intervals, start_idx, stop_idx) {
    var num_intervals = clip_intervals.length;
    var new_intervals = [];
    var num_new_intervals = 0;

    var sorted_clip_intervals = SortIntervalsByStart(clip_intervals);

    // If there are any samples to the left of the start of the first clip
    // interval, then we create an interval containing those samples.
    var first_clip_interval = sorted_clip_intervals[0];
    if(start_idx <= first_clip_interval.stop) {
      var new_interval = { start: start_idx, stop: first_clip_interval.start - 1 };
      new_intervals[num_new_intervals] = new_interval;
      num_new_intervals++;
    }
    
    // Create an interval for the space between each pair of adjacent intervals.
    for(var interval_idx = 0; interval_idx < num_intervals - 1; interval_idx++) {
      var left_interval = sorted_clip_intervals[interval_idx];
      var right_interval = sorted_clip_intervals[interval_idx + 1];
      var new_start = left_interval.stop + 1;
      var new_stop = right_interval.start - 1;

      // Only add the interval if there was actually space between the intervals.
      if(new_start <= new_stop) {
        var new_interval = { start:new_start, stop:new_stop };
        new_intervals[num_new_intervals] = new_interval;
        num_new_intervals++;
      }
    }
    
    // If there are any samples to the right of the end of the last clip
    // interval, then we create an interval containing those samples.
    var last_clip_interval = clip_intervals[num_intervals - 1];
    var last_start = last_clip_interval.stop + 1;
    if(last_start <= stop_idx) {
      var new_interval = { start:last_start, stop:stop_idx };
      new_intervals[num_new_intervals] = new_interval;
      num_new_intervals++;
    }

    return new_intervals;
  }

  /*
   * Given a left-boundary point, |start_idx|, get the left-most clip interval 
   * that either contains the boundary point or is to the right of it.
   *
   * Returns -1 if all intervals are to the left of the boundary point.
   */
  function GetIdxOfLeftmostClipInterval(clip_intervals, start_idx) {
    var sorted_intervals = SortIntervalsByStart(clip_intervals);
    var num_intervals = clip_intervals.length;
    for(var interval_idx = 0; interval_idx < num_intervals; interval_idx++) {
      var cur_interval = clip_intervals[interval_idx];
      if(cur_interval.stop >= start_idx) {
        return interval_idx;
      }
    }

    return -1;
  }

  /*
   * Given a right-boundary point, |stop_idx|, get the right-most clip interval 
   * that either contains the boundary point or is to the left of it.
   *
   * Returns -1 if all intervals are to the right of the boundary point.
   */
  function GetIdxOfRightmostClipInterval(clip_intervals, stop_idx) {
    var sorted_intervals = SortIntervalsByStart(clip_intervals);
    var num_intervals = clip_intervals.length;
    for(interval_idx = num_intervals - 1; interval_idx >= 0; interval_idx--) {
      var cur_interval = clip_intervals[interval_idx];
      if(cur_interval.start <= stop_idx) {
        return interval_idx;
      }
    }
    return -1;
  }

  function SortIntervalsByStart(clip_intervals) {
    return clip_intervals.sort(function(a, b) {
      return a.start - b.start;
    });
  }

  // Same as matlab's start_idx:stop_idx operator.
  function RangeToIndices(unknown_indices, start_idx, stop_idx) {
    var num_indices = stop_idx - start_idx + 1;
    for(var write_idx = 0; write_idx < num_indices; write_idx++) {
      var cur_idx = start_idx + write_idx;
      unknown_indices[write_idx] = cur_idx;
    }
  }

  function AreOverlapping(clip_intervals, start_idx, stop_idx) {
    var num_clip_intervals = clip_intervals.length;

    for(var interval_idx = 0; interval_idx < num_clip_intervals; interval_idx++) {
      var cur_interval = clip_intervals[interval_idx];

      // If one of the current interval's endpoints is within [start_idx, stop_idx],
      // then there is overlap. 
      if(cur_interval.start <= start_idx && cur_interval.stop >= start_idx) {
        return true;
      }
      if(cur_interval.start <= stop_idx && cur_interval.stop >= stop_idx) {
        return true;
      }
      // Or, if the clip interval lies entirely within [start_idx, stop_idx], then
      // there is overlap.
      if(cur_interval.start >= start_idx && cur_interval.stop <= stop_idx) {
        return true;
      }
    }

    return false;
  }

  /*
   * Clip segments denote the blocks where clipping occurs. They take the same 
   * form as intervals, but the units are blocks rather than samples.
   */
  function GetClipSegments(clip_intervals, block_size, hop_size, x_length) {
    var clip_segments = [];
    var num_clip_segments = 0;

    var in_segment = false;
    var start_idx = 0;
    var stop_idx = start_idx + block_size - 1;
    var block_idx = 0;

    var segment_start_idx = -1;
    var segment_stop_idx = -1;
    while(stop_idx < x_length) {
      // We are in a segment.
      if(in_segment) {
        // We leave the segment. Store it and move on.
        if(!AreOverlapping(clip_intervals, start_idx, stop_idx)) {
          in_segment = false;
          segment_stop_idx = block_idx - 1;

          var new_segment = { start:segment_start_idx , stop:segment_stop_idx };
          clip_segments[num_clip_segments] = new_segment;
          num_clip_segments++;

          segment_start_idx = -1;
          segment_stop_idx = -1;
        }
      }
      // We are not in a segment.
      else {
        // We have entered a segment.
        if(AreOverlapping(clip_intervals, start_idx, stop_idx)) {
          in_segment = true;
          segment_start_idx = block_idx;
        }
      }

      block_idx++;
      start_idx = start_idx + hop_size;
      stop_idx = start_idx + block_size - 1;
    }

    // If we end while in a segment, we need to leave the segment and push the segment.
    if(in_segment) {
      in_segment = false;
      segment_stop_idx = block_idx - 1;

      var new_segment = { start:segment_start_idx , stop:segment_stop_idx };
      clip_segments[num_clip_segments] = new_segment;
      num_clip_segments++;

      segment_start_idx = -1;
      segment_stop_idx = -1;
    }

    return clip_segments;
  }

  /* Public variables go here. */
  return {
    SplitClipIntervals: SplitClipIntervals,
    EnlargeIntervals: EnlargeIntervals,
    MergeIntervals: MergeIntervals,
    ThinIntervals: ThinIntervals,
    CropIntervals: CropIntervals,
    InvertIntervals: InvertIntervals,
    GetIdxOfLeftmostClipInterval: GetIdxOfLeftmostClipInterval,
    GetIdxOfRightmostClipInterval: GetIdxOfRightmostClipInterval,
    SortIntervalsByStart: SortIntervalsByStart,
    RangeToIndices: RangeToIndices,
    AreOverlapping: AreOverlapping,
    GetClipSegments: GetClipSegments
  };
});