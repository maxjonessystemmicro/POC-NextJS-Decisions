import { useRouter } from 'next/router';
import React, { useState } from 'react';
import Dashboard from "./Dashboard";
import FloorPlan from "./FloorPlan";
import RoomBuilder from "./RoomBuilder";

export default function Home() {
  const router = useRouter();

  const handleNavigation = () => {
    router.push('/FloorPlan'); // Navigate to the next page
  };

  return (
    <div>
      <h1>Welcome to the Home Page!</h1>
      <button onClick={handleNavigation}>Go to Next Page</button>
    </div>
  );
}
