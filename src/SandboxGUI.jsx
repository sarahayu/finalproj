import React from 'react';

export default function SandboxGUI({
  curScenario,
  setCurScenario,
  speedyCounter,
  setSpeedyCounter,
  playing,
  setPlaying,
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
}) {
  return (
    <>
      <button
        onClick={() => {
          setPlaying((p) => !p);
        }}
        style={{
          position: 'absolute',
          display: 'block',
          bottom: '20px',
          right: '50%',
          transform: 'translateX(50%)',
        }}
      >
        {playing ? 'Pause' : 'Play'}
      </button>
      <input
        onChange={function (e) {
          setPlaying(false);
          setSpeedyCounter(parseInt(e.target.value));
        }}
        onInput={function (e) {
          setSpeedyCounter(parseInt(e.target.value));
        }}
        value={speedyCounter}
        style={{
          width: '50vw',
          position: 'absolute',
          display: 'block',
          bottom: '40px',
          right: '50%',
          transform: 'translateX(50%)',
        }}
        type="range"
        min="0"
        max="1199"
        id="myRange"
      />
      <div
        style={{
          position: 'absolute',
          display: 'block',
          bottom: '20%',
          right: '0',
          transform: 'translateY(50%)',
        }}
      >
        <div>
          <input
            type="checkbox"
            value="display1"
            checked={displayGW}
            onChange={() => setDisplayGW((d) => !d)}
          />
          <label htmlFor="display1">Display Groundwater</label>
        </div>
        <div>
          <input
            type="checkbox"
            value="display2"
            checked={displayDiff}
            onChange={() => setDisplayDiff((d) => !d)}
          />
          <label htmlFor="display2">Display Difference to Baseline</label>
        </div>
        <div>
          <input
            type="checkbox"
            value="display3"
            checked={displayUnmet}
            onChange={() => setDisplayUnmet((d) => !d)}
          />
          <label htmlFor="display3">Display Unmet Demand</label>
        </div>
        <div>
          <input
            type="checkbox"
            value="display4"
            checked={displayDemand}
            onChange={() => setDisplayDemand((d) => !d)}
          />
          <label htmlFor="display4">Display Demand</label>
        </div>
        <div>
          <input
            type="checkbox"
            value="display5"
            checked={displayLandUse}
            onChange={() => setDisplayLandUse((d) => !d)}
          />
          <label htmlFor="display5">Display Land Use</label>
        </div>
      </div>
      <div
        onChange={function (e) {
          setCurScenario(e.target.value);
        }}
        style={{
          position: 'absolute',
          display: 'block',
          bottom: '50%',
          right: '0',
          transform: 'translateY(50%)',
        }}
      >
        <div>
          <input
            type="radio"
            name="scenario"
            value="0"
            checked={curScenario == 0}
          />
          <label htmlFor="scenario1">Scenario 1</label>
        </div>

        <div>
          <input
            type="radio"
            name="scenario"
            value="1"
            checked={curScenario == 1}
          />
          <label htmlFor="scenario2">Scenario 2</label>
        </div>

        <div>
          <input
            type="radio"
            name="scenario"
            value="2"
            checked={curScenario == 2}
          />
          <label htmlFor="scenario3">Scenario 3</label>
        </div>
      </div>
    </>
  );
}
