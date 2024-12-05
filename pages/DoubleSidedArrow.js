import React from 'react';

const DoubleSidedArrow = ({ start, end, label, style }) => {
  // Calculate the length and orientation of the arrow
  const length = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
  );

  const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);

  const arrowStyle = {
    position: 'absolute',
    left: `${start.x}px`,
    top: `${start.y}px`,
    width: `${length}px`,
    height: '2px', // Arrow thickness
    backgroundColor: style?.color || 'black',
    transform: `rotate(${angle}deg)`,
    transformOrigin: '0 50%',
  };

  const labelStyle = {
    position: 'absolute',
    left: `${(start.x + end.x) / 2}px`,
    top: `${(start.y + end.y) / 2 - 20}px`,
    color: style?.labelColor || 'black',
    fontSize: style?.fontSize || '12px',
    whiteSpace: 'nowrap',
    transform: 'translate(-50%, -50%)',
  };

  return (
    <>
      {/* Arrow 
      <div style={arrowStyle}></div>

      {label && <div style={labelStyle}>{label}</div>}*/}
    </>
  );
};

export default DoubleSidedArrow;
