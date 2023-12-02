import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import California from './California';
import Demand from './Demand';

export default function App() {

  const [slide, setSlide] = useState(0)

  return (
    <>
      { slide == 0 && <California/> }
      { slide == 1 && <Demand/> }
      <button onClick={() => {
        setSlide(s => s + 1)
      }} style={{
        position: 'absolute', display: 'block', bottom: "20px", right: "20px"
      }}>Next Slide</button>
    </>
  );
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
