// player.js
// HTML5 Audio Player JavaScript Module (Standalone Version)

(function() {
  function AudioPlayer(playlist, containerId, callbacks = {}) {
    this.playlist = playlist || [];
    this.currentTrackIndex = 0;
    this.shuffle = false;
    this.shuffleHistory = [];
    this.container = document.getElementById(containerId);
    this.onTrackStart = callbacks.onTrackStart || function() {};
    this.onFiveSecondMark = callbacks.onFiveSecondMark || function() {};

    if (!this.container) {
      throw new Error('Container element not found');
    }

    this.init();
  }

  AudioPlayer.prototype.init = function() {
    this.audioPlayer = document.createElement('audio');
    this.audioPlayer.controls = false; // Disable default controls for custom styling
    this.container.appendChild(this.audioPlayer);

    this.controlsContainer = document.createElement('div');
    this.controlsContainer.className = 'controls';
    this.container.appendChild(this.controlsContainer);

    this.createControls();

    this.trackListElement = document.createElement('ul');
    this.trackListElement.className = 'playlist';
    this.trackListElement.style.textAlign = 'left'; // Left-align the playlist
    this.container.appendChild(this.trackListElement);

    this.loadPlaylistUI();
    this.loadTrack(this.currentTrackIndex);

    this.audioPlayer.addEventListener('ended', () => {
      this.nextTrack();
    });

    this.audioPlayer.addEventListener('timeupdate', () => {
      if (this.audioPlayer.currentTime >= 5 && !this.fiveSecondCallbackTriggered) {
        this.onFiveSecondMark(this.playlist[this.currentTrackIndex]);
        this.fiveSecondCallbackTriggered = true;
      }
    });

    this.audioPlayer.addEventListener('play', () => {
      this.fiveSecondCallbackTriggered = false;
      this.updatePlayButton();
    });

    this.audioPlayer.addEventListener('pause', () => {
      this.updatePlayButton();
    });
  };

  AudioPlayer.prototype.createControls = function() {
    const controlsWrapper = document.createElement('div');
    controlsWrapper.style.display = 'flex';
    controlsWrapper.style.justifyContent = 'center';
    controlsWrapper.style.gap = '10px';
    controlsWrapper.style.alignItems = 'center';

    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&#9664;'; // Unicode for left arrow
    prevButton.className = 'player-btn';
    prevButton.addEventListener('click', () => this.prevTrack());

    const playButton = document.createElement('button');
    playButton.innerHTML = '&#9658;'; // Unicode for play symbol
    playButton.className = 'player-btn';
    playButton.addEventListener('click', () => {
      if (this.audioPlayer.paused) {
        this.audioPlayer.play();
      } else {
        this.audioPlayer.pause();
      }
    });

    const nextButton = document.createElement('button');
    nextButton.innerHTML = '&#9654;'; // Unicode for right arrow
    nextButton.className = 'player-btn';
    nextButton.addEventListener('click', () => this.nextTrack());

    const shuffleToggle = document.createElement('button');
    shuffleToggle.innerHTML = '&#128257; Shuffle: Off'; // Unicode for shuffle symbol
    shuffleToggle.className = 'player-btn';
    shuffleToggle.addEventListener('click', () => {
      this.shuffle = !this.shuffle;
      shuffleToggle.innerHTML = `&#128257; Shuffle: ${this.shuffle ? 'On' : 'Off'}`;
      this.shuffleHistory = [];
    });

    const progressBarWrapper = document.createElement('div');
    progressBarWrapper.style.flexGrow = '1';
    progressBarWrapper.style.position = 'relative';

    const progressBar = document.createElement('input');
    progressBar.type = 'range';
    progressBar.min = '0';
    progressBar.max = '100';
    progressBar.value = '0';
    progressBar.style.width = '100%';
    progressBar.addEventListener('input', (e) => {
      const percent = e.target.value / 100;
      this.audioPlayer.currentTime = percent * this.audioPlayer.duration;
    });

    this.audioPlayer.addEventListener('timeupdate', () => {
      if (this.audioPlayer.duration) {
        progressBar.value = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
        timeElapsedDisplay.textContent = this.formatTime(this.audioPlayer.currentTime);
        trackLengthDisplay.textContent = this.formatTime(this.audioPlayer.duration);
      }
    });

    progressBarWrapper.appendChild(progressBar);

    const timeElapsedDisplay = document.createElement('span');
    timeElapsedDisplay.className = 'time-display';
    timeElapsedDisplay.style.marginLeft = '10px';
    timeElapsedDisplay.textContent = '0:00';

    const trackLengthDisplay = document.createElement('span');
    trackLengthDisplay.className = 'time-display';
    trackLengthDisplay.style.marginRight = '10px';
    trackLengthDisplay.textContent = '0:00';

    controlsWrapper.appendChild(prevButton);
    controlsWrapper.appendChild(playButton);
    controlsWrapper.appendChild(timeElapsedDisplay);
    controlsWrapper.appendChild(progressBarWrapper);
    controlsWrapper.appendChild(trackLengthDisplay);
    controlsWrapper.appendChild(nextButton);
    controlsWrapper.appendChild(shuffleToggle);

    this.controlsContainer.appendChild(controlsWrapper);
  };

  AudioPlayer.prototype.formatTime = function(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  AudioPlayer.prototype.updatePlayButton = function() {
    this.playButton.innerHTML = this.audioPlayer.paused ? '&#9658;' : '&#10074;&#10074;';
  };

  AudioPlayer.prototype.loadPlaylistUI = function() {
    this.trackListElement.innerHTML = '';

    this.playlist.forEach((track, index) => {
      const listItem = document.createElement('li');
      listItem.textContent = `${index + 1}. ${track.title} - ${track.artist}`; // Add numbering to tracks
      listItem.className = 'track-item';
      listItem.style.listStyle = 'none';
      listItem.style.padding = '10px';
      listItem.style.cursor = 'pointer';
      listItem.style.borderBottom = '1px solid #ccc';
      listItem.style.textAlign = 'left'; // Ensure left alignment for each track

      listItem.addEventListener('click', () => {
        if (this.currentTrackIndex === index) {
          // Toggle play/pause if clicking the current track
          if (this.audioPlayer.paused) {
            this.audioPlayer.play();
          } else {
            this.audioPlayer.pause();
          }
        } else {
          // Load and play the new track
          this.loadTrack(index);
        }
      });

      this.trackListElement.appendChild(listItem);
    });
  };

  AudioPlayer.prototype.loadTrack = function(index) {
    this.currentTrackIndex = index;
    const track = this.playlist[index];

    if (track) {
      this.audioPlayer.src = track.url;
      this.audioPlayer.play();
      this.onTrackStart(track);

      Array.from(this.trackListElement.children).forEach((item, idx) => {
        item.classList.toggle('active', idx === index);
        item.style.backgroundColor = idx === index ? '#007acc' : '';
        item.style.color = idx === index ? 'white' : 'black';
      });

      this.updatePlayButton();
    }
  };

  AudioPlayer.prototype.nextTrack = function() {
    if (this.shuffle) {
      if (this.shuffleHistory.length === this.playlist.length) {
        this.shuffleHistory = [];
      }
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * this.playlist.length);
      } while (nextIndex === this.currentTrackIndex || this.shuffleHistory.includes(nextIndex));

      this.shuffleHistory.push(nextIndex);
      this.currentTrackIndex = nextIndex;
    } else {
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
    }
    this.loadTrack(this.currentTrackIndex);
  };

  AudioPlayer.prototype.prevTrack = function() {
    if (this.shuffle && this.shuffleHistory.length > 1) {
      this.shuffleHistory.pop(); // Remove current track
      this.currentTrackIndex = this.shuffleHistory[this.shuffleHistory.length - 1];
    } else {
      this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    }
    this.loadTrack(this.currentTrackIndex);
  };

  // Expose the AudioPlayer globally
  window.AudioPlayer = AudioPlayer;
})();

// Usage Example:
// const playlist = [
//   { title: 'Relaxing Tune', artist: 'Artist 1', url: 'https://www.example.com/audio/track1.mp3' },
//   { title: 'Chill Vibes', artist: 'Artist 2', url: 'https://www.example.com/audio/track2.mp3' },
//   { title: 'Focus Beat', artist: 'Artist 3', url: 'https://www.example.com/audio/track3.mp3' }
// ];
//
// window.addEventListener('DOMContentLoaded', () => {
//   new AudioPlayer(playlist, 'player-container', {
//     onTrackStart: (track) => console.log('Now playing:', track.title),
//     onFiveSecondMark: (track) => console.log('5 seconds into track:', track.title)
//   });
// });

