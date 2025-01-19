// player.js
const PLAY_SYMBOL = '&#9205;';
const PAUSE_SYMBOL = '&#9208;';
const PREV_SYMBOL = '&#9194;';
const NEXT_SYMBOL = '&#9193;';
const SHUFFLE_SYMBOL = '&#128256;';

function AudioPlayer(playlist, audioElement, containerElement, playlistElement, config = {}) {
  this.playlist = playlist || [];
  this.currentTrackIndex = -1;
  this.shuffle = config.shuffle || false;
  this.shuffleHistory = [];
  this.audioPlayer = audioElement;
  this.container = containerElement;
  this.playlistElement = playlistElement;
  this.onTrackStart = config.onTrackStart || function() {};
  this.onFiveSecondMark = config.onFiveSecondMark || function() {};
  this.getTrackPrefix = config.getTrackPrefix || (() => '');

  if (!this.container) {
    throw new Error('Container element not found');
  }

  this.init();
}

AudioPlayer.prototype.init = function() {
  this.audioPlayer.controls = false;
  this.container.appendChild(this.audioPlayer);

  this.controlsContainer = document.createElement('div');
  this.controlsContainer.className = 'controls';
  this.container.appendChild(this.controlsContainer);

  this.createControls();
  
  this.trackListElement = document.createElement('ul');
  this.trackListElement.className = 'playlist';
  this.trackListElement.style.textAlign = 'left';
  this.playlistElement.appendChild(this.trackListElement);

  this.attachAudioPlayerListeners();
  this.loadPlaylistUI();
  this.loadAndPlayTrack(this.currentTrackIndex);

};

AudioPlayer.prototype.createControls = function() {
  const controlsWrapper = document.createElement('div');
  controlsWrapper.style.display = 'flex';
  controlsWrapper.style.justifyContent = 'center';
  controlsWrapper.style.gap = '10px';
  controlsWrapper.style.alignItems = 'center';

  this.prevButtonElement = this.createPrevButton();
  this.playButtonElement = this.createPlayButton();

  this.timeElapsedDisplay = document.createElement('span');
  this.timeElapsedDisplay.className = 'time-display';
  this.timeElapsedDisplay.style.marginLeft = '10px';
  this.timeElapsedDisplay.textContent = '0:00';

  const progressBarWrapper = this.createProgressBar();

  this.trackLengthDisplay = document.createElement('span');
  this.trackLengthDisplay.className = 'time-display';
  this.trackLengthDisplay.style.marginRight = '10px';
  this.trackLengthDisplay.textContent = '0:00';

  this.nextButtonElement = this.createNextButton();
  this.shuffleToggleElement = this.createShuffleToggle();

  controlsWrapper.appendChild(progressBarWrapper);
  controlsWrapper.appendChild(this.timeElapsedDisplay);
  controlsWrapper.appendChild(this.trackLengthDisplay);
  controlsWrapper.appendChild(this.prevButtonElement);
  controlsWrapper.appendChild(this.playButtonElement);
  controlsWrapper.appendChild(this.nextButtonElement);
  controlsWrapper.appendChild(this.shuffleToggleElement);

  this.controlsContainer.appendChild(controlsWrapper);
};

AudioPlayer.prototype.createPrevButton = function() {
  const prevButton = document.createElement('button');
  prevButton.innerHTML = PREV_SYMBOL;
  prevButton.className = 'player-btn';
  prevButton.addEventListener('click', () => this.playPrevTrack());
  return prevButton;
};

AudioPlayer.prototype.createPlayButton = function() {
  const playButton = document.createElement('button');
  playButton.innerHTML = PLAY_SYMBOL;
  playButton.className = 'play-btn player-btn';
  playButton.addEventListener('click', () => {
    if (this.audioPlayer.paused) {
      //this.audioPlayer.play();
      this.loadAndPlayTrack(this.currentTrackIndex);
    } else {
      this.audioPlayer.pause();
    }
  });
  return playButton;
};

AudioPlayer.prototype.createNextButton = function() {
  const nextButton = document.createElement('button');
  nextButton.innerHTML = NEXT_SYMBOL;
  nextButton.className = 'player-btn';
  nextButton.addEventListener('click', () => this.playNextTrack());
  return nextButton;
};

AudioPlayer.prototype.createShuffleToggle = function() {
  const shuffleToggle = document.createElement('button');
  shuffleToggle.innerHTML = SHUFFLE_SYMBOL;
  shuffleToggle.className = 'player-btn';
  shuffleToggle.style.opacity = '0.5';
  shuffleToggle.style.transition = 'all 0.2s ease';

  shuffleToggle.addEventListener('click', () => {
    this.shuffle = !this.shuffle;
    shuffleToggle.style.opacity = this.shuffle ? '1' : '0.5';
    shuffleToggle.style.backgroundColor = this.shuffle ? '#007acc' : '';
    shuffleToggle.style.color = this.shuffle ? 'white' : '';

    if (this.shuffle) {
      this.shuffleHistory = [];
      // Select a random track different from current
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * this.playlist.length);
      } while (nextIndex === this.currentTrackIndex);

      this.shuffleHistory.push(nextIndex);
      this.loadAndPlayTrack(nextIndex);
    }

    this.shuffleHistory = [this.currentTrackIndex];
  });
  return shuffleToggle;
};

AudioPlayer.prototype.createProgressBar = function() {
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

  progressBarWrapper.appendChild(progressBar);
  return progressBarWrapper;
};

