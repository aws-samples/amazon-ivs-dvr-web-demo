import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import ControlsContext from './context';
import useMobileBreakpoint from '../MobileBreakpoint/useMobileBreakpoint';

const ControlsProvider = ({ children }) => {
  const { isMobileView } = useMobileBreakpoint();
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutId = useRef(null);
  const clearControlsTimeout = useCallback(() => {
    clearTimeout(timeoutId.current);
    timeoutId.current = null;
  }, []);
  const resetControlsTimeout = useCallback(() => {
    clearControlsTimeout();
    timeoutId.current = setTimeout(() => {
      setIsControlsOpen(false);
      timeoutId.current = null;
    }, 3000);
  }, [clearControlsTimeout]);
  const stopPropagAndResetTimeout = useCallback(
    (event) => {
      if (!isMobileView) return;

      if (event) {
        event.stopPropagation();
      }
      resetControlsTimeout();
    },
    [isMobileView, resetControlsTimeout]
  );

  // Desktop controls toggling logic
  useEffect(() => {
    if (isMobileView === false && isHovered) {
      clearControlsTimeout();
      setIsControlsOpen(true);
    } else if (isMobileView === false && !isHovered) {
      resetControlsTimeout();
    }
  }, [clearControlsTimeout, isHovered, isMobileView, resetControlsTimeout]);

  // Mobile controls toggling logic
  useEffect(() => {
    const mobileClickHandler = () => {
      if (!timeoutId.current) {
        setIsControlsOpen(true);
        resetControlsTimeout();
      } else {
        setIsControlsOpen(false);
        clearControlsTimeout();
      }
    };

    if (isMobileView) {
      mobileClickHandler();
      document.addEventListener('pointerdown', mobileClickHandler);
    }

    return () => {
      document.removeEventListener('pointerdown', mobileClickHandler);
    };
  }, [clearControlsTimeout, isMobileView, resetControlsTimeout]);

  const value = useMemo(
    () => ({
      clearControlsTimeout,
      isControlsOpen,
      resetControlsTimeout,
      setIsControlsOpen,
      setIsHovered,
      stopPropagAndResetTimeout
    }),
    [
      clearControlsTimeout,
      isControlsOpen,
      stopPropagAndResetTimeout,
      resetControlsTimeout
    ]
  );

  return (
    <ControlsContext.Provider value={value}>
      {children}
    </ControlsContext.Provider>
  );
};

ControlsProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default ControlsProvider;
