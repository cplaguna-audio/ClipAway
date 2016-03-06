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

  /*
   * Constructors
   */
  this.Init = function(original_el_id, processed_el_id) {
    me = this;

    this.original_audio_element = document.getElementById(original_el_id);
    this.original_audio_element.addEventListener('click', function() {
      if(!me.original_on) {
        me.TurnOnOriginal();
      }
    })

    this.processed_audio_element = document.getElementById(processed_el_id);
    this.processed_audio_element.addEventListener('click', function() {
      if(me.original_on) {
        me.TurnOnProcessed();
      }
    })

    this.original_wavesurfer = Object.create(WaveSurfer);
    this.original_wavesurfer.init({
        container: this.original_audio_element,
        waveColor: 'blue',
        progressColor: 'blue',
        minPxPerSec: this.ORIGINAL_ZOOM_SCALE
    });

    this.processed_wavesurfer = Object.create(WaveSurfer);
    this.processed_wavesurfer.init({
        container: this.processed_audio_element,
        waveColor: 'blue',
        progressColor: 'blue',
        minPxPerSec: this.ORIGINAL_ZOOM_SCALE
    });

    // Add event handlers.
    this.AddSeekHandlers();
    this.original_wavesurfer.enableDragSelection();
    this.processed_wavesurfer.enableDragSelection();
    this.AddRegionHandlers();

    // On load, mute the processed audio.
    this.original_wavesurfer.toggleMute();
    this.TurnOnOriginal();
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
    this.original_wavesurfer.loadBlob(audio_blob);
    this.processed_wavesurfer.loadBlob(audio_blob);
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
    }
  };

  this.TurnOnOriginal = function() {
    this.original_wavesurfer.toggleMute();
    this.original_audio_element.style.opacity = "1";
    this.processed_wavesurfer.toggleMute();
    this.processed_audio_element.style.opacity = "0.2";
    this.original_on = true;
  };

  this.TurnOnProcessed = function() {
    this.processed_wavesurfer.toggleMute();
    this.processed_audio_element.style.opacity = "1";
    this.original_wavesurfer.toggleMute();
    this.original_audio_element.style.opacity = "0.2";
    this.original_on = false;
  };

  this.PlayPausePressed = function() {
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

}