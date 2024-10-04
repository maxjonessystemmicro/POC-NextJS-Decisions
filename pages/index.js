import { useRouter } from 'next/router';
import React, { useState } from 'react';

import FloorPlan from "./FloorPlan";


export default function Home() {
  const router = useRouter();

  const handleNavigation = () => {
    router.push('/FloorPlan'); // Navigate to the next page
  };

  return (
    <div>
      <FloorPlan/>
    </div>
  );
}
