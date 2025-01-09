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

  // Mock HTML elements and audio functionality
  beforeEach(() => {
    // Setup mock playlist
    mockPlaylist = [
      { title: 'Song 1', artist: 'Artist 1', url: 'song1.mp3' },
      { title: 'Song 2', artist: 'Artist 2', url: 'song2.mp3' },
      { title: 'Song 3', artist: 'Artist 3', url: 'song3.mp3' }
    ];

    // Create container element
    container = document.createElement('div');
    container.id = 'player-container';
    document.body.appendChild(container);

    // Create audio element with mock methods and properties
    audioElement = document.createElement('audio');
    audioElement.play = jest.fn().mockResolvedValue();
    audioElement.pause = jest.fn();
    
    // Mock audio element properties
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

    // Initialize player
    audioPlayer = new AudioPlayer(mockPlaylist, audioElement, container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Playback Controls', () => {
    test('play button should toggle play/pause', async () => {
      const playButton = container.querySelectorAll('.player-btn')[1]; // second button is play button
      
      // Initial state (paused)
      expect(playButton.textContent).toBe(decodeHTMLEntity(PLAY_SYMBOL));
      
      // Click to play
      await playButton.click();
      expect(audioElement.play).toHaveBeenCalled();
      
      // Simulate play event
      audioElement._paused = false;
      audioElement.dispatchEvent(new Event('play'));
      expect(playButton.textContent).toBe(decodeHTMLEntity(PAUSE_SYMBOL));
      
      // Click to pause
      playButton.click();
      expect(audioElement.pause).toHaveBeenCalled();
      
      // Simulate pause event
      audioElement._paused = true;
      audioElement.dispatchEvent(new Event('pause'));
      expect(playButton.textContent).toBe(decodeHTMLEntity(PLAY_SYMBOL));
    });

    // ... [rest of the tests remain the same]
  });
});
