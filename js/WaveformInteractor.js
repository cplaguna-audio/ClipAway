/*****************************************************************************\
 *                           WaveformInteractor.js                           *
 *                                                                           *
 *  An object prototype for a WaveformInteractor, which displays the input   *
 *  and output audio file waveforms and provides playback interaction. We    *
 *  use the WaveSurfer library to accomplish this: you should check it out!  *
 *****************************************************************************/

// Prototype for a WaveformInteractor object.
function WaveformInteractor() {
  // Instance Variables.
  this.ORIGINAL_ZOOM_SCALE = 60;
  this.zoom_scale = this.ORIGINAL_ZOOM_SCALE;
  this.DELTA = 0;

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
        minPxPerSec: this.ORIGINAL_ZOOM_SCALE,
        scrollParent: true
    });

    this.processed_wavesurfer = Object.create(WaveSurfer);
    this.processed_wavesurfer.init({
        container: this.processed_audio_element,
        waveColor: 'blue',
        progressColor: 'blue',
        minPxPerSec: this.ORIGINAL_ZOOM_SCALE,
        scrollParent: true
    });

    // Add event handlers.
    this.AddSeekHandlers();
    this.original_wavesurfer.enableDragSelection();
    this.processed_wavesurfer.enableDragSelection();
    this.AddRegionHandlers();

    this.original_wavesurfer.on('scroll', function (e) {
      my_scroll_left = me.original_wavesurfer.drawer.wrapper.scrollLeft;
      their_scroll_left = me.processed_wavesurfer.drawer.wrapper.scrollLeft;
      if(my_scroll_left !== their_scroll_left) {
        me.processed_wavesurfer.drawer.wrapper.scrollLeft = me.original_wavesurfer.drawer.wrapper.scrollLeft;
      }
    });

    this.processed_wavesurfer.on('scroll', function (e) {
      their_scroll_left = me.original_wavesurfer.drawer.wrapper.scrollLeft;
      my_scroll_left = me.processed_wavesurfer.drawer.wrapper.scrollLeft;
      if(my_scroll_left !== their_scroll_left) {
        me.original_wavesurfer.drawer.wrapper.scrollLeft = me.processed_wavesurfer.drawer.wrapper.scrollLeft;
      }
    });

    this.original_wavesurfer.on('finish', function(e) {
      me.is_playing = false;
      play_image_el = document.getElementById("play_pause_button");
      play_image_el.src = "resources/transport/play.png";
    });

    this.processed_wavesurfer.on('finish', function(e) {
      me.is_playing = false;
      play_image_el = document.getElementById("play_pause_button");
      play_image_el.src = "resources/transport/play.png";
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
      if(the_region.start !== me.processed_region.start || the_region.end !== me.processed_region.end) {
        me.processed_region.update({
          start: the_region.start,
          end: the_region.end
        });
      }
    });

    this.processed_wavesurfer.on('region-created', function(the_region) {

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
      if(the_region.start !== me.original_wavesurfer.start || the_region.end !== me.original_wavesurfer.end) {
        me.original_region.update({
          start: the_region.start,
          end: the_region.end
        });
      }
    });

  };

  // The seek handlers maintain consistent seek positions between the two
  // wavesurfers.
  this.AddSeekHandlers = function() {
    me = this;
    this.original_wavesurfer.on('seek', function() {
      cur_progress = me.original_wavesurfer.getCurrentTime() / me.original_wavesurfer.getDuration();
      other_progress = me.processed_wavesurfer.getCurrentTime() / me.processed_wavesurfer.getDuration();

      if(Math.abs(cur_progress - other_progress) > me.DELTA) {
        me.processed_wavesurfer.seekTo(cur_progress);
      }

    });

    this.processed_wavesurfer.on('seek', function() {
      cur_progress = me.processed_wavesurfer.getCurrentTime() / me.processed_wavesurfer.getDuration();
      other_progress = me.original_wavesurfer.getCurrentTime() / me.original_wavesurfer.getDuration();

      if(Math.abs(cur_progress - other_progress) > me.DELTA) {
        me.original_wavesurfer.seekTo(cur_progress);
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

  this.UpdateProcessedAudio = function(processed_audio_buffer) {
    this.processed_wavesurfer.loadDecodedBuffer(processed_audio_buffer);
    this.processed_wavesurfer.empty();
    this.processed_wavesurfer.drawBuffer();

    // Seek the processed wavesurfer to the current position.
    cur_progress = me.original_wavesurfer.getCurrentTime() / me.original_wavesurfer.getDuration();
    this.processed_wavesurfer.seekTo(cur_progress);
  }

  this.PlayRegion = function() {
    if(this.original_region !== null && this.processed_region !== null) {
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
    this.is_playing = !this.is_playing;
    if(this.is_playing) {
      play_image_el = document.getElementById("play_pause_button");
      play_image_el.src = "resources/transport/pause.png";
    }
    else {
      play_image_el = document.getElementById("play_pause_button");
      play_image_el.src = "resources/transport/play.png";
    }
    this.original_wavesurfer.playPause();
    this.processed_wavesurfer.playPause();
  }

  this.ZoomIn = function() {
    if(this.zoom_scale < 500) {
      this.zoom_scale = this.zoom_scale * 1.2;
      this.original_wavesurfer.zoom(this.zoom_scale);
      this.processed_wavesurfer.zoom(this.zoom_scale);
    }
  };

  this.ZoomOut = function() {
    if(this.zoom_scale > 20) {
      this.zoom_scale = this.zoom_scale / 1.2;
      this.original_wavesurfer.zoom(this.zoom_scale);
      this.processed_wavesurfer.zoom(this.zoom_scale);
    }
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

    var me = this;

    var buttons = document.getElementsByClassName("processing_button");
    for(var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
      buttons[i].style.opacity = "0.2";
    }

    var toggle_waveform_button = document.getElementById("toggle_waveform_button");
    toggle_waveform_button.style.opacity = "0.2";

    var play_pause_button = document.getElementById("play_pause_button");
    play_pause_button.style.opacity = "0.2";

    var play_selection_button = document.getElementById("play_selection_button");
    play_selection_button.style.opacity = "0.2";

    buttons = document.getElementsByClassName("zoom_image");
    for(var i = 0; i < buttons.length; i++) {
      buttons[i].removeEventListener('click', function() {});
      buttons[i].style.opacity = "0.2";
    } 
  }

  this.EnableInteraction = function() {
    if(!this.disabled) {
      return;
    }
    this.disabled = false;

    var me = this;

    var buttons = document.getElementsByClassName("processing_button");
    for(var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = false;
      buttons[i].style.opacity = "1";
    }

    var toggle_waveform_button = document.getElementById("toggle_waveform_button");
    toggle_waveform_button.addEventListener('click', function(e) {
      me.ToggleActiveWaveSurfer();
    });
    toggle_waveform_button.style.opacity = "1";

    var play_pause_button = document.getElementById("play_pause_button");
    play_pause_button.addEventListener('click', function(e) {
      me.PlayPausePressed()
    });
    play_pause_button.style.opacity = "1";

    var play_selection_button = document.getElementById("play_selection_button");
    play_selection_button.addEventListener('click', function(e) {
      me.PlayRegion();
    });
    play_selection_button.style.opacity = "1";

    var zoom_in_button = document.getElementById("zoom_in_button");
    zoom_in_button.addEventListener('click', function(e) {
      me.ZoomIn();
    });
    zoom_in_button.style.opacity = "1";

    var zoom_out_button = document.getElementById("zoom_out_button");
    zoom_out_button.addEventListener('click', function(e) {
      me.ZoomOut();
    });
    zoom_out_button.style.opacity = "1";

    this.original_audio_element.addEventListener('click', function() {
      if(!me.original_on) {
        me.TurnOnOriginal();
      }
    })

    this.processed_audio_element.addEventListener('click', function() {
      if(me.original_on) {
        me.TurnOnProcessed();
      }
    })
  }

  this.Flush = function() {
    this.RemoveRegions();
    this.original_wavesurfer.seekTo(0);
    this.processed_wavesurfer.seekTo(0);
    this.TurnOnOriginal();
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