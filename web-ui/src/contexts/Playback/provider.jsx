import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import useSWR from 'swr';

import { fetchPlaybackMetadata, CFDomainError } from './utils';
import { isiOS } from '../../utils';
import { LIVE, VOD } from '../../constants';
import PlaybackContext from './context';
import usePlayer from '../../hooks/usePlayer';
import useStateWithCallback from '../../hooks/useStateWithCallback';
import useFirstMountState from '../../hooks/useFirstMountState';

const defaultPlaybackMetadata = {
  livePlaybackUrl: '',
  vodPlaybackURL: '',
  recordingStartTime: null,
  playlistDuration: null
};

const PlaybackProvider = ({ children }) => {
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
      refreshInterval: 5000,
      revalidateOnMount: true,
      fallbackData: defaultPlaybackMetadata,
      onErrorRetry: (error, _key, _config, revalidate) => {
        if (error instanceof CFDomainError) {
          livePlayer?.setError(error);
          console.error(`${error.message} \n ${error.description}`);
          return;
        }
        retryTimeoutId.current = setTimeout(revalidate, 3000);
      }
    }
  );
  const [activePlayerType, setActivePlayerType] = useState(LIVE);
  const livePlayer = usePlayer(livePlaybackUrl, LIVE, isChannelLive);
  const vodPlayer = usePlayer(vodPlaybackURL, VOD, isChannelLive);
  const {
    instance: vodPlayerInstance,
    setCurrentTime: setVodCurrentTime,
    videoRef: vodVideoRef,
    isPaused
  } = vodPlayer;

  // When the VOD player is paused, stop fetching updated recording-started-latest.json
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
    if (!vodPlayerInstance) return 0;

    let duration = vodPlayerInstance.getDuration();

    if (isiOSDevice && vodPlaylistDuration) {
      duration = vodPlaylistDuration;
    }

    return duration;
  }, [isiOSDevice, vodPlayerInstance, vodPlaylistDuration]);
  const seekVodToPos = useCallback(
    (seekPosition) => {
      if (isiOSDevice) {
        setVodCurrentTime(seekPosition);
      } else {
        vodPlayerInstance?.seekTo(seekPosition);
      }
    },
    [isiOSDevice, setVodCurrentTime, vodPlayerInstance]
  );
  const getVodPosition = useCallback(
    (seekPosition) => {
      if (!vodPlayerInstance) return 0;

      if (isiOSDevice) {
        return vodVideoRef.current.currentTime;
      }

      return vodPlayerInstance.getPosition();
    },
    [isiOSDevice, vodPlayerInstance, vodVideoRef]
  );
  const isLiveAvailable = useMemo(
    () => isChannelLive && !livePlayer.error,
    [isChannelLive, livePlayer.error]
  );
  const isVodAvailable = useMemo(
    () => vodPlayer.isReady && !vodPlayer.error,
    [vodPlayer.error, vodPlayer.isReady]
  );

  // Ensures we restart the playback when switching player
  const setActivePlayerTypeWithState = useCallback(
    (nextType) => {
      setActivePlayerType((prevType) => {
        const nextPlayFn = nextType === LIVE ? livePlayer.play : vodPlayer.play;

        if (nextType !== prevType) {
          nextPlayFn();
        }

        return nextType;
      });
    },
    [livePlayer.play, vodPlayer.play]
  );

  // Clear the error retry timeout
  useEffect(() => {
    return () => clearTimeout(retryTimeoutId.current);
  }, []);

  // Switch to the LIVE player if VOD has ended (will lead to "live stream offline" error state)
  useEffect(() => {
    if (vodPlayer.hasEnded) setActivePlayerType(LIVE);
  }, [vodPlayer.hasEnded]);

  // Reset the VOD player if the LIVE player has encountered an error and is currently active (ensures that the VOD player starts fresh with the next live stream)
  useEffect(() => {
    if (activePlayerType === LIVE && livePlayer.error) {
      const resetVOD = vodPlayer.reset;

      resetVOD();
    }
  }, [activePlayerType, vodPlayer.reset, livePlayer.error]);

  // Seek the VOD player to the end while the LIVE player is active so it can continue fetching new playlists
  useEffect(() => {
    if (isVodAvailable && activePlayerType === LIVE) {
      const vodDuration = getVodDuration();

      seekVodToPos(vodDuration); // Seek VOD to the end to fetch new playlists while LIVE is active
    }
  }, [activePlayerType, getVodDuration, isVodAvailable, seekVodToPos]);

  // Lower the rendition of the inactive player to the lowest available resolution
  useEffect(() => {
    const activePlayerInstance =
      activePlayerType === LIVE ? livePlayer.instance : vodPlayerInstance;
    const inactivePlayerInstance =
      activePlayerType === LIVE ? vodPlayerInstance : livePlayer.instance;

    if (activePlayerInstance && inactivePlayerInstance) {
      const qualities = inactivePlayerInstance?.getQualities() || [];
      const lowestQuality = qualities.pop();

      if (lowestQuality) {
        inactivePlayerInstance.setQuality(lowestQuality, true);
      }

      activePlayerInstance.setAutoQualityMode(true);
    }
  }, [activePlayerType, livePlayer.instance, vodPlayerInstance]);

  const value = useMemo(
    () => ({
      activePlayer:
        activePlayerType === LIVE
          ? { ...livePlayer, type: activePlayerType }
          : { ...vodPlayer, type: activePlayerType },
      bufferPercent,
      currProgress,
      getVodDuration,
      getVodPosition,
      isLiveAvailable,
      isVodAvailable,
      liveVideoRef: livePlayer.videoRef,
      recordingStartTime,
      resetVOD: vodPlayer.reset,
      seekVodToPos,
      setActivePlayerType: setActivePlayerTypeWithState,
      setBufferPercent,
      setCurrProgress,
      vodPlayerInstance,
      vodVideoRef: vodPlayer.videoRef
    }),
    [
      activePlayerType,
      bufferPercent,
      currProgress,
      getVodDuration,
      getVodPosition,
      isLiveAvailable,
      isVodAvailable,
      livePlayer,
      recordingStartTime,
      seekVodToPos,
      setActivePlayerTypeWithState,
      setCurrProgress,
      vodPlayer,
      vodPlayerInstance
    ]
  );

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
};

PlaybackProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default PlaybackProvider;
