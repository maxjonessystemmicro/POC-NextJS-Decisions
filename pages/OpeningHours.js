import React, { useState } from 'react';
import { format, addMinutes, startOfDay, parse, isAfter } from 'date-fns';

const TimeDropdowns = ({ onTimeChange }) => {
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [isClosingEnabled, setIsClosingEnabled] = useState(false);

  // Helper function to generate time slots
  const generateTimes = () => {
    const times = [];
    let currentTime = startOfDay(new Date()); // Start at 12:00 AM
    for (let i = 0; i < 48; i++) { // 48 slots for 30-minute intervals
      times.push(format(currentTime, 'hh:mm a')); // Format as "12:00 AM"
      currentTime = addMinutes(currentTime, 30);
    }
    return times;
  };

  const allTimes = generateTimes();

  // Handle opening time change
  const handleOpeningChange = (event) => {
    const selectedTime = event.target.value;
    setOpeningTime(selectedTime);
    setIsClosingEnabled(true);
    setClosingTime(''); // Reset closing time
    onTimeChange({ openingTime: selectedTime, closingTime: '' }); // Notify parent
  };

  // Handle closing time change
  const handleClosingChange = (event) => {
    const selectedTime = event.target.value;
    setClosingTime(selectedTime);
    onTimeChange({ openingTime, closingTime: selectedTime }); // Notify parent
  };

  // Filter times for the closing dropdown
  const closingOptions = allTimes.filter((time) => {
    if (!openingTime) return false;
    const selectedOpeningTime = parse(openingTime, 'hh:mm a', new Date());
    const potentialClosingTime = parse(time, 'hh:mm a', new Date());
    return isAfter(potentialClosingTime, selectedOpeningTime);
  });

  return (
    <div>
      <div>
        <label htmlFor="openingTime">Opening Time:</label>
        <select id="openingTime" value={openingTime} onChange={handleOpeningChange}>
          <option value="">Select Opening Time</option>
          {allTimes.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="closingTime">Closing Time:</label>
        <select
          id="closingTime"
          value={closingTime}
          onChange={handleClosingChange}
          disabled={!isClosingEnabled}
        >
          <option value="">Select Closing Time</option>
          {closingOptions.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TimeDropdowns;
