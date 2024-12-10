import PropTypes from 'prop-types';
import React from 'react';

import './StatusPill.css';
import FadeInOut from '../../Player/FadeInOut/FadeInOut';
import LiveSVG from '../../assets/icons/live';

const StatusPill = ({ isLive = false, isOpen = false }) => (
  <>
    <FadeInOut
      className="status-pill single-player-is-live"
      inProp={isOpen && isLive}
    >
      <LiveSVG />
      <span>LIVE</span>
    </FadeInOut>
    <FadeInOut
      className="status-pill single-player-is-recorded"
      inProp={isOpen && !isLive}
    >
      <LiveSVG />
      <span>LIVE</span>
    </FadeInOut>
  </>
);

StatusPill.propTypes = {
  isLive: PropTypes.bool,
  isOpen: PropTypes.bool
};

export default StatusPill;
