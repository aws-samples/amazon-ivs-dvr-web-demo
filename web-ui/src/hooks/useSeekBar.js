import { useCallback, useEffect, useRef, useState } from 'react';

import { bound } from '../utils';
import { VOD } from '../constants';
import useControls from '../contexts/Controls/useControls';
import usePlayback from '../contexts/Playback/usePlayback';

export const playerControlSeekBarWrapperId = 'player-controls-seek-bar-wrapper';

const useSeekBar = () => {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const { stopPropagAndResetTimeout } = useControls();
  const {
    activePlayer,
    currProgress,
    getVodDuration,
    getVodPosition,
    isVodAvailable,
    setBufferPercent,
    setCurrProgress,
    vodPlayerInstance
  } = usePlayback();
  const scrubRef = useRef(null);
  const seekBarRef = useRef(null);
  const timeSinceLiveRef = useRef(null);
  const [timeSinceLive, setTimeSinceLive] = useState(0);
  const { isPaused, type: playerType, error } = activePlayer;
  const hasError = !!error;

  const updateScrubPosition = useCallback((nextProgress) => {
    const seekBarStyle = getComputedStyle(seekBarRef.current);
    const seekBarWidth = parseFloat(seekBarStyle.width);
    const scrubStyle = getComputedStyle(scrubRef.current);
    const scrubWidth = parseFloat(scrubStyle.width);
    let newPosition = (seekBarWidth * nextProgress) / 100 - scrubWidth;

    if (nextProgress === 0) {
      newPosition = 0;
    } else if (nextProgress === 100) {
      newPosition = seekBarWidth - 14;
    }

    scrubRef.current.style.left = newPosition + 'px';

    const seekBarClientRect = seekBarRef.current.getBoundingClientRect();
    const timeSinceLiveStyle = getComputedStyle(timeSinceLiveRef.current);
    const timeSinceLiveWidth = parseInt(timeSinceLiveStyle.width, 10);
    const timeSinceLiveBoundedPosition = bound(
      newPosition - timeSinceLiveWidth / 2 + 7,
      8 - seekBarClientRect.left,
      seekBarClientRect.right - timeSinceLiveWidth - 8
    ); // On mobile, keeps the time within 8px of the left and right sides of the screen

    timeSinceLiveRef.current.style.left = timeSinceLiveBoundedPosition + 'px';
  }, []);
  const updateProgress = useCallback(
    (progress, shouldUpdateScrubPosition = true) => {
      if (
        hasError ||
        (progress === undefined && (isMouseDown || playerType !== VOD))
      )
        return;

      const currentVODDuration = getVodDuration();
      const currentVODPosition = getVodPosition();
      const currentVODBufferedDuration =
        vodPlayerInstance?.getBufferDuration() || 0;

      let nextProgress =
        progress !== undefined
          ? progress
          : (currentVODPosition / currentVODDuration) * 100;
      if (!isFinite(nextProgress)) nextProgress = 0;

      let nextBufferPercent =
        ((currentVODPosition + currentVODBufferedDuration) /
          currentVODDuration) *
        100;
      if (!isFinite(nextBufferPercent)) nextBufferPercent = 0;

      const nextPos = (nextProgress / 100) * currentVODDuration;

      setCurrProgress(nextProgress, (prevProgress) => {
        setBufferPercent(
          prevProgress > nextProgress ? nextProgress : nextBufferPercent
        );

        setTimeSinceLive(Math.floor(currentVODDuration - nextPos));
      });

      if (shouldUpdateScrubPosition) {
        updateScrubPosition(nextProgress);
      }
    },
    [
      getVodDuration,
      getVodPosition,
      hasError,
      isMouseDown,
      updateScrubPosition,
      playerType,
      setBufferPercent,
      setCurrProgress,
      vodPlayerInstance
    ]
  );
  const onScrubHandler = useCallback(
    (event, override) => {
      // "override" is used when the user just sought by clicking on the bar
      if (isVodAvailable && !hasError && (isMouseDown || override)) {
        stopPropagAndResetTimeout(event);

        const seekBarClientRect = seekBarRef.current.getBoundingClientRect();
        const seekBarStyle = getComputedStyle(seekBarRef.current);
        const seekBarWidth = parseFloat(seekBarStyle.width);
        const newPosition = event.clientX - seekBarClientRect.left - 7;
        let progress = (newPosition / seekBarWidth) * 100;

        if (event.clientX - 7 <= seekBarClientRect.left) {
          progress = 0;
        } else if (event.clientX + 7 >= seekBarClientRect.left + seekBarWidth) {
          progress = 100;
        }

        updateProgress(Math.max(0, progress));
      }
    },
    [
      hasError,
      isMouseDown,
      isVodAvailable,
      stopPropagAndResetTimeout,
      updateProgress
    ]
  );
  const onPointerDownHandler = useCallback(
    (event) => {
      setIsMouseDown(true);

      if (
        // This condition is used to seek by clicking on the seek bar
        // The click can sometimes be on the child
        [event.target.id, event.target?.parentElement?.id].includes(
          playerControlSeekBarWrapperId
        )
      ) {
        onScrubHandler(event, true);
      } else {
        stopPropagAndResetTimeout(event);
      }
    },
    [onScrubHandler, stopPropagAndResetTimeout]
  );
  const onMouseUpHandler = useCallback(() => {
    setIsMouseDown(false);
  }, []);

  useEffect(() => {
    const onResizeHandler = () => {
      updateScrubPosition(currProgress);
    };

    document.addEventListener('pointermove', onScrubHandler);
    document.addEventListener('pointerup', onMouseUpHandler);
    window.addEventListener('resize', onResizeHandler);

    return () => {
      document.removeEventListener('pointermove', onScrubHandler);
      document.removeEventListener('pointerup', onMouseUpHandler);
      window.removeEventListener('resize', onResizeHandler);
    };
  }, [currProgress, onScrubHandler, onMouseUpHandler, updateScrubPosition]);

  useEffect(() => {
    // Make sure we position the scrubber correctly on mount
    updateScrubPosition(100);
  }, [updateScrubPosition]);

  useEffect(() => {
    let intervalID;

    if (!isPaused && isVodAvailable) {
      intervalID = setInterval(updateProgress, 1000);
    }

    return () => clearInterval(intervalID);
  }, [isPaused, isVodAvailable, updateProgress]);

  return {
    isMouseDown,
    onPointerDownHandler,
    scrubRef,
    seekBarRef,
    timeSinceLive,
    timeSinceLiveRef,
    updateProgress
  };
};

export default useSeekBar;
