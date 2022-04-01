import { useContext } from 'react';
import ControlsContext from './context';

const useControls = () => {
  const context = useContext(ControlsContext);

  if (!context) {
    throw new Error(
      'Playback context must be consumed inside the Controls Provider'
    );
  }

  return context;
};

export default useControls;
