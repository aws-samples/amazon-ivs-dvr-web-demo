import React from 'react';

import './App.css';
import ControlsProvider from './contexts/Controls/provider';
import MobileBreakpointProvider from './contexts/MobileBreakpoint/provider';
import PlaybackProvider from './contexts/Playback/provider';
import Player from './Player/Player';

const App = () => (
  <div className="app">
    <MobileBreakpointProvider>
      <PlaybackProvider>
        <ControlsProvider>
          <Player />
        </ControlsProvider>
      </PlaybackProvider>
    </MobileBreakpointProvider>
  </div>
);

export default App;
