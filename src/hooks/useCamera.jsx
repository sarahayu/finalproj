import { useCallback, useEffect, useState } from 'react';
import { dateInterpIdx } from '../utils/scales';
import {
  COWS_OUT_VIEW_STATE,
  COWS_VIEW_STATE,
  INITIAL_VIEW_STATE,
  inRange,
  JUXTAPOSE_VIEW_STATE,
  PROJ_OUT_VIEW_STATE,
  PROJ_VIEW_STATE,
  SETT_VIEW_STATE,
} from '../utils/settings';

export default function useCamera({
  slide,
  setCurScenario,
}) {
  const [curViewState, setCurViewState] = useState(INITIAL_VIEW_STATE);
  const [transitioning, setTransitioning] = useState(false);

  const zoomInCows = useCallback(() => {
    setCurViewState({
      ...COWS_VIEW_STATE,
      onTransitionEnd: () => setTransitioning(false),
    });
  }, []);

  const zoomInSett = useCallback(() => {
    setCurViewState({
      ...SETT_VIEW_STATE,
      onTransitionEnd: () => setTransitioning(false),
    });
  }, []);

  const zoomInProj = useCallback(() => {
    setCurViewState({
      ...PROJ_VIEW_STATE,
      onTransitionEnd: () => setTransitioning(false),
    });
  }, []);

  const zoomInJux = useCallback(() => {
    setCurViewState({
      ...JUXTAPOSE_VIEW_STATE,
      onTransitionEnd: () => setTransitioning(false),
    });
  }, []);

  const zoomOut = useCallback(() => {
    setCurViewState({
      ...COWS_OUT_VIEW_STATE,
      onTransitionEnd: () => setTransitioning(false),
    });
  }, []);

  const zoomOutThenSett = useCallback(() => {
    setTransitioning(true);
    setCurViewState({
      ...PROJ_OUT_VIEW_STATE,
      onTransitionEnd: zoomInSett,
    });
  }, []);

  const zoomOutThenProj = useCallback(() => {
    setTransitioning(true);
    setCurViewState({
      ...COWS_OUT_VIEW_STATE,
      onTransitionEnd: zoomInProj,
    });
  }, []);

  useEffect(() => {
    if (slide == 8) {
      setTransitioning(true);
      zoomInCows();
    } else if (slide == 10) {
      zoomOutThenProj();
    } else if (slide == 11) {
      zoomOutThenSett();
    } else if (slide == 12) {
      setTransitioning(true);
      zoomOut();
    } else if (slide == 17) {
      setTransitioning(true);
      zoomInJux();
    }

    // TODO camera shouldn't be responsible for changing scenarios
    if (inRange(slide, 15, 17)) {
      setCurScenario(0);
    } else if (slide == 18) {
      setCurScenario(1);
    } else if (slide == 19) {
      setCurScenario(2);
    }
  }, [slide]);

  return { curViewState, transitioning };
}
