import PropTypes from 'prop-types';
import React from 'react';

import SpinnerSVG from '../../assets/icons/spinner';

import './Spinner.css';

const Spinner = ({ loading }) =>
  loading && (
    <div className="spinner">
      <SpinnerSVG />
    </div>
  );

Spinner.propTypes = {
  loading: PropTypes.bool
};

Spinner.defaultProps = {
  loading: false
};

export default Spinner;
