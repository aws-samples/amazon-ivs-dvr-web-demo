import React from 'react';

const Live = () => (
  <svg
    width="20"
    height="15"
    viewBox="0 0 20 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <mask
      id="mask0_190_21"
      style={{ maskType: 'alpha' }}
      maskUnits="userSpaceOnUse"
      x="0"
      y="0"
      width="20"
      height="15"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.5 6L0 0V14.5L7.5 8.5V6ZM12.0003 8.5L19.5003 14.5L19.5003 0L12.0003 6V8.5Z"
        fill="#C4C4C4"
      />
    </mask>
    <g mask="url(#mask0_190_21)">
      <circle cx="10" cy="7.5" r="5.25" stroke="white" strokeWidth="1.5" />
      <circle cx="10" cy="7.5" r="8.25" stroke="white" strokeWidth="1.5" />
    </g>
    <circle cx="10" cy="7.5" r="3" fill="white" />
  </svg>
);

export default Live;
