import PropTypes from 'prop-types';
import React from 'react';

import Warning from '../../assets/icons/warning';
import './Notification.css';

const notifTypes = ['ERROR'];

const Notification = ({ message, type }) => (
  <div className="notification-content">
    <div>
      <Warning />
      <p className="notification-type">{type.toLowerCase()}</p>
    </div>
    <p className="notification-message">{message}</p>
  </div>
);

Notification.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(notifTypes).isRequired
};

export default Notification;
