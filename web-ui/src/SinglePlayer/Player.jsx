import React, { useCallback } from 'react';

import '../Player/Player.css';
import { LIVE } from '../constants';
import Controls from './Controls';
import FadeInOut from '../Player/FadeInOut/FadeInOut';
import Notification from '../Player/Notification';
import Spinner from '../Player/Spinner';
import StatusPill from './StatusPill';
import useControls from '../contexts/Controls/useControls';
import useMobileBreakpoint from '../contexts/MobileBreakpoint/useMobileBreakpoint';
import usePlayback from '../contexts/SinglePlayerPlayback/usePlayback';

const SinglePlayer = () => {
  const { isMobileView } = useMobileBreakpoint();
  const { isControlsOpen, setIsHovered } = useControls();
  const { activePlayer, vodVideoRef } = usePlayback();
  const { isInitialLoading, isLoading, type: playerType, error } = activePlayer;
  const isLive = playerType === LIVE;
  const hasError = !!error;

  const onMouseEnterHandler = useCallback(() => {
    setIsHovered(true);
  }, [setIsHovered]);

  const onMouseLeaveHandler = useCallback(() => {
    setIsHovered(false);
  }, [setIsHovered]);

  return (
    <section className="player-section">
      <div
        className="video-container"
        {...(!isMobileView
          ? {
              onMouseEnter: onMouseEnterHandler,
              onMouseLeave: onMouseLeaveHandler
            }
          : {})}
      >
        <Spinner loading={isLoading && !hasError} />
        <FadeInOut className="notification-container" inProp={hasError}>
          <Notification type="ERROR" message={hasError ? error.message : ''} />
        </FadeInOut>
        <StatusPill isLive={isLive} isOpen={!hasError && !isInitialLoading} />
        <FadeInOut
          className="player-controls-container"
          inProp={
            hasError || (isControlsOpen && (!isLoading || !isInitialLoading))
          }
          mountOnEnter
        >
          <Controls isLive={isLive} />
        </FadeInOut>
        {hasError && <div className="black-cover" />}
        <video
          {...(!isInitialLoading
            ? { style: { background: 'var(--color-black)' } }
            : {})}
          autoPlay
          className="active-player"
          muted
          playsInline
          crossOrigin="anonymous"
          ref={vodVideoRef}
        />
      </div>
    </section>
  );
};

export default SinglePlayer;
