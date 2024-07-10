import { Transition } from 'react-transition-group';
import PropTypes from 'prop-types';
import React, { useRef } from 'react';

const transitionStyles = {
  entering: { opacity: 1 },
  entered: { opacity: 1 },
  exiting: { opacity: 0 },
  exited: { opacity: 0 }
};

const FadeInOut = ({
  children,
  className = '',
  inProp = false,
  timeout = 300,
  ...rest
}) => {
  const nodeRef = useRef(null);
  const defaultStyle = {
    transition: `opacity ${timeout}ms ease-in-out`,
    opacity: 0
  };

  return (
    <Transition in={inProp} nodeRef={nodeRef} timeout={timeout} {...rest}>
      {(state) => (
        <div
          className={`${className} fade fade-${state}`}
          ref={nodeRef}
          style={{
            ...defaultStyle,
            ...transitionStyles[state]
          }}
        >
          {children}
        </div>
      )}
    </Transition>
  );
};

FadeInOut.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  inProp: PropTypes.bool,
  timeout: PropTypes.number
};

export default FadeInOut;
