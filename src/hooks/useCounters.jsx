import { useCallback, useEffect, useState } from 'react';
import { inRange } from '../utils/settings';

export default function useCounters({ slide }) {
  const [counter, setCounter] = useState(1026);
  const [speedyCounter, setSpeedyCounter] = useState(1026);
  const [playing, setPlaying] = useState(false);
  const [cycler, setCycler] = useState(0);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    if (playing) {
      let timer = setTimeout(
        () => setSpeedyCounter((c) => (c % 1199) + 1),
        1000 / 30
      );
      return function () {
        clearTimeout(timer);
      };
    }
  }, [speedyCounter, playing]);

  useEffect(() => {
    if (inRange(slide, 1, 2)) {
      setCounting(true);
      let timer = setTimeout(() => setCounter((c) => (c % 1199) + 1), 250);
      return function () {
        clearTimeout(timer);
        setCounting(false);
      };
    }
  }, [counter, slide]);

  useEffect(() => {
    if (inRange(slide, 20, 21)) {
      let timer = setTimeout(() => setCycler((c) => (c + 1) % 1000), 2000);
      return function () {
        clearTimeout(timer);
      };
    }
  }, [cycler, slide]);

  return {
    counter,
    setCounter,
    speedyCounter,
    setSpeedyCounter,
    playing,
    setPlaying,
    cycler,
    setCycler,
    counting,
    setCounting,
  };
}
