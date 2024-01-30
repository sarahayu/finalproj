import { useCallback } from 'react';
import { dateInterpIdx } from '../utils/scales';
import {
  HOLDERS,
  inRange,
  SCENARIOS,
  SCENARIO_LABELS,
} from '../utils/settings';

export default function useHexTooltip({
  slide,
  counter,
  cycler,
  curScenario,
  counting,
  speedyCounter,
}) {
  const getTooltip = useCallback(
    ({ object }) => {
      if (counting || inRange(slide, 0, 6) || slide == 14) {
        let date =
          slide == 14
            ? dateInterpIdx(1026)
            : inRange(slide, 0, 2)
            ? dateInterpIdx(counter)
            : inRange(slide, 3, 4)
            ? dateInterpIdx(1026)
            : dateInterpIdx(1197);
        let cc =
          slide == 14
            ? 1026
            : inRange(slide, 0, 2)
            ? counter
            : inRange(slide, 3, 4)
            ? 1026
            : 1197;
        return (
          object && {
            html: `\
        <div><i>${date.toLocaleString('default', {
          month: 'long',
        })} ${date.toLocaleString('default', { year: 'numeric' })}</i></div>
        <div><b>Demand</b></div>
        <div>${object.properties.DemandBaseline[cc]}</div>
        <div><b>Supply</b></div>
        <div>${
          object.properties.DemandBaseline[cc] +
          object.properties.UnmetDemandBaseline[cc]
        }</div>
        <div><b>Unmet Demand</b></div>
        <div>${-object.properties.UnmetDemandBaseline[cc]}</div>
        <div><b>Groundwater</b></div>
        <div>${object.properties.Groundwater[cc]}</div>
        <div><b>Land Holder</b></div>
        <div>${HOLDERS[object.properties.LandUse[0]]}</div>
    `,
          }
        );
      }
      if (inRange(slide, 15, 1000)) {
        let date = inRange(slide, 14, 19)
          ? dateInterpIdx(1026)
          : inRange(slide, 20, 20)
          ? dateInterpIdx(1197)
          : inRange(slide, 21, 21)
          ? dateInterpIdx(((Math.floor(cycler / 3) * 67) % 1199) + 1)
          : dateInterpIdx(speedyCounter);
        let cc = inRange(slide, 14, 19)
          ? 1026
          : inRange(slide, 20, 20)
          ? 1197
          : inRange(slide, 21, 21)
          ? ((Math.floor(cycler / 3) * 67) % 1199) + 1
          : speedyCounter;
        let cs = slide == 20 ? cycler % 3 : curScenario;
        return (
          object && {
            html: `\
        <div><i>${date.toLocaleString('default', {
          month: 'long',
        })} ${date.toLocaleString('default', { year: 'numeric' })}</i></div>
        <div><i>${SCENARIO_LABELS[cs]}</i></div>
        <div><b>Demand</b></div>
        <div>${object.properties.Demand[SCENARIOS[cs]][cc]}</div>
        <div><b>Supply</b></div>
        <div>${
          object.properties.Demand[SCENARIOS[cs]][cc] +
          object.properties.UnmetDemand[SCENARIOS[cs]][cc]
        }</div>
        <div><b>Unmet Demand</b></div>
        <div>${-object.properties.UnmetDemand[SCENARIOS[cs]][cc]}</div>
        <div><b>Groundwater</b></div>
        <div>${object.properties.Groundwater[cc]}</div>
        <div><b>Land Holder</b></div>
        <div>${HOLDERS[object.properties.LandUse[0]]}</div>
    `,
          }
        );
      }

      return (
        object && {
          html: `\
        <div><b>Demand (Averaged Over 100 Years)</b></div>
        <div>${object.properties.DemandBaselineAverage}</div>
        <div><b>Supply (Averaged)</b></div>
        <div>${
          object.properties.DemandBaselineAverage +
          object.properties.UnmetDemandBaselineAverage
        }</div>
        <div><b>Unmet (Averaged)</b></div>
        <div>${-object.properties.UnmetDemandBaselineAverage}</div>
        <div><b>Groundwater (Averaged)</b></div>
        <div>${object.properties.GroundwaterAverage}</div>
        <div><b>Land Holder</b></div>
        <div>${HOLDERS[object.properties.LandUse[0]]}</div>
    `,
        }
      );
    },
    [counter, slide, speedyCounter, cycler, curScenario]
  );

  return { getTooltip };
}
