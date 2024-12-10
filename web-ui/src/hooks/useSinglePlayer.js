import { useCallback, useEffect, useRef, useState } from 'react';

import { LIVE, VOD } from '../constants';

const { IVSPlayer } = window;
const {
  create: createMediaPlayer,
  isPlayerSupported,
  PlayerEventType,
  PlayerState
} = IVSPlayer;
const { ENDED, PLAYING, READY, BUFFERING } = PlayerState;
const { DURATION_CHANGED, ERROR } = PlayerEventType;

class PlaybackError extends Error {
  constructor(message, type) {
    super(message);
    this.type = type;
    this.name = 'PlaybackError';
  }
}

const useSinglePlayer = ({
  livePlaybackUrl,
  vodPlaybackURL,
  isChannelLive
}) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [error, setError] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [activePlayerType, setActivePlayerType] = useState(LIVE);
  const hasError = !!error;
  const urlToLoad =
    activePlayerType === LIVE ? livePlaybackUrl : vodPlaybackURL;

  const setCurrentTime = useCallback((seekPosition) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seekPosition;
    }
  }, []);

  // PlayerState event callback
  const onStateChange = useCallback(() => {
    if (!playerRef.current) return;

    const newState = playerRef.current.getState();

    if (newState === ENDED && activePlayerType === LIVE) {
      setError(new PlaybackError(`Live stream has ended`, LIVE));
    } else setError(null);

    setHasEnded(newState === ENDED);
    setIsLoading(newState === READY || newState === BUFFERING);
    setIsPaused(playerRef.current?.isPaused() || false);

    console.log(`${activePlayerType.toUpperCase()} Player State - ${newState}`);
  }, [activePlayerType]);

  // PlayerEventType.ERROR event callback
  const onError = useCallback(
    (err) => {
      console.warn(
        `${activePlayerType.toUpperCase()} Player Event - ERROR:`,
        err,
        playerRef.current
      );

      setError(err);
      setIsLoading(false);
      setIsPaused(true);
      setIsReady(false);
    },
    [activePlayerType]
  );

  const onDurationChanged = useCallback((duration) => {
    setIsReady(duration > 0);
    setIsInitialLoading(false);
    setActivePlayerType(!isFinite(duration) ? LIVE : VOD);
  }, []);

  const destroy = useCallback(() => {
    if (!playerRef.current) return;

    // remove event listeners
    playerRef.current.removeEventListener(DURATION_CHANGED, onDurationChanged);
    playerRef.current.removeEventListener(READY, onStateChange);
    playerRef.current.removeEventListener(PLAYING, onStateChange);
    playerRef.current.removeEventListener(BUFFERING, onStateChange);
    playerRef.current.removeEventListener(ENDED, onStateChange);
    playerRef.current.removeEventListener(ERROR, onError);

    // delete and nullify player
    playerRef.current.pause();
    playerRef.current.delete();
    playerRef.current = null;
    videoRef.current?.removeAttribute('src'); // remove possible stale src
  }, [onDurationChanged, onError, onStateChange]);

  const create = useCallback(() => {
    if (!isPlayerSupported) {
      console.warn(
        'The current browser does not support the Amazon IVS player.'
      );
      return;
    }

    // If a player instance already exists, destroy it before creating a new one
    if (playerRef.current) destroy();

    playerRef.current = createMediaPlayer({
      serviceWorker: {
        url: '../workers/amazon-ivs-service-worker-loader.js'
      }
    });

    playerRef.current.attachHTMLVideoElement(videoRef.current);

    playerRef.current.addEventListener(DURATION_CHANGED, onDurationChanged);
    playerRef.current.addEventListener(READY, onStateChange);
    playerRef.current.addEventListener(PLAYING, onStateChange);
    playerRef.current.addEventListener(BUFFERING, onStateChange);
    playerRef.current.addEventListener(ENDED, onStateChange);
    playerRef.current.addEventListener(ERROR, onError);
  }, [destroy, onDurationChanged, onError, onStateChange]);

  const play = useCallback(() => {
    if (!playerRef.current) return;

    if (hasError) {
      setIsLoading(true);
      playerRef.current.load(urlToLoad);
    }

    if (playerRef.current.isPaused()) {
      playerRef.current.play();
      setIsPaused(false);
    }
  }, [hasError, urlToLoad]);

  const pause = useCallback(() => {
    if (!playerRef.current) return;

    if (!playerRef.current.isPaused()) {
      playerRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const load = useCallback(
    (playbackUrl) => {
      if (!playbackUrl) return;

      if (!playerRef.current) create();

      playerRef.current.load(playbackUrl);
      play();
    },
    [create, play]
  );

  const reset = useCallback(() => {
    setIsPaused(true);
    setIsReady(false);
    setIsLoading(false);
    setIsInitialLoading(false);
    destroy();
  }, [destroy]);

  useEffect(() => {
    if (hasError) reset();
  }, [hasError, reset]);

  useEffect(() => {
    if (urlToLoad && isChannelLive) load(urlToLoad);
  }, [isChannelLive, load, urlToLoad]);

  useEffect(() => {
    if (
      isChannelLive !== undefined &&
      activePlayerType === LIVE &&
      (!isChannelLive || !urlToLoad)
    ) {
      setError(new PlaybackError('Live stream is offline', LIVE));
    }
  }, [isChannelLive, isInitialLoading, activePlayerType, urlToLoad]);

  return {
    error,
    instance: playerRef.current,
    hasEnded,
    isInitialLoading,
    isLoading,
    isPaused,
    isReady,
    pause,
    play,
    reset,
    setCurrentTime,
    setError,
    videoRef,
    activePlayerType,
    setActivePlayerType
  };
};

export default useSinglePlayer;
