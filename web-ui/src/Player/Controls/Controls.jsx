import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import './Controls.css';
import { formatTime } from '../../utils';
import { LIVE, VOD, VOD_LOADING_TIMEOUT, VOD_STEP_SIZE } from '../../constants';
import BackToLiveBtn from './BackToLiveBtn';
import Backward60SVG from '../../assets/icons/backward-60';
import Forward60SVG from '../../assets/icons/forward-60';
import PauseSVG from '../../assets/icons/pause';
import PlaySVG from '../../assets/icons/play';
import useControls from '../../contexts/Controls/useControls';
import usePlayback from '../../contexts/Playback/usePlayback';
import usePrevious from '../../hooks/usePrevious';
import useFirstMountState from '../../hooks/useFirstMountState';
import useSeekBar, {
  playerControlSeekBarWrapperId
} from '../../hooks/useSeekBar';

const Controls = ({ isLive = true }) => {
  const { stopPropagAndResetTimeout } = useControls();
  const {
    activePlayer,
    bufferPercent,
    currProgress,
    getVodDuration,
    getVodPosition,
    isLiveAvailable,
    isVodAvailable,
    recordingStartTime,
    resetVOD,
    seekVodToPos,
    setActivePlayerType,
    vodPlayerInstance
  } = usePlayback();
  const prevProgress = usePrevious(currProgress);
  const {
    error,
    isLoading,
    isPaused,
    pause,
    play,
    type: activePlayerType
  } = activePlayer;
  const {
    isMouseDown,
    onPointerDownHandler,
    scrubRef,
    seekBarRef,
    updateProgress,
    timeSinceLive,
    timeSinceLiveRef
  } = useSeekBar();
  const hasError = !!error;
  const isLiveAvailablePrev = usePrevious(isLiveAvailable);
  const isBackwardsDisabled = hasError || !isVodAvailable || currProgress === 0;
  const isForwardsDisabled = hasError || isLive;
  const isSeekBarDisabled = hasError;
  const isFirstMount = useFirstMountState();
  const prevLivePosition = useRef(null);
  const [backToLiveStartProgress, setBackToLiveStartProgress] = useState(null);
  const [backToLivePosDiff, setBackToLivePosDiff] = useState(null);
  const isBackToLiveTransition =
    backToLiveStartProgress !== null && backToLivePosDiff !== null;

  const goBackwards = useCallback(
    (event, seconds = 60) => {
      stopPropagAndResetTimeout(event);

      if (!isBackwardsDisabled) {
        const currentVODDuration = getVodDuration();
        const currentVODPosition = getVodPosition();
        const nextPosition = Math.max(0, currentVODPosition - seconds); // position in seconds
        const nextProgress = (nextPosition / currentVODDuration) * 100;

        updateProgress(nextProgress);
      }
    },
    [
      getVodDuration,
      getVodPosition,
      isBackwardsDisabled,
      stopPropagAndResetTimeout,
      updateProgress
    ]
  );
  const goForwards = useCallback(
    (event, seconds = 60) => {
      stopPropagAndResetTimeout(event);

      if (!isForwardsDisabled) {
        const currentVODDuration = getVodDuration();
        const currentVODPosition = getVodPosition();
        let nextPosition = Math.min(
          currentVODPosition + seconds,
          currentVODDuration
        ); // position in seconds
        let nextProgress = (nextPosition / currentVODDuration) * 100;

        updateProgress(nextProgress);
      }
    },
    [
      getVodDuration,
      getVodPosition,
      isForwardsDisabled,
      stopPropagAndResetTimeout,
      updateProgress
    ]
  );
  const onKeyDownHandler = useCallback(
    (event) => {
      if (event.key === 'ArrowRight' && !event.repeat) {
        goForwards(null, VOD_STEP_SIZE);
      } else if (event.key === 'ArrowLeft' && !event.repeat) {
        goBackwards(null, VOD_STEP_SIZE);
      }
    },
    [goBackwards, goForwards]
  );
  const onPointerDownPlayPauseHandler = useCallback(
    (event) => {
      if (hasError) return;

      stopPropagAndResetTimeout(event);

      const currentVODDuration = getVodDuration() || 0;

      if (isPaused) {
        if (
          activePlayer.type === LIVE &&
          prevLivePosition.current &&
          prevLivePosition.current < currentVODDuration
        ) {
          seekVodToPos(prevLivePosition.current);
          setActivePlayerType(VOD);
        }

        play();
      } else {
        const now = Date.now();
        prevLivePosition.current = (now - recordingStartTime) / 1000;

        pause();
      }
    },
    [
      activePlayer.type,
      getVodDuration,
      hasError,
      isPaused,
      pause,
      play,
      recordingStartTime,
      seekVodToPos,
      setActivePlayerType,
      stopPropagAndResetTimeout
    ]
  );
  const backToLive = useCallback(
    (event) => {
      if (event) {
        stopPropagAndResetTimeout(event);
      }

      const scrubStyle = getComputedStyle(scrubRef.current);
      const seekbarStyle = getComputedStyle(seekBarRef.current);

      setBackToLivePosDiff(
        parseFloat(seekbarStyle.width) - parseFloat(scrubStyle.left) - 14
      );
      setBackToLiveStartProgress(currProgress);
      updateProgress(100, false);
    },
    [
      currProgress,
      scrubRef,
      seekBarRef,
      stopPropagAndResetTimeout,
      updateProgress
    ]
  );
  const onTransitionEndHandler = useCallback(() => {
    setBackToLivePosDiff(null);
    setBackToLiveStartProgress(null);
    updateProgress(100);
  }, [setBackToLiveStartProgress, updateProgress]);

  // Set the playback position based on currProgress, defined by user input
  useEffect(() => {
    const playerType = currProgress < 100 ? VOD : LIVE;

    if (!isMouseDown && !isFirstMount && vodPlayerInstance) {
      const currentVODDuration = getVodDuration();
      const currentVODPosition = getVodPosition();
      const currentScrubberPosition = Math.max(
        0.01,
        (currProgress / 100) * currentVODDuration
      );
      const seekPosition =
        playerType === VOD ? currentScrubberPosition : currentVODDuration;

      // This condition prevents from calling the seekTo function more than necessary
      if (Math.abs(currentScrubberPosition - currentVODPosition) > 1) {
        seekVodToPos(seekPosition);
      }
    }

    setActivePlayerType(playerType);
  }, [
    currProgress,
    getVodDuration,
    getVodPosition,
    isFirstMount,
    isMouseDown,
    seekVodToPos,
    setActivePlayerType,
    vodPlayerInstance
  ]);

  // Switch to the LIVE player if the VOD loading has stalled for longer than VOD_LOADING_TIMEOUT seconds
  const timeoutId = useRef();
  useEffect(() => {
    if (activePlayerType === VOD && isLoading && !timeoutId.current) {
      timeoutId.current = setTimeout(backToLive, VOD_LOADING_TIMEOUT);
    }

    return () => {
      if (activePlayerType === LIVE || !isLoading) {
        clearTimeout(timeoutId.current);
        timeoutId.current = null;
      }
    };
  }, [activePlayerType, backToLive, isLoading]);

  // Switch to the LIVE player if a new livestream
  useEffect(() => {
    if (isLiveAvailablePrev === false && isLiveAvailable) {
      backToLive();
      resetVOD();
    }
  }, [backToLive, isLiveAvailable, isLiveAvailablePrev, resetVOD]);

  const bufferPercentBg =
    prevProgress > currProgress ? currProgress : bufferPercent;
  const darkGrayColour = 'rgba(255, 255, 255, 0.3)';
  const prevBgPercent = isBackToLiveTransition
    ? backToLiveStartProgress
    : currProgress;
  let seekbarBg = `linear-gradient(
      to right,
      ${!isPaused ? 'var(--color-pill-red)' : darkGrayColour} ${prevBgPercent}%,
      rgba(255, 255, 255, 0.5) ${prevBgPercent}% ${bufferPercentBg}%,
      ${darkGrayColour} ${bufferPercentBg}%
    )`;

  return (
    <>
      {!isLive && <BackToLiveBtn onPointerDownHandler={backToLive} />}
      <div className="player-controls-wrapper">
        <div className="player-controls-btn-container">
          <button
            aria-disabled={isBackwardsDisabled}
            className="player-controls-btn"
            onPointerDown={goBackwards}
          >
            <Backward60SVG />
          </button>
          <button
            aria-disabled={hasError}
            className={`player-controls-btn play-pause-btn ${
              isPaused ? 'play-btn' : 'pause-btn'
            }`}
            onPointerDown={onPointerDownPlayPauseHandler}
          >
            {isPaused ? <PlaySVG /> : <PauseSVG />}
          </button>
          <button
            aria-disabled={isForwardsDisabled}
            className="player-controls-btn"
            onPointerDown={goForwards}
          >
            <Forward60SVG />
          </button>
        </div>
        <div
          aria-disabled={isSeekBarDisabled}
          aria-valuenow={currProgress}
          id={playerControlSeekBarWrapperId}
          onKeyDown={onKeyDownHandler}
          onPointerDown={onPointerDownHandler}
          ref={seekBarRef}
          role="slider"
          tabIndex={0}
        >
          <p
            className="time-since-live"
            ref={timeSinceLiveRef}
            style={
              !hasError &&
              (activePlayer.type === VOD || isMouseDown) &&
              isVodAvailable
                ? {}
                : { opacity: 0 }
            }
          >
            -{formatTime(timeSinceLive)}
          </p>
          <div
            className="player-controls-seek-bar"
            style={{ background: seekbarBg }}
          ></div>
          <div
            className="player-controls-seek-bar-back-to-live"
            onTransitionEnd={onTransitionEndHandler}
            style={{
              left: `${backToLiveStartProgress}%`,
              opacity: isBackToLiveTransition ? 1 : 0,
              width: isBackToLiveTransition
                ? `${100 - backToLiveStartProgress}%`
                : 0
            }}
          ></div>
          <button
            aria-disabled={isSeekBarDisabled}
            className="player-controls-scrub"
            onPointerDown={onPointerDownHandler}
            ref={scrubRef}
            style={
              isBackToLiveTransition
                ? {
                    transform: `translateX(${backToLivePosDiff}px)`
                  }
                : { transition: 'none' }
            }
            tabIndex={-1}
          ></button>
        </div>
      </div>
    </>
  );
};

Controls.propTypes = {
  isLive: PropTypes.bool
};

export default Controls;
