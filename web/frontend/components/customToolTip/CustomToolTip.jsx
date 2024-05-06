import React, { useState } from 'react';
import './CustomTooltip.css'; // Include your CSS file for styling

const CustomTooltip = ({ text, children ,disabled}) => {
  const [isVisible, setIsVisible] = useState(false);

  const showTooltip = () => {
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  return (
    <div className="custom-tooltip" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
      {children}
      {isVisible &&text && !disabled &&<div className="tooltip-text">{text}</div>}
    </div>
  );
};

export default CustomTooltip;
