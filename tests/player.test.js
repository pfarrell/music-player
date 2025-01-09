// player.test.js

const { AudioPlayer, PLAY_SYMBOL, PAUSE_SYMBOL, PREV_SYMBOL, NEXT_SYMBOL, SHUFFLE_SYMBOL } = require('../src/player');

function decodeHTMLEntity(entity) {
  const div = document.createElement('div');
  div.innerHTML = entity;
  return div.textContent;
}

describe('AudioPlayer', () => {
  let audioPlayer;
  let container;
  let audioElement;
  let mockPlaylist;
  let onTrackStart;
  let onFiveSecondMark;

  beforeEach(() => {
    mockPlaylist = [
      { title: 'Song 1', artist: 'Artist 1', url: 'song1.mp3' },
      { title: 'Song 2', artist: 'Artist 2', url: 'song2.mp3' },
      { title: 'Song 3', artist: 'Artist 3', url: 'song3.mp3' }
    ];

    container = document.createElement('div');
    container.id = 'player-container';
    document.body.appendChild(container);

    audioElement = document.createElement('audio');
    audioElement.play = jest.fn().mockResolvedValue();
    audioElement.pause = jest.fn();
    
    Object.defineProperties(audioElement, {
      currentTime: {
        get: function() { return this._currentTime || 0; },
        set: function(value) { this._currentTime = value; }
      },
      duration: {
        get: function() { return this._duration || 0; },
        set: function(value) { this._duration = value; }
      },
      paused: {
        get: function() { return this._paused !== false; },
        set: function(value) { this._paused = value; }
      }
    });

    onTrackStart = jest.fn();
    onFiveSecondMark = jest.fn();

    audioPlayer = new AudioPlayer(mockPlaylist, audioElement, container, {
      onTrackStart,
      onFiveSecondMark
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with correct playlist', () => {
      expect(audioPlayer.playlist).toEqual(mockPlaylist);
      expect(audioPlayer.currentTrackIndex).toBe(0);
    });

    test('should create all UI elements', () => {
      expect(container.querySelector('audio')).toBeTruthy();
      expect(container.querySelectorAll('.player-btn')).toHaveLength(4);
      expect(container.querySelector('.playlist')).toBeTruthy();
    });

    test('should throw error if container is not provided', () => {
      expect(() => new AudioPlayer(mockPlaylist, audioElement, null)).toThrow('Container element not found');
    });
  });

  describe('Playback Controls', () => {
    test('play button should toggle play/pause', async () => {
      const playButton = container.querySelectorAll('.player-btn')[1];
      
      expect(decodeHTMLEntity(playButton.innerHTML)).toBe(decodeHTMLEntity(PLAY_SYMBOL));
      
      await playButton.click();
      expect(audioElement.play).toHaveBeenCalled();
      
      audioElement._paused = false;
      audioElement.dispatchEvent(new Event('play'));
      expect(decodeHTMLEntity(playButton.innerHTML)).toBe(decodeHTMLEntity(PAUSE_SYMBOL));
      
      playButton.click();
      expect(audioElement.pause).toHaveBeenCalled();
    });

    test('prev button should play previous track', () => {
      const prevButton = container.querySelectorAll('.player-btn')[0];
      audioPlayer.currentTrackIndex = 1;
      
      prevButton.click();
      expect(audioPlayer.currentTrackIndex).toBe(0);
      expect(audioElement.play).toHaveBeenCalled();
    });

    test('next button should play next track', () => {
      const nextButton = container.querySelectorAll('.player-btn')[2];
      
      nextButton.click();
      expect(audioPlayer.currentTrackIndex).toBe(1);
      expect(audioElement.play).toHaveBeenCalled();
    });
  });

  describe('Shuffle Functionality', () => {
    test('shuffle button should toggle shuffle mode', () => {
      const shuffleButton = container.querySelectorAll('.player-btn')[3];
      
      expect(audioPlayer.shuffle).toBe(false);
      shuffleButton.click();
      expect(audioPlayer.shuffle).toBe(true);
      expect(shuffleButton.style.opacity).toBe('1');
      
      shuffleButton.click();
      expect(audioPlayer.shuffle).toBe(false);
      expect(shuffleButton.style.opacity).toBe('0.5');
    });

    test('should maintain shuffle history', () => {
      audioPlayer.shuffle = true;
      audioPlayer.shuffleHistory = [0];
      
      audioPlayer.playNextTrack();
      expect(audioPlayer.shuffleHistory.length).toBe(2);
      expect(audioPlayer.shuffleHistory).toContain(audioPlayer.currentTrackIndex);
    });
  });

  describe('Progress and Time Display', () => {
    test('should update progress bar and time display', () => {
      audioElement._duration = 200;
      audioElement._currentTime = 100;
      
      audioElement.dispatchEvent(new Event('timeupdate'));
      
      const progressBar = container.querySelector('input[type="range"]');
      expect(progressBar.value).toBe('50');
      
      const timeDisplay = container.querySelector('.time-display');
      expect(timeDisplay.textContent).toBe('1:40');
    });

    test('should update current time when progress bar is adjusted', () => {
      audioElement._duration = 200;
      const progressBar = container.querySelector('input[type="range"]');
      
      progressBar.value = 50;
      progressBar.dispatchEvent(new Event('input'));
      
      expect(audioElement.currentTime).toBe(100);
    });
  });

  describe('Playlist Interaction', () => {
    test('clicking playlist item should play track', () => {
      const playlistItems = container.querySelectorAll('.track-item');
      playlistItems[1].click();
      
      expect(audioPlayer.currentTrackIndex).toBe(1);
      expect(audioElement.play).toHaveBeenCalled();
      expect(onTrackStart).toHaveBeenCalledWith(mockPlaylist[1]);
    });

    test('active track should be highlighted', () => {
      const playlistItems = container.querySelectorAll('.track-item');
      playlistItems[1].click();
      
      expect(playlistItems[1].classList.contains('active')).toBe(true);
      expect(playlistItems[1].style.backgroundColor).toBe('rgb(0, 122, 204)');
    });
  });

  describe('Callbacks', () => {
    test('should handle track prefix callback', () => {
      const trackPrefix = jest.fn(track => `${track.artist} - ${track.title}`);
      audioPlayer = new AudioPlayer(mockPlaylist, audioElement, container, {
        onTrackStart,
        onFiveSecondMark,
        trackPrefix
      });
      
      audioPlayer.loadPlaylistUI();
      const playlistItems = container.querySelectorAll('.track-item');
      expect(playlistItems[0].textContent).toBe('1. Song 1 - Artist 1');
      expect(trackPrefix).toHaveBeenCalledWith(mockPlaylist[0]);
    });
    test('should trigger onTrackStart callback', () => {
      audioPlayer.loadAndPlayTrack(1);
      expect(onTrackStart).toHaveBeenCalledWith(mockPlaylist[1]);
    });

    test('should trigger onFiveSecondMark callback', () => {
      audioElement._currentTime = 6;
      audioElement.dispatchEvent(new Event('timeupdate'));
      
      expect(onFiveSecondMark).toHaveBeenCalledWith(mockPlaylist[0]);
      
      // Should only trigger once per track
      audioElement._currentTime = 7;
      audioElement.dispatchEvent(new Event('timeupdate'));
      expect(onFiveSecondMark).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid track index', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      
      audioPlayer.loadAndPlayTrack(-1);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading track:', expect.any(Error));
      
      audioPlayer.loadAndPlayTrack(mockPlaylist.length + 1);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading track:', expect.any(Error));
    });
  });
});
