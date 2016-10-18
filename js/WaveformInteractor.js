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
 *                           WaveformInteractor.js                           *
 *                                                                           *
 *  An object prototype for a WaveformInteractor, which displays the input   *
 *  and output audio file waveforms and provides playback interaction. We    *
 *  use the WaveSurfer library to accomplish this: you should check it out!  *
 *****************************************************************************/

define([
    /* Includes go here. */
  ], function() {

  // Prototype for a WaveformInteractor object.
  function WaveformInteractor(content_width_px) {
    this.VERBOSE = false;

    // Instance Variables.
    this.CONTENT_WIDTH_PIXELS = content_width_px;
    this.MAX_ZOOM_IN_SEC_PER_PAGE = 2;
    this.DELTA = 0;

    this.ZOOM_MULTIPLIER = 1.3;

    this.current_zoom = 1;  // 1 = full_screen, 2 = 2 * full_screen, etc.

    this.original_wavesurfer;
    this.original_audio_element;

    this.processed_wavesurfer;
    this.processed_audio_element;
    this.original_on;

    this.original_region = null;
    this.processed_region = null;
    this.is_playing = false;

    this.disabled = false;
    this.is_playing_original = false;
    this.is_playing_region = false;

    /*
     * Constructors
     */
    this.Init = function(original_el_id, processed_el_id) {
      me = this;

      this.original_audio_element = document.getElementById(original_el_id);
      this.processed_audio_element = document.getElementById(processed_el_id);

      this.original_wavesurfer = Object.create(WaveSurfer);
      this.original_wavesurfer.init({
          container: this.original_audio_element,
          waveColor: 'blue',
          progressColor: 'blue',
          scrollParent: true
      });
      this.original_wavesurfer.on('ready', function() {
        if(me.VERBOSE) {
          console.log('og ready');
        }

        var timeline = Object.create(WaveSurfer.Timeline);

        timeline.init({
          wavesurfer: me.original_wavesurfer,
          container: me.original_audio_element
        });

        var zoomed_out_scale = me.CONTENT_WIDTH_PIXELS / me.original_wavesurfer.getDuration();
        me.original_wavesurfer.zoom(zoomed_out_scale);
      });

      this.processed_wavesurfer = Object.create(WaveSurfer);
      this.processed_wavesurfer.init({
          container: this.processed_audio_element,
          waveColor: 'blue',
          progressColor: 'blue',
          scrollParent: true
      });
      this.processed_wavesurfer.on('ready', function() {
        if(me.VERBOSE) {
          console.log('proc ready');
        }

        var timeline = Object.create(WaveSurfer.Timeline);

        timeline.init({
          wavesurfer: me.processed_wavesurfer,
          container: me.processed_audio_element
        });

        var zoomed_out_scale = me.CONTENT_WIDTH_PIXELS / me.processed_wavesurfer.getDuration();
        me.processed_wavesurfer.zoom(zoomed_out_scale);
      });

      // Add event handlers.
      this.AddSeekHandlers();
      this.original_wavesurfer.enableDragSelection();
      this.processed_wavesurfer.enableDragSelection();
      this.AddRegionHandlers();

      this.original_wavesurfer.on('scroll', function (e) {
        if(me.VERBOSE) {
          console.log('og scroll');
        }

        my_scroll_left = me.original_wavesurfer.drawer.wrapper.scrollLeft;
        their_scroll_left = me.processed_wavesurfer.drawer.wrapper.scrollLeft;
        if(my_scroll_left !== their_scroll_left) {
          me.processed_wavesurfer.drawer.wrapper.scrollLeft = me.original_wavesurfer.drawer.wrapper.scrollLeft;
        }
      });

      this.processed_wavesurfer.on('scroll', function (e) {
        if(me.VERBOSE) {
          console.log('proc scroll');
        }

        their_scroll_left = me.original_wavesurfer.drawer.wrapper.scrollLeft;
        my_scroll_left = me.processed_wavesurfer.drawer.wrapper.scrollLeft;
        if(my_scroll_left !== their_scroll_left) {
          me.original_wavesurfer.drawer.wrapper.scrollLeft = me.processed_wavesurfer.drawer.wrapper.scrollLeft;
        }
      });

      this.original_wavesurfer.on('finish', function(e) {
        if(me.VERBOSE) {
          console.log('og finish');
        }

        me.Pause();
      });

      this.processed_wavesurfer.on('finish', function(e) {
        if(me.VERBOSE) {
          console.log('proc finish');
        }

        me.Pause();
      });

      // On load, mute the processed audio.
      this.original_wavesurfer.toggleMute();
      this.TurnOnOriginal();

      // Disable transport interaction until a file is loaded.
      this.DisableInteraction();
    };

    /*
     * Event handlers.
     */

    /* 
     * The region handlers do the following: 
     * - Only one region can exist at a time. Delete the previous region when we
     *   create a new region.
     * - Maintain consistent regions between the two wavesurfer objects.
     */ 
    this.AddRegionHandlers = function() {
      me = this;
      this.original_wavesurfer.on('region-created', function(the_region) {
        if(me.VERBOSE) {
          console.log('og region-created');
        }

        me.Pause();
        // First, remove old region.
        if(me.original_region !== null) {
          me.original_region.remove();
        }

        // Add new region.
        me.original_region = the_region;

        if(me.processed_region === null) {
          me.processed_region = me.processed_wavesurfer.addRegion({
            start: the_region.start,
            end: the_region.end
          });
        }
      });

      this.original_wavesurfer.on('region-updated', function(the_region) {
        if(me.VERBOSE) {
          console.log('og region-updated');
        }

        me.Pause();
        if(the_region.start !== me.processed_region.start || the_region.end !== me.processed_region.end) {
          me.processed_region.update({
            start: the_region.start,
            end: the_region.end
          });
        }
      });

      this.processed_wavesurfer.on('region-out', function() {
        if(me.VERBOSE) {
          console.log('og region-out');
        }
        if(me.is_playing_region) {
          me.is_playing_region = false;
          me.Pause();
        }
      });

      this.original_wavesurfer.on('pause', function(the_region) {
        if(me.VERBOSE) {
          console.log('og pause');
        }

        if(me.is_playing) {
          me.is_playing = false;
          play_image_el = document.getElementById("play_pause_button");
          play_image_el.src = "resources/transport/play.png";
        }
      });    

      this.original_wavesurfer.on('play', function(the_region) {
        if(me.VERBOSE) {
          console.log('og play');
        }

        if(!me.is_playing) {
          me.is_playing = true;
          play_image_el = document.getElementById("play_pause_button");
          play_image_el.src = "resources/transport/pause.png";
        }
      });   

      this.processed_wavesurfer.on('region-created', function(the_region) {
        if(me.VERBOSE) {
          console.log('proc region-created');
          console.log('start: ' + the_region.start.toString() + ', stop: ' + the_region.end.toString());
        }

        me.Pause();
        // First, remove old region.
        if(me.processed_region !== null) {
          me.processed_region.remove();
        }

        // Add new region.
        me.processed_region = the_region;

        if(me.original_region === null) {
          me.original_region = me.original_wavesurfer.addRegion({
            start: the_region.start,
            end: the_region.end
          });
        }
      });

      this.processed_wavesurfer.on('region-updated', function(the_region) {
        if(me.VERBOSE) {
          console.log('proc region-updated');
        }

        me.Pause();
        if(the_region.start !== me.original_wavesurfer.start || the_region.end !== me.original_wavesurfer.end) {
          me.original_region.update({
            start: the_region.start,
            end: the_region.end
          });
        }
      });

      this.processed_wavesurfer.on('region-out', function() {
        if(me.VERBOSE) {
          console.log('proc region-out');
        }
        if(me.is_playing_region) {
          me.is_playing_region = false;
          me.Pause();
        }
      });

      this.processed_wavesurfer.on('pause', function(the_region) {
        if(me.VERBOSE) {
          console.log('proc pause');
        }

        if(me.is_playing) {
          me.is_playing = false;
          play_image_el = document.getElementById("play_pause_button");
          play_image_el.src = "resources/transport/play.png";
        }
      });    

      this.processed_wavesurfer.on('play', function(the_region) {
        if(me.VERBOSE) {
          console.log('proc play');
        }

        if(!me.is_playing) {
          me.is_playing = true;
          play_image_el = document.getElementById("play_pause_button");
          play_image_el.src = "resources/transport/pause.png";
        }
      });    

    };

    // The seek handlers maintain consistent seek positions between the two
    // wavesurfers.
    this.AddSeekHandlers = function() {
      me = this;
      this.original_wavesurfer.on('seek', function(the_progress) {
        if(me.VERBOSE) {
          console.log('og seek');
        }

        cur_progress = me.original_wavesurfer.getCurrentTime() / me.original_wavesurfer.getDuration();
        other_progress = me.processed_wavesurfer.getCurrentTime() / me.processed_wavesurfer.getDuration();

        if(Math.abs(cur_progress - other_progress) > me.DELTA) {
          me.processed_wavesurfer.seekTo(cur_progress);
        }
        
        if(me.original_region) {
          var region_start_percentage = me.original_region.start / me.original_wavesurfer.getDuration() - me.DELTA;
          var region_end_percentage = me.original_region.end / me.original_wavesurfer.getDuration() + me.DELTA;
          if(the_progress < region_start_percentage || the_progress > region_end_percentage) {
            me.RemoveRegions();
          }
       }
        

      });

      this.processed_wavesurfer.on('seek', function(the_progress) {
        if(me.VERBOSE) {
          console.log('proc seek');
        }

        cur_progress = me.processed_wavesurfer.getCurrentTime() / me.processed_wavesurfer.getDuration();
        other_progress = me.original_wavesurfer.getCurrentTime() / me.original_wavesurfer.getDuration();

        if(Math.abs(cur_progress - other_progress) > me.DELTA) {
          me.original_wavesurfer.seekTo(cur_progress);
        }
        if(me.processed_region) {
          var region_start_percentage = me.processed_region.start / me.processed_wavesurfer.getDuration() - me.DELTA;
          var region_end_percentage = me.processed_region.end / me.processed_wavesurfer.getDuration() + me.DELTA;
          if(the_progress < region_start_percentage || the_progress > region_end_percentage) {
            me.RemoveRegions();
          }
       }


      });

    };

    /*
     * Instance methods.
     */
    this.LoadAudio = function(audio_blob) {
      this.Flush();
      this.original_wavesurfer.loadBlob(audio_blob);
      this.processed_wavesurfer.loadBlob(audio_blob);

      this.EnableInteraction();
    };

    this.UpdateInputAudio = function(input_audio_buffer, callback) {
      console.log("UpdateInputAudio()");
      this.Flush();
      this.original_wavesurfer.loadDecodedBuffer(input_audio_buffer);
      this.original_wavesurfer.empty();
      this.original_wavesurfer.drawBuffer();

      // Seek the processed wavesurfer to the current position.
      cur_progress = this.processed_wavesurfer.getCurrentTime() / this.processed_wavesurfer.getDuration();
      this.original_wavesurfer.seekTo(cur_progress);
      callback();
    };

    this.UpdateProcessedAudio = function(processed_audio_buffer, callback) {
      console.log("UpdateProcessedAudio()");
      this.Flush();
      this.processed_wavesurfer.loadDecodedBuffer(processed_audio_buffer);
      this.processed_wavesurfer.empty();
      this.processed_wavesurfer.drawBuffer();

      // Seek the processed wavesurfer to the current position.
      cur_progress = this.original_wavesurfer.getCurrentTime() / this.original_wavesurfer.getDuration();
      this.processed_wavesurfer.seekTo(cur_progress);
      callback();
    }

    this.PlayRegion = function() {
      if(this.original_region !== null && this.processed_region !== null) {
        this.is_playing_region = true;
        this.original_region.play();
        this.processed_region.play();
        this.is_playing = true;
        play_image_el = document.getElementById("play_pause_button");
        play_image_el.src = "resources/transport/pause.png";
      }
    };

    this.TurnOnOriginal = function() {
      if(this.is_playing_original) {
        return;
      }

      this.is_playing_original = true;
      this.original_wavesurfer.toggleMute();
      this.original_audio_element.style.opacity = "1";
      this.processed_wavesurfer.toggleMute();
      this.processed_audio_element.style.opacity = "0.2";
      this.original_on = true;

      toggle_image_el = document.getElementById("toggle_waveform_button");
      toggle_image_el.src = "resources/transport/toggle_original.png";
    };

    this.TurnOnProcessed = function() {
      if(!this.is_playing_original) {
        return;
      }

      this.is_playing_original = false;
      this.processed_wavesurfer.toggleMute();
      this.processed_audio_element.style.opacity = "1";
      this.original_wavesurfer.toggleMute();
      this.original_audio_element.style.opacity = "0.2";
      this.original_on = false;

      toggle_image_el = document.getElementById("toggle_waveform_button");
      toggle_image_el.src = "resources/transport/toggle_processed.png";
    };

    this.PlayPausePressed = function() {
      if(this.is_playing) {
        this.Pause();
      }
      else {
        this.Play();
      }
    }

    this.Play = function() {
      this.is_playing_region = false;
      if(!this.is_playing) {
        this.is_playing = true;
        play_image_el = document.getElementById("play_pause_button");
        play_image_el.src = "resources/transport/pause.png";
        this.original_wavesurfer.play();
        this.processed_wavesurfer.play();
      }
    }

    this.Pause = function() {
      this.is_playing_region = false;
      if(this.is_playing) {
        this.is_playing = false;
        play_image_el = document.getElementById("play_pause_button");
        play_image_el.src = "resources/transport/play.png";
        this.original_wavesurfer.pause();
        this.processed_wavesurfer.pause();
      }
    }

    this.Zoom = function(px_per_second) {
      this.original_wavesurfer.zoom(px_per_second);
      this.processed_wavesurfer.zoom(px_per_second);
    }

    this.ZoomIn = function() {
      var proposed_new_scale = this.current_zoom * this.ZOOM_MULTIPLIER;
      var px_per_second = proposed_new_scale * (this.CONTENT_WIDTH_PIXELS / this.original_wavesurfer.getDuration());
      var seconds_per_width = this.CONTENT_WIDTH_PIXELS / px_per_second;
      if(seconds_per_width >= this.MAX_ZOOM_IN_SEC_PER_PAGE) {
        this.current_zoom = proposed_new_scale;
        this.Zoom(px_per_second);
      }
    };

    this.ZoomOut = function() {
      var proposed_new_scale = this.current_zoom / this.ZOOM_MULTIPLIER;
      if(proposed_new_scale < 1) {
        proposed_new_scale = 1;
      }
      
      this.current_zoom = proposed_new_scale;
      var px_per_second = proposed_new_scale * (this.CONTENT_WIDTH_PIXELS / this.original_wavesurfer.getDuration());
      this.Zoom(px_per_second);
    };

    this.ToggleActiveWaveSurfer = function() {
      if(this.original_on) {
        this.TurnOnProcessed();

      }
      else {
        this.TurnOnOriginal();
      }
    };

    this.DisableInteraction = function() {
      if(this.disabled) {
        return;
      }
      this.disabled = true;
    }

    this.EnableInteraction = function() {
      if(!this.disabled) {
        return;
      }
      this.disabled = false;
    }

    this.Flush = function() {
      this.current_zoom = 1;
      this.Pause();
      this.RemoveRegions();
      this.original_wavesurfer.seekTo(0);
      this.processed_wavesurfer.seekTo(0);
      this.TurnOnOriginal();
      this.DisableInteraction();
    }

    this.RemoveRegions = function() {
      if(this.original_region !== null) {
        this.original_region.remove();
        this.original_region = null;
      }
      if(this.processed_region !== null) {
        this.processed_region.remove();
        this.processed_region = null;
      }
    }

  }

    /* Public variables go here. */
  return {
      WaveformInteractor: WaveformInteractor
  };
});