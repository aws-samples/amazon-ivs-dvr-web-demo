import PropTypes from 'prop-types';
import React from 'react';

import SpinnerSVG from '../../assets/icons/spinner';

import './Spinner.css';

const Spinner = ({ loading = false }) =>
  loading && (
    <div className="spinner">
      <SpinnerSVG />
    </div>
  );

Spinner.propTypes = {
  loading: PropTypes.bool
};

export default Spinner;
