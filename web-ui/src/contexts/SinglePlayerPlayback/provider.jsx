import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import useSWR from 'swr';

import { fetchPlaybackMetadata, CFDomainError } from '../Playback/utils';
import { isiOS } from '../../utils';
import { LIVE } from '../../constants';
import PlaybackContext from './context';
import usePlayer from '../../hooks/useSinglePlayer';
import useStateWithCallback from '../../hooks/useStateWithCallback';
import useFirstMountState from '../../hooks/useFirstMountState';

const defaultPlaybackMetadata = {
  livePlaybackUrl: '',
  vodPlaybackURL: '',
  recordingStartTime: null,
  playlistDuration: null
};

const SinglePlayerPlaybackProvider = ({ children }) => {
  const [currProgress, setCurrProgress] = useStateWithCallback(100);
  const [bufferPercent, setBufferPercent] = useState(0);
  const retryTimeoutId = useRef();
  const isiOSDevice = isiOS();
  const [shouldFetch, setShouldFetch] = useState(true);
  const {
    data: {
      isChannelLive,
      playlistDuration: vodPlaylistDuration,
      recordingStartTime,
      vodPlaybackURL,
      livePlaybackUrl
    }
  } = useSWR(
    shouldFetch ? 'recording-started-latest.json' : null,
    fetchPlaybackMetadata,
    {
      refreshInterval: 1000,
      revalidateOnMount: true,
      fallbackData: defaultPlaybackMetadata,
      onErrorRetry: (error, _key, _config, revalidate) => {
        if (error instanceof CFDomainError) {
          player?.setError(error);
          console.error(`${error.message} \n ${error.description}`);
          return;
        }
        retryTimeoutId.current = setTimeout(revalidate, 3000);
      }
    }
  );
  const player = usePlayer({ livePlaybackUrl, vodPlaybackURL, isChannelLive });
  const {
    instance: playerInstance,
    setCurrentTime: setVodCurrentTime,
    videoRef: vodVideoRef,
    activePlayerType,
    setActivePlayerType,
    isPaused
  } = player;

  // When the player is paused, stop fetching updated recording-started-latest.json
  const isFirstMount = useFirstMountState();
  useEffect(() => {
    if (isFirstMount) return;
    setShouldFetch(!isPaused);
  }, [isPaused, isFirstMount]);

  /**
   * Known issue: getDuration, seekTo and getPosition are not working as expected on iOS.
   *
   * The workaround is to use the currentTime property of the HTML video element to get and set the current playback position.
   * The current VOD duration has been exposed from the backend and is fetched every second.
   */
  const getVodDuration = useCallback(() => {
    if (!playerInstance) return 0;

    if (isiOSDevice && vodPlaylistDuration) {
      return vodPlaylistDuration - Number.EPSILON || 0;
    }

    const duration = playerInstance.getDuration();

    return isFinite(duration) ? duration : vodPlaylistDuration || 0;
  }, [isiOSDevice, playerInstance, vodPlaylistDuration]);
  const seekVodToPos = useCallback(
    (seekPosition) => {
      if (isiOSDevice) {
        setVodCurrentTime(seekPosition);
      } else {
        playerInstance?.seekTo(seekPosition);
      }
    },
    [isiOSDevice, setVodCurrentTime, playerInstance]
  );
  const getVodPosition = useCallback(() => {
    if (!playerInstance) return 0;

    if (activePlayerType === LIVE) {
      return vodPlaylistDuration || 0;
    }

    if (isiOSDevice && vodVideoRef.current) {
      return vodVideoRef.current.currentTime || 0;
    }

    return playerInstance.getPosition() || 0;
  }, [
    isiOSDevice,
    playerInstance,
    vodVideoRef,
    activePlayerType,
    vodPlaylistDuration
  ]);
  const isLiveAvailable = useMemo(
    () => isChannelLive && !player.error,
    [isChannelLive, player.error]
  );
  const isVodAvailable = useMemo(
    () => player.isReady && !player.error,
    [player.error, player.isReady]
  );

  // Clear the error retry timeout
  useEffect(() => {
    return () => clearTimeout(retryTimeoutId.current);
  }, []);

  // Switch to the LIVE player if VOD has ended (will lead to "live stream offline" error state)
  useEffect(() => {
    if (player.hasEnded) setActivePlayerType(LIVE);
  }, [player.hasEnded, setActivePlayerType]);

  // Reset the VOD player if the LIVE player has encountered an error and is currently active (ensures that the VOD player starts fresh with the next live stream)
  useEffect(() => {
    if (activePlayerType === LIVE && player.error) {
      const resetVOD = player.reset;

      resetVOD();
    }
  }, [activePlayerType, player.reset, player.error]);

  const value = useMemo(
    () => ({
      activePlayer: { ...player, type: activePlayerType },
      bufferPercent,
      currProgress,
      getVodDuration,
      getVodPosition,
      isLiveAvailable,
      isVodAvailable,
      liveVideoRef: player.videoRef,
      recordingStartTime,
      resetVOD: player.reset,
      seekVodToPos,
      setActivePlayerType,
      setBufferPercent,
      setCurrProgress,
      vodPlayerInstance: playerInstance,
      vodVideoRef: player.videoRef
    }),
    [
      activePlayerType,
      bufferPercent,
      currProgress,
      getVodDuration,
      getVodPosition,
      isLiveAvailable,
      isVodAvailable,
      recordingStartTime,
      seekVodToPos,
      setActivePlayerType,
      setCurrProgress,
      player,
      playerInstance
    ]
  );

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
};

SinglePlayerPlaybackProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default SinglePlayerPlaybackProvider;
