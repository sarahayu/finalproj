import React from 'react';
import Card from './Card';
import Clock from './Clock';
import { inRange, SCENARIO_LABELS } from './utils/settings';

export default function MainGUI({
  slide,
  setSlide,
  counter,
  cycler,
  curScenario,
  transitioning,
  speedyCounter,
}) {
  return (
    <>
      <Card slide={slide} transitioning={transitioning} />
      {(inRange(slide, 1, 6) || inRange(slide, 14, 1000)) && (
        <Clock
          counter={
            slide >= 14
              ? inRange(slide, 14, 19)
                ? 1026
                : slide == 20
                ? 1197
                : slide == 21
                ? ((Math.floor(cycler / 3) * 67) % 1199) + 1
                : speedyCounter
              : inRange(slide, 3, 6)
              ? slide <= 4
                ? 1026
                : 1197
              : counter
          }
          displayMonth={inRange(slide, 3, 6)}
          dataset={slide == 2 ? 'averageGroundwater' : 'averageDemandBaseline'}
        />
      )}
      {slide < 22 && (
        <button
          onClick={() => {
            setSlide((s) => s + 1);
          }}
          className="buttons right"
        >
          {'\u27E9'}
        </button>
      )}
      {slide > 0 && (
        <button
          onClick={() => {
            setSlide((s) => s - 1);
          }}
          className="buttons left"
        >
          {'\u27E8'}
        </button>
      )}
      {inRange(slide, 15, 21) && (
        <h1>
          {SCENARIO_LABELS[inRange(slide, 20, 21) ? cycler % 3 : curScenario]}
        </h1>
      )}
    </>
  );
}
