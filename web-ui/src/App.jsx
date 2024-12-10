import React from 'react';

import './App.css';
import ControlsProvider from './contexts/Controls/provider';
import MobileBreakpointProvider from './contexts/MobileBreakpoint/provider';
import PlaybackProvider from './contexts/Playback/provider';
import SPPlaybackProvider from './contexts/SinglePlayerPlayback/provider';
import Player from './Player';
import SinglePlayer from './SinglePlayer';

const PLAYER_MODES = {
  SINGLE: 'SINGLE',
  DOUBLE: 'DOUBLE'
};
const PLAYER_MODE =
  window.location.pathname === '/alt'
    ? PLAYER_MODES.SINGLE
    : PLAYER_MODES.DOUBLE;

const App = () => (
  <div className="app">
    <MobileBreakpointProvider>
      {PLAYER_MODE === PLAYER_MODES.SINGLE ? (
        <SPPlaybackProvider>
          <ControlsProvider>
            <SinglePlayer />
          </ControlsProvider>
        </SPPlaybackProvider>
      ) : (
        <PlaybackProvider>
          <ControlsProvider>
            <Player />
          </ControlsProvider>
        </PlaybackProvider>
      )}
    </MobileBreakpointProvider>
  </div>
);

export default App;
