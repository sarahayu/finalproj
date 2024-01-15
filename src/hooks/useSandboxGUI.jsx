import { useState } from 'react';

export default function useSandboxGUI() {
  const [displayGW, setDisplayGW] = useState(true);
  const [displayDiff, setDisplayDiff] = useState(true);
  const [displayUnmet, setDisplayUnmet] = useState(true);
  const [displayDemand, setDisplayDemand] = useState(false);
  const [displayLandUse, setDisplayLandUse] = useState(false);
  
  return {
    displayGW,
    setDisplayGW,
    displayDiff,
    setDisplayDiff,
    displayUnmet,
    setDisplayUnmet,
    displayDemand,
    setDisplayDemand,
    displayLandUse,
    setDisplayLandUse,
  };
}
