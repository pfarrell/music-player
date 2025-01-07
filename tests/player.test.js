const { JSDOM } = require('jsdom');

// Import the player script in the test environment
const fs = require('fs');
const path = require('path');
const playerScript = fs.readFileSync(path.join(__dirname, '../src/player.js'), 'utf-8');
const dom = new JSDOM(`<!DOCTYPE html><body><div id="player-container"></div></body>`, {
  runScripts: "dangerously",
  resources: "usable"
});

dom.window.eval(playerScript);

// Mock HTMLMediaElement methods to prevent unimplemented errors
Object.defineProperty(dom.window.HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: jest.fn(() => Promise.resolve()) // Return a resolved promise to simulate `play`
});

Object.defineProperty(dom.window.HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: jest.fn()
});

Object.defineProperty(dom.window.HTMLMediaElement.prototype, 'currentTime', {
  writable: true,
  value: 0
});

Object.defineProperty(dom.window.HTMLMediaElement.prototype, 'duration', {
  writable: true,
  value: 60 // Simulated track duration
});

describe('AudioPlayer', () => {
  let player;
  let onTrackStartMock;
  let onFiveSecondMarkMock;

  beforeEach(() => {
    onTrackStartMock = jest.fn();
    onFiveSecondMarkMock = jest.fn();

    const playlist = [
      { title: 'Track 1', artist: 'Artist 1', url: 'track1.mp3' },
      { title: 'Track 2', artist: 'Artist 2', url: 'track2.mp3' }
    ];

    player = new dom.window.AudioPlayer(playlist, 'player-container', {
      onTrackStart: onTrackStartMock,
      onFiveSecondMark: onFiveSecondMarkMock
    });
  });

  test('should call onTrackStart when a track starts playing', () => {
    player.loadTrack(0);
    player.audioPlayer.dispatchEvent(new dom.window.Event('play'));
    expect(onTrackStartMock).toHaveBeenCalledWith({ title: 'Track 1', artist: 'Artist 1', url: 'track1.mp3' });
  });

  test('should trigger onFiveSecondMark callback after 5 seconds of playback', () => {
    player.loadTrack(0);
    player.audioPlayer.currentTime = 5;
    player.audioPlayer.dispatchEvent(new dom.window.Event('timeupdate'));
    expect(onFiveSecondMarkMock).toHaveBeenCalledWith({ title: 'Track 1', artist: 'Artist 1', url: 'track1.mp3' });
  });

  test('should move to the next track on `nextTrack` call', () => {
    player.loadTrack(0);
    player.nextTrack();
    expect(player.currentTrackIndex).toBe(1);
  });

  test('should move to the previous track on `prevTrack` call', () => {
    player.loadTrack(1);
    player.prevTrack();
    expect(player.currentTrackIndex).toBe(0);
  });

  test('should not throw errors when play and pause are called', () => {
    expect(() => {
      player.audioPlayer.play();
      player.audioPlayer.pause();
    }).not.toThrow();
  });

  test('should reset fiveSecondCallbackTriggered after loading a new track', () => {
    player.loadTrack(0);
    player.audioPlayer.currentTime = 5;
    player.audioPlayer.dispatchEvent(new dom.window.Event('timeupdate'));
    expect(onFiveSecondMarkMock).toHaveBeenCalledTimes(1);

    player.loadTrack(1); // Load a new track and reset callbacks
    expect(player.fiveSecondCallbackTriggered).toBe(false);
  });

  afterEach(() => {
    player.fiveSecondCallbackTriggered = false; // Ensure it's reset for subsequent tests
  });
});

// Usage steps:
// 1. Install dependencies: `npm install`
// 2. Run tests: `npm test`
// 3. Serve locally: Open `index.html` for manual testing