AudioPlayer.prototype.attachAudioPlayerListeners = function() {
  this.audioPlayer.addEventListener('ended', () => {
    this.playNextTrack();
  });

  this.audioPlayer.addEventListener('timeupdate', () => {
    if (this.audioPlayer.currentTime >= 5 && !this.fiveSecondCallbackTriggered) {
      this.onFiveSecondMark(this.playlist[this.currentTrackIndex]);
      this.fiveSecondCallbackTriggered = true;
    }

    if (this.audioPlayer.duration) {
      const progressBar = this.controlsContainer.querySelector('input[type="range"]');
      progressBar.value = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
      this.timeElapsedDisplay.textContent = this.formatTime(this.audioPlayer.currentTime);
      this.trackLengthDisplay.textContent = this.formatTime(this.audioPlayer.duration);
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

AudioPlayer.prototype.formatTime = function(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

AudioPlayer.prototype.updatePlayButton = function() {
  this.playButtonElement.innerHTML = this.audioPlayer.paused ? PLAY_SYMBOL : PAUSE_SYMBOL;
};

AudioPlayer.prototype.loadPlaylistUI = function() {
  this.trackListElement.innerHTML = '';

  this.playlist.forEach((track, index) => {
    const listItem = document.createElement('li');
    const prefix = this.getTrackPrefix(track, index);
    const trackText = document.createElement('span');
    trackText.textContent = `${index + 1}. ${track.title} - ${track.artist}`;

    listItem.className = 'track-item';
    listItem.style.listStyle = 'none';
    listItem.style.padding = '10px';
    listItem.style.display = 'flex';
    listItem.style.alignItems = 'center';
    listItem.style.cursor = 'pointer';
    listItem.style.borderBottom = '1px solid #ccc';
    listItem.style.textAlign = 'left';
    
    if (prefix) {
      const prefixElement = document.createElement('span');
      prefixElement.style.marginRight = '8px';
      prefixElement.innerHTML = prefix;
      listItem.appendChild(prefixElement);
    }
    listItem.appendChild(trackText);

    trackText.addEventListener('click', () => {
      if (this.currentTrackIndex === index && !this.audioPlayer.paused) {
        this.audioPlayer.pause();
      } else {
        this.loadAndPlayTrack(index);
      }
    });

    this.trackListElement.appendChild(listItem);
  });
};

AudioPlayer.prototype.loadAndPlayTrack = function(index) {
  try {
    if (this.playlist.length == 0) {
      return;
    }
    if (index < 0 || index >= this.playlist.length) {
      throw new Error('Invalid track index');
    }

    this.currentTrackIndex = index;
    const track = this.playlist[index];

    this.audioPlayer.src = track.url;
    //this.audioPlayer.load();
    this.audioPlayer.play();
    this.onTrackStart(track);

    Array.from(this.trackListElement.children).forEach((item, idx) => {
      item.classList.toggle('active', idx === index);
      //item.style.backgroundColor = idx === index ? '#007acc' : '';
      //item.style.color = idx === index ? 'white' : 'black';
    });

    this.updatePlayButton();

    if (this.shuffle && !this.shuffleHistory.includes(index)) {
      this.shuffleHistory.push(index);
    }
  } catch (error) {
    console.error('Error loading track:', error);
  }
};

AudioPlayer.prototype.playNextTrack = function() {
  if (this.shuffle) {
    const remainingTracks = Array.from({ length: this.playlist.length }, (_, i) => i)
      .filter(i => !this.shuffleHistory.includes(i));

    if (remainingTracks.length === 0) {
      this.shuffleHistory = [this.currentTrackIndex];
      remainingTracks.push(...Array.from({ length: this.playlist.length }, (_, i) => i)
        .filter(i => i !== this.currentTrackIndex));
    }

    const nextIndex = remainingTracks[Math.floor(Math.random() * remainingTracks.length)];
    this.loadAndPlayTrack(nextIndex);
  } else {
    const nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
    this.loadAndPlayTrack(nextIndex);
  }
};

AudioPlayer.prototype.playPrevTrack = function() {
  if (this.shuffle && this.shuffleHistory.length > 1) {
    this.shuffleHistory.pop();
    const prevIndex = this.shuffleHistory[this.shuffleHistory.length - 1];
    this.loadAndPlayTrack(prevIndex);
  } else {
    const prevIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    this.loadAndPlayTrack(prevIndex);
  }
};

AudioPlayer.prototype.addTrack = function(track) {
  if (!track || !track.title || !track.url) {
    throw new Error('Invalid track object. Must contain at least title and url properties');
  }
  this.playlist.push(track);
  this.loadPlaylistUI();
  if(this.currentTrackIndex == -1) {
    this.currentTrackIndex = 0;
    this.loadAndPlayTrack(0);
  }
  return this.playlist.length - 1; // Return index of newly added track
};

AudioPlayer.prototype.addTracks = function(tracks) {
  if (!Array.isArray(tracks)) {
    throw new Error('Tracks must be provided as an array');
  }
  
  const invalidTracks = tracks.filter(track => !track || !track.title || !track.url);
  if (invalidTracks.length > 0) {
    throw new Error('One or more tracks are invalid. Each track must contain at least title and url properties');
  }
  
  const startIndex = this.playlist.length;
  this.playlist.push(...tracks);
  this.loadPlaylistUI();
  return { startIndex, count: tracks.length };
};

AudioPlayer.prototype.clearPlaylist = function() {
  this.playlist = [];
  this.currentTrackIndex = 0;
  this.shuffleHistory = [];
  this.loadPlaylistUI();
  this.audioPlayer.pause();
  this.audioPlayer.src = '';
};

// For browser environments
if (typeof window !== 'undefined') {
  window.AudioPlayer = AudioPlayer;
}

// For module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AudioPlayer,
    PLAY_SYMBOL,
    PAUSE_SYMBOL,
    PREV_SYMBOL,
    NEXT_SYMBOL,
    SHUFFLE_SYMBOL
  };
}
