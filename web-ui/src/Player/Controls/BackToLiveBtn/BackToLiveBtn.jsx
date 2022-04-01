import PropTypes from 'prop-types';
import React from 'react';

import './BackToLiveBtn.css';
import LiveSVG from '../../../assets/icons/live';

const BackToLiveBtn = ({ onPointerDownHandler }) => {
  return (
    <button className="back-to-live-btn" onPointerDown={onPointerDownHandler}>
      <div className="inner-content">
        <LiveSVG />
        <span>Back to live</span>
      </div>
    </button>
  );
};

BackToLiveBtn.propTypes = {
  onPointerDownHandler: PropTypes.func.isRequired
};

export default BackToLiveBtn;
