import { useContext } from 'react';
import PlaybackContext from './context';

const usePlayback = () => {
  const context = useContext(PlaybackContext);

  if (!context) {
    throw new Error(
      'Playback context must be consumed inside the Playback Provider'
    );
  }

  return context;
};

export default usePlayback;
