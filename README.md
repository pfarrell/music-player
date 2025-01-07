# Audio Player Project

This project is a customizable HTML5 audio player with support for playlists, callbacks, and shuffle playback.

## Installation
```bash
npm install
```

## Running Tests
```bash
npm test
```

## Example Usage
```html
<div id="player-container"></div>
<script src="src/player.js"></script>
<script>
  const playlist = [
    { title: 'Relaxing Tune', artist: 'Artist 1', url: 'track1.mp3' },
    { title: 'Chill Vibes', artist: 'Artist 2', url: 'track2.mp3' }
  ];
  new AudioPlayer(playlist, 'player-container', {
    onTrackStart: (track) => console.log('Now playing:', track.title),
    onFiveSecondMark: (track) => console.log('5 seconds into track:', track.title)
  });
</script>
```

