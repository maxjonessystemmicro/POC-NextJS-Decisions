// components/FloorPlan.js
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const Stage = dynamic(() => import('react-konva').then(mod => mod.Stage), { ssr: false });
const Layer = dynamic(() => import('react-konva').then(mod => mod.Layer), { ssr: false });
const Rect = dynamic(() => import('react-konva').then(mod => mod.Rect), { ssr: false });

const FloorPlan = () => {
  const [rooms, setRooms] = useState([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setRooms([
      { id: 1, name: 'Conference Room', x: 50, y: 50, width: 200, height: 150, isBooked: false },
      { id: 2, name: 'Office 1', x: 300, y: 50, width: 150, height: 100, isBooked: true },
      { id: 3, name: 'Break Room', x: 50, y: 250, width: 150, height: 100, isBooked: false },
    ]);
  }, []);

  const handleDragEnd = (e, id) => {
    const updatedRooms = rooms.map((room) =>
      room.id === id
        ? { ...room, x: e.target.x(), y: e.target.y() }
        : room
    );
    setRooms(updatedRooms);
  };

  if (!isClient) return null;

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        {rooms.map((room) => (
          <Rect
            key={room.id}
            x={room.x}
            y={room.y}
            width={room.width}
            height={room.height}
            fill={room.isBooked ? 'red' : 'lightblue'}
            draggable
            onDragEnd={(e) => handleDragEnd(e, room.id)}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default FloorPlan;
