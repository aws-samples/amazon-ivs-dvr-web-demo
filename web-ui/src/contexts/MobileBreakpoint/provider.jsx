import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useState } from 'react';

import { MOBILE_BREAKPOINT } from '../../constants';
import MobileBreakpointContext from './context';

const MobileBreakpointProvider = ({ children }) => {
  const [isMobileView, setIsMobileView] = useState(undefined);

  useEffect(() => {
    const handleWindowResize = () => {
      setIsMobileView(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    handleWindowResize();
    window.addEventListener('resize', handleWindowResize);

    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  const value = useMemo(() => ({ isMobileView }), [isMobileView]);

  return (
    <MobileBreakpointContext.Provider value={value}>
      {children}
    </MobileBreakpointContext.Provider>
  );
};

MobileBreakpointProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default MobileBreakpointProvider;
