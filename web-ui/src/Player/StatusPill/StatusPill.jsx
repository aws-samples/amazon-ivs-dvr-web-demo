import PropTypes from 'prop-types';
import React from 'react';

import './StatusPill.css';
import FadeInOut from '../FadeInOut/FadeInOut';
import LiveSVG from '../../assets/icons/live';
import RecordedSVG from '../../assets/icons/recorded';

const StatusPill = ({ isLive, isOpen }) => (
  <>
    <FadeInOut className="status-pill is-live" inProp={isOpen && isLive}>
      <LiveSVG />
      <span>LIVE</span>
    </FadeInOut>
    <FadeInOut className="status-pill is-recorded" inProp={isOpen && !isLive}>
      <RecordedSVG />
      <span>RECORDED</span>
    </FadeInOut>
  </>
);

StatusPill.propTypes = {
  isLive: PropTypes.bool,
  isOpen: PropTypes.bool
};

StatusPill.defaultProps = {
  isLive: false,
  isOpen: false
};

export default StatusPill;
