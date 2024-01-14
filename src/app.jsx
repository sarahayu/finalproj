import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Map } from 'react-map-gl';

import * as d3 from 'd3';

import { LightingEffect } from '@deck.gl/core';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import { TerrainLayer, TileLayer } from '@deck.gl/geo-layers';
import DeckGL from '@deck.gl/react';
import { BitmapLayer } from 'deck.gl';
import { OBJLoader } from '@loaders.gl/obj';
import maplibregl from 'maplibre-gl';

import mapStyle from './assets/style.json';
import { dataFilter } from './utils/utils';
import { data } from './utils/data';

import IconHexTileLayer from './IconHexTileLayer';
import SolidHexTileLayer from './SolidHexTileLayer';
import AnimatedIconHexTileLayer from './AnimatedIconHexTileLayer';
import Card from './Card';
import Clock from './Clock';

import {
  colorInterpDifference,
  valueInterpUnmet,
  valueInterpDemand,
  colorInterpGW,
  resScale,
  dateInterpIdx /* colorInterpDemand, colorInterpUnmet */,
  colorInterpUnmet,
  colorInterpDemand,
  colorInterpDiffDemand,
  colorUnmet,
  colorDemand,
} from './utils/scales';

import {
  AMBIENT_LIGHT,
  COWS_VIEW_STATE,
  DIR_LIGHT,
  INITIAL_VIEW_STATE,
  inRange,
  COWS_OUT_VIEW_STATE,
  PROJ_VIEW_STATE,
  SETT_VIEW_STATE,
  PROJ_OUT_VIEW_STATE,
  HOLDERS,
  SCENARIOS,
  SCENARIO_LABELS,
  JUXTAPOSE_VIEW_STATE,
  USE_TERRAIN_3D,
} from './utils/settings';

export default function App() {
  const [slide, setSlide] = useState(0);
  const [effects] = useState(() => {
    const lightingEffect = new LightingEffect({
      ambientLight: AMBIENT_LIGHT,
      dirLight: DIR_LIGHT,
    });
    // lightingEffect.shadowColor = [0, 0, 0, 0.5]
    return [lightingEffect];
  });
  const [counter, setCounter] = useState(1026);
  const [cycler, setCycler] = useState(0);
  const [curZoom, setCurZoom] = useState(1);
  const [curScenario, setCurScenario] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [counting, setCounting] = useState(false);
  const [initialViewState, setInitialViewState] = useState(INITIAL_VIEW_STATE);

  const [speedyCounter, setSpeedyCounter] = useState(1026);
  const [playing, setPlaying] = useState(false);

  const [displayGW, setDisplayGW] = useState(true);
  const [displayDiff, setDisplayDiff] = useState(true);
  const [displayUnmet, setDisplayUnmet] = useState(true);
  const [displayDemand, setDisplayDemand] = useState(false);
  const [displayLandUse, setDisplayLandUse] = useState(false);

  useEffect(() => {
    if (playing) {
      let timer = setTimeout(
        () => setSpeedyCounter((c) => (c + 1) % 1199 + 1),
        250
      );
      return function () {
        clearTimeout(timer);
      };
    }
  }, [speedyCounter, playing]);

  const getTooltip = useCallback(
    ({ object }) => {
      if (counting || inRange(slide, 1, 6) || slide == 14) {
        let date =
          slide == 14
            ? dateInterpIdx(1026)
            : inRange(slide, 1, 2)
            ? dateInterpIdx(counter)
            : inRange(slide, 3, 4)
            ? dateInterpIdx(1026)
            : dateInterpIdx(1197);
        let cc =
          slide == 14
            ? 1026
            : inRange(slide, 1, 2)
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
          ? dateInterpIdx((Math.floor(cycler / 3) * 67) % 1199 + 1)
          : dateInterpIdx(speedyCounter);
        let cc = inRange(slide, 14, 19)
          ? 1026
          : inRange(slide, 20, 20)
          ? 1197
          : inRange(slide, 21, 21)
          ? (Math.floor(cycler / 3) * 67) % 1199 + 1
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
          object.properties.DemandBaselineAverage -
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

  const zoomInCows = useCallback(() => {
    setInitialViewState({
      ...COWS_VIEW_STATE,
      onTransitionEnd: () => setTransitioning(false),
    });
  }, []);

  const zoomInSett = useCallback(() => {
    setInitialViewState({
      ...SETT_VIEW_STATE,
      onTransitionEnd: () => setTransitioning(false),
    });
  }, []);

  const zoomInProj = useCallback(() => {
    setInitialViewState({
      ...PROJ_VIEW_STATE,
      onTransitionEnd: () => setTransitioning(false),
    });
  }, []);

  const zoomInJux = useCallback(() => {
    setInitialViewState({
      ...JUXTAPOSE_VIEW_STATE,
      onTransitionEnd: () => setTransitioning(false),
    });
  }, []);

  const zoomOut = useCallback(() => {
    setInitialViewState({
      ...COWS_OUT_VIEW_STATE,
      onTransitionEnd: () => setTransitioning(false),
    });
  }, []);

  const zoomOutThenSett = useCallback(() => {
    setTransitioning(true);
    setInitialViewState({
      ...PROJ_OUT_VIEW_STATE,
      onTransitionEnd: zoomInSett,
    });
  }, []);

  const zoomOutThenProj = useCallback(() => {
    setTransitioning(true);
    setInitialViewState({
      ...COWS_OUT_VIEW_STATE,
      onTransitionEnd: zoomInProj,
    });
  }, []);

  useEffect(() => {
    if (inRange(slide, 1, 2)) {
      setCounting(true);
      let timer = setTimeout(() => setCounter((c) => (c + 1) % 1199 + 1), 250);
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

    if (inRange(slide, 15, 17)) {
      setCurScenario(0);
    } else if (slide == 18) {
      setCurScenario(1);
    } else if (slide == 19) {
      setCurScenario(2);
    }
  }, [slide]);

  const curRes = resScale(curZoom);

  const epilogue = slide >= 22;

  const layers = [
    ...(!USE_TERRAIN_3D
      ? [
          new TileLayer({
            data: 'https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.png',

            minZoom: 7,
            maxZoom: 11,
            tileSize: 256,

            renderSubLayers: (props) => {
              const {
                bbox: { west, south, east, north },
              } = props.tile;

              return new BitmapLayer(props, {
                data: null,
                image: props.data,
                bounds: [west, south, east, north],
              });
            },
          }),
        ]
      : []),
    ...(USE_TERRAIN_3D
      ? [
          new TerrainLayer({
            id: 'terrain',
            minZoom: 7,
            maxZoom: 11,
            strategy: 'no-overlap',
            elevationDecoder: {
              rScaler: 5 * 256,
              gScaler: 5 * 1,
              bScaler: (5 * 1) / 256,
              offset: 5 * -32768,
            },
            elevationData: `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`,
            texture: `https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.png`,
            operation: 'terrain+draw',
          }),
        ]
      : []),
    new SolidHexTileLayer({
      id: `GroundwaterLayer`,
      data,
      thicknessRange: [0, 1],
      filled: true,
      resolution: curRes,
      extruded: false,
      raised: false,
      getFillColor: (d) =>
        colorInterpGW(
          d.properties.Groundwater[
            slide <= 2 ? counter : slide <= 4 ? 1026 : 1197
          ]
        ),
      visible: inRange(slide, 1, 6),
      opacity: slide >= 2 ? 0.2 : 0,
      transitions: {
        opacity: 250,
      },
      pickable: true,
      ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
    }),
    new IconHexTileLayer({
      id: `DemandIcons`,
      data,
      loaders: [OBJLoader],
      mesh: './src/assets/drop.obj',
      raised: true,
      extruded: false,
      resolution: curRes,
      getColor: (d) => /* colorDemand */[255, 130, 35],
      getValue: (d) => valueInterpDemand(d.properties.DemandBaseline[counter]),
      sizeScale: 3000,
      visible: slide == 1,
      opacity: 1,
      ...(USE_TERRAIN_3D
        ? {
            extensions: [
              new TerrainExtension({
                terrainDrawMode: 'offset',
              }),
            ],
          }
        : {}),
      pickable: true,
    }),
    new AnimatedIconHexTileLayer({
      id: `UnmetDemandIcons1`,
      data,
      loaders: [OBJLoader],
      mesh: './src/assets/drop.obj',
      raised: true,
      extruded: false,
      resolution: curRes,
      getColor: inRange(slide, 2, 3) ? (d) => /* colorDemand */[255, 130, 35] : (d) => /* colorUnmet */[255, 130, 35],
      getValue:
        slide == 2 || slide == 5
          ? (d) => 0
          : slide == 3
          ? (d) => valueInterpDemand(d.properties.DemandBaseline[1026])
          : (d) => valueInterpUnmet(d.properties.UnmetDemandBaseline[1026]),
      sizeScale: 3000,
      visible: inRange(slide, 2, 5),
      opacity: 1,
      ...(USE_TERRAIN_3D
        ? {
            extensions: [
              new TerrainExtension({
                terrainDrawMode: 'offset',
              }),
            ],
          }
        : {}),
      pickable: true,
    }),
    new AnimatedIconHexTileLayer({
      id: `UnmetDemandIcons2`,
      data,
      loaders: [OBJLoader],
      mesh: './src/assets/drop.obj',
      raised: true,
      extruded: false,
      resolution: curRes,
      getColor: inRange(slide, 4, 5) ? (d) => /* colorDemand */[255, 130, 35] : (d) => /* colorUnmet */[255, 130, 35],
      getValue:
        slide == 4 || slide == 7
          ? (d) => 0
          : slide == 5
          ? (d) => valueInterpDemand(d.properties.DemandBaseline[1197])
          : (d) => valueInterpUnmet(d.properties.UnmetDemandBaseline[1197]),
      sizeScale: 3000,
      visible: inRange(slide, 4, 7),
      opacity: 1,
      ...(USE_TERRAIN_3D
        ? {
            extensions: [
              new TerrainExtension({
                terrainDrawMode: 'offset',
              }),
            ],
          }
        : {}),
      pickable: true,
    }),
    new SolidHexTileLayer({
      id: `AverageDemand`,
      data,
      thicknessRange: [0, 1],
      filled: true,
      resolution: curRes,
      extruded: true,
      getElevation: (d) =>
        !transitioning &&
        ((inRange(slide, 9, 9) && d.properties.LandUse[0] == 1) ||
          (inRange(slide, 10, 10) && d.properties.LandUse[0] == 2) ||
          (inRange(slide, 11, 11) && d.properties.LandUse[0] == 0))
          ? 2000
          : 0,
      raised: false,
      getFillColor: (d) =>
        colorInterpDemand(d.properties.DemandBaselineAverage),
      visible: inRange(slide, 6, 11),
      opacity: slide >= 7 ? 1.0 : 0,
      transitions: {
        opacity: 250,
      },
      ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
      pickable: true,
    }),
    new SolidHexTileLayer({
      id: `AverageUnmetDemand`,
      data,
      thicknessRange: [0.5, 0.65],
      filled: true,
      resolution: curRes,
      extruded: true,
      getElevation: (d) =>
        !transitioning &&
        ((inRange(slide, 9, 9) && d.properties.LandUse[0] == 1) ||
          (inRange(slide, 10, 10) && d.properties.LandUse[0] == 2) ||
          (inRange(slide, 11, 11) && d.properties.LandUse[0] == 0))
          ? 2000
          : 0,
      raised: false,
      getFillColor: (d) =>
        colorInterpUnmet(d.properties.UnmetDemandBaselineAverage),
      visible: inRange(slide, 6, 11),
      opacity: slide >= 7 ? 1 : 0,
      transitions: {
        opacity: 250,
      },
      ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
      pickable: true,
    }),
    new IconHexTileLayer({
      id: `SettlementIconsLayer`,
      data: dataFilter(data, (d) => d.LandUse[0] == 0),
      loaders: [OBJLoader],
      mesh: './src/assets/dam.obj',
      raised: true,
      getElevation: (d) =>
        !transitioning && inRange(slide, 11, 11) ? 2000 : 0,
      resolution: curRes,
      getColor: (d) => [255, 127, 206],
      sizeScale: 0.8 * 500,
      visible: inRange(slide, 9, 13),
      opacity: 1,
      ...(USE_TERRAIN_3D
        ? {
            extensions: [
              new TerrainExtension({
                terrainDrawMode: 'offset',
              }),
            ],
          }
        : {}),
      pickable: true,
    }),
    new IconHexTileLayer({
      id: `ExhangeIconsLayer`,
      data: dataFilter(data, (d) => d.LandUse[0] == 1),
      loaders: [OBJLoader],
      mesh: './src/assets/cow.obj',
      raised: true,
      getElevation: (d) => (!transitioning && inRange(slide, 9, 9) ? 2000 : 0),
      resolution: curRes,
      getColor: (d) => [255, 127, 206],
      sizeScale: 0.8 * 550,
      visible: inRange(slide, 9, 13),
      opacity: 1,
      ...(USE_TERRAIN_3D
        ? {
            extensions: [
              new TerrainExtension({
                terrainDrawMode: 'offset',
              }),
            ],
          }
        : {}),
      pickable: true,
    }),
    new IconHexTileLayer({
      id: `ProjectIconsLayer`,
      data: dataFilter(data, (d) => d.LandUse[0] == 2),
      loaders: [OBJLoader],
      mesh: './src/assets/project.obj',
      raised: true,
      getElevation: (d) =>
        !transitioning && inRange(slide, 10, 10) ? 2000 : 0,
      resolution: curRes,
      getColor: (d) => [255, 127, 206],
      sizeScale: 0.8 * 180,
      visible: inRange(slide, 9, 13),
      opacity: 1,
      ...(USE_TERRAIN_3D
        ? {
            extensions: [
              new TerrainExtension({
                terrainDrawMode: 'offset',
              }),
            ],
          }
        : {}),
      pickable: true,
    }),
    new IconHexTileLayer({
      id: `NonProjectIconsLayer`,
      data: dataFilter(data, (d) => d.LandUse[0] == 3),
      loaders: [OBJLoader],
      mesh: './src/assets/nonproject.obj',
      raised: true,
      getElevation: (d) => 0,
      resolution: curRes,
      getColor: (d) => [255, 127, 206],
      sizeScale: 0.8 * 140,
      visible: inRange(slide, 9, 13),
      opacity: 1,
      ...(USE_TERRAIN_3D
        ? {
            extensions: [
              new TerrainExtension({
                terrainDrawMode: 'offset',
              }),
            ],
          }
        : {}),
      pickable: true,
    }),
    new SolidHexTileLayer({
      id: `GroundwaterAgainLayer`,
      data,
      thicknessRange: [0, 1],
      filled: true,
      resolution: curRes,
      extruded: false,
      raised: false,
      getFillColor: (d) => colorInterpGW(d.properties.GroundwaterAverage),
      visible: inRange(slide, 12, 13),
      opacity: inRange(slide, 13, 13) ? 0.2 : 0,
      transitions: {
        opacity: 250,
      },
      ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
      pickable: true,
    }),
    new SolidHexTileLayer({
      id: `DeliveryWaterLayer`,
      data,
      thicknessRange: [0.5, 0.65],
      filled: true,
      resolution: curRes,
      extruded: false,
      raised: false,
      getFillColor: (d) =>
        colorInterpDiffDemand(
          d.properties.DemandBaselineAverage +
            d.properties.UnmetDemandBaselineAverage
        ),
      visible: inRange(slide, 11, 13),
      opacity: inRange(slide, 12, 13) ? 1 : 0,
      transitions: {
        opacity: 250,
      },
      ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
      pickable: true,
    }),
    new SolidHexTileLayer({
      id: `GroundwaterAgainTimed`,
      data,
      thicknessRange: [0, 1],
      filled: true,
      resolution: curRes,
      extruded: false,
      raised: false,
      getFillColor: (d) =>
        colorInterpGW(
          d.properties.Groundwater[
            inRange(slide, 13, 19)
              ? 1026
              : slide == 20
              ? 1197
              : (Math.floor(cycler / 3) * 67) % 1199 + 1
          ]
        ),
      visible: inRange(slide, 13, 21),
      opacity: inRange(slide, 14, 21) ? 0.2 : 0,
      transitions: {
        opacity: 250,
      },
      ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
      pickable: true,
    }),
    new AnimatedIconHexTileLayer({
      id: `ScenarioUnmet`,
      data,
      loaders: [OBJLoader],
      mesh: './src/assets/drop.obj',
      raised: true,
      extruded: false,
      resolution: curRes,
      getColor: (d) => /* colorUnmet */[255, 130, 35],
      getValue:
        slide == 13
          ? (d) => 0
          : slide == 14
          ? (d) => valueInterpUnmet(d.properties.UnmetDemandBaseline[1026])
          : (d) =>
              valueInterpUnmet(
                d.properties.UnmetDemand[SCENARIOS[curScenario]][1026]
              ),
      sizeScale: 3000,
      visible: inRange(slide, 13, 19),
      opacity: 1,
      ...(USE_TERRAIN_3D
        ? {
            extensions: [
              new TerrainExtension({
                terrainDrawMode: 'offset',
              }),
            ],
          }
        : {}),
      pickable: true,
    }),
    new SolidHexTileLayer({
      id: `DifferenceLayer`,
      data,
      thicknessRange: [0.5, 0.65],
      filled: true,
      resolution: curRes,
      extruded: false,
      raised: false,
      getFillColor: (d) =>
        colorInterpDifference(
          d.properties.UnmetDemand[SCENARIOS[curScenario]][1026] -
            d.properties.UnmetDemandBaseline[1026]
        ),
      visible: inRange(slide, 15, 19),
      opacity: inRange(slide, 16, 19) ? 1.0 : 0,
      transitions: {
        opacity: 250,
      },
      ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
      pickable: true,
    }),
    new AnimatedIconHexTileLayer({
      id: `ScenarioUnmet1197`,
      data,
      loaders: [OBJLoader],
      mesh: './src/assets/drop.obj',
      raised: true,
      extruded: false,
      resolution: curRes,
      getColor: (d) => /* colorUnmet */[255, 130, 35],
      getValue: (d) =>
        valueInterpUnmet(d.properties.UnmetDemand[SCENARIOS[cycler % 3]][1197]),
      sizeScale: 3000,
      visible: inRange(slide, 20, 20),
      opacity: 1,
      ...(USE_TERRAIN_3D
        ? {
            extensions: [
              new TerrainExtension({
                terrainDrawMode: 'offset',
              }),
            ],
          }
        : {}),
      pickable: true,
    }),
    new SolidHexTileLayer({
      id: `DifferenceLayer1197`,
      data,
      thicknessRange: [0.5, 0.65],
      filled: true,
      resolution: curRes,
      extruded: false,
      raised: false,
      getFillColor: (d) =>
        colorInterpDifference(
          d.properties.UnmetDemand[SCENARIOS[cycler % 3]][1197] -
            d.properties.UnmetDemandBaseline[1197]
        ),
      visible: inRange(slide, 19, 20),
      opacity: inRange(slide, 20, 20) ? 1.0 : 0,
      transitions: {
        opacity: 250,
      },
      ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
      pickable: true,
    }),
    new AnimatedIconHexTileLayer({
      id: `ScenarioUnmetRandomized`,
      data,
      loaders: [OBJLoader],
      mesh: './src/assets/drop.obj',
      raised: true,
      extruded: false,
      resolution: curRes,
      getColor: (d) => /* colorUnmet */[255, 130, 35],
      getValue: (d) =>
        valueInterpUnmet(
          d.properties.UnmetDemand[SCENARIOS[cycler % 3]][
            (Math.floor(cycler / 3) * 67) % 1199 + 1
          ]
        ),
      sizeScale: 3000,
      visible: inRange(slide, 21, 21),
      opacity: 1,
      ...(USE_TERRAIN_3D
        ? {
            extensions: [
              new TerrainExtension({
                terrainDrawMode: 'offset',
              }),
            ],
          }
        : {}),
      pickable: true,
    }),
    new SolidHexTileLayer({
      id: `DifferenceLayerRandomized`,
      data,
      thicknessRange: [0.5, 0.65],
      filled: true,
      resolution: curRes,
      extruded: false,
      raised: false,
      getFillColor: (d) =>
        colorInterpDifference(
          d.properties.UnmetDemand[SCENARIOS[cycler % 3]][
            (Math.floor(cycler / 3) * 67) % 1199 + 1
          ] -
            d.properties.UnmetDemandBaseline[
              (Math.floor(cycler / 3) * 67) % 1199 + 1
            ]
        ),
      visible: inRange(slide, 20, 21),
      opacity: inRange(slide, 21, 21) ? 1.0 : 0,
      transitions: {
        opacity: 250,
      },
      ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
      pickable: true,
    }),

    new SolidHexTileLayer({
      id: `GroundwaterEpilogue`,
      data,
      thicknessRange: [0, 1],
      filled: true,
      resolution: curRes,
      extruded: false,
      raised: false,
      getFillColor: (d) =>
        colorInterpGW(d.properties.Groundwater[speedyCounter]),
      visible: displayGW && epilogue,
      opacity: 0.2,
      ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
      pickable: true,
    }),
    new SolidHexTileLayer({
      id: `DifferenceEpilogue`,
      data,
      thicknessRange: [0.5, 0.65],
      filled: true,
      resolution: curRes,
      extruded: false,
      raised: false,
      getFillColor: (d) =>
        colorInterpDifference(
          d.properties.UnmetDemand[SCENARIOS[curScenario]][speedyCounter] -
            d.properties.UnmetDemandBaseline[speedyCounter]
        ),
      visible: displayDiff && epilogue,
      opacity: 1.0,
      ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
      pickable: true,
    }),
    new AnimatedIconHexTileLayer({
      id: `ScenarioUnmetEpilogue`,
      data,
      loaders: [OBJLoader],
      mesh: './src/assets/drop.obj',
      raised: true,
      extruded: false,
      resolution: curRes,
      getColor: (d) => /* colorUnmet */[255, 130, 35],
      getValue: (d) =>
        valueInterpUnmet(
          d.properties.UnmetDemand[SCENARIOS[curScenario]][speedyCounter]
        ),
      sizeScale: 3000,
      visible: displayUnmet && epilogue,
      opacity: 1,
      ...(USE_TERRAIN_3D
        ? {
            extensions: [
              new TerrainExtension({
                terrainDrawMode: 'offset',
              }),
            ],
          }
        : {}),
      pickable: true,
    }),
    new AnimatedIconHexTileLayer({
      id: `ScenarioDemandEpilogue`,
      data,
      loaders: [OBJLoader],
      mesh: './src/assets/drop.obj',
      raised: true,
      extruded: false,
      resolution: curRes,
      getColor: (d) => /* colorDemand */[255, 130, 35],
      getValue: (d) =>
        valueInterpDemand(
          d.properties.Demand[SCENARIOS[curScenario]][speedyCounter]
        ),
      sizeScale: 3000,
      visible: displayDemand && epilogue,
      opacity: 1,
      ...(USE_TERRAIN_3D
        ? {
            extensions: [
              new TerrainExtension({
                terrainDrawMode: 'offset',
              }),
            ],
          }
        : {}),
      pickable: true,
    }),
    new IconHexTileLayer({
      id: `SettlementIconsEpilogue`,
      data: dataFilter(data, (d) => d.LandUse[0] == 0),
      loaders: [OBJLoader],
      mesh: './src/assets/dam.obj',
      raised: false,
      resolution: curRes,
      getColor: (d) => [255, 127, 206],
      sizeScale: 0.8 * 500,
      visible: displayLandUse && epilogue,
      opacity: 1,
      ...(USE_TERRAIN_3D
        ? {
            extensions: [
              new TerrainExtension({
                terrainDrawMode: 'offset',
              }),
            ],
          }
        : {}),
      pickable: true,
    }),
    new IconHexTileLayer({
      id: `ExhangeIconsEpilogue`,
      data: dataFilter(data, (d) => d.LandUse[0] == 1),
      loaders: [OBJLoader],
      mesh: './src/assets/cow.obj',
      raised: false,
      resolution: curRes,
      getColor: (d) => [255, 127, 206],
      sizeScale: 0.8 * 550,
      visible: displayLandUse && epilogue,
      opacity: 1,
      ...(USE_TERRAIN_3D
        ? {
            extensions: [
              new TerrainExtension({
                terrainDrawMode: 'offset',
              }),
            ],
          }
        : {}),
      pickable: true,
    }),
    new IconHexTileLayer({
      id: `ProjectIconsEpilogue`,
      data: dataFilter(data, (d) => d.LandUse[0] == 2),
      loaders: [OBJLoader],
      mesh: './src/assets/project.obj',
      raised: false,
      resolution: curRes,
      getColor: (d) => [255, 127, 206],
      sizeScale: 0.8 * 180,
      visible: displayLandUse && epilogue,
      opacity: 1,
      ...(USE_TERRAIN_3D
        ? {
            extensions: [
              new TerrainExtension({
                terrainDrawMode: 'offset',
              }),
            ],
          }
        : {}),
      pickable: true,
    }),
    new IconHexTileLayer({
      id: `NonProjectIconsEpilogue`,
      data: dataFilter(data, (d) => d.LandUse[0] == 3),
      loaders: [OBJLoader],
      mesh: './src/assets/nonproject.obj',
      raised: false,
      resolution: curRes,
      getColor: (d) => [255, 127, 206],
      sizeScale: 0.8 * 140,
      visible: displayLandUse && epilogue,
      opacity: 1,
      ...(USE_TERRAIN_3D
        ? {
            extensions: [
              new TerrainExtension({
                terrainDrawMode: 'offset',
              }),
            ],
          }
        : {}),
      pickable: true,
    }),
  ];

  return (
    <>
      <DeckGL
        onViewStateChange={({ viewState }) => {
          setCurZoom(viewState.zoom);
          console.log(viewState);
        }}
        layers={layers}
        effects={effects}
        initialViewState={initialViewState}
        controller={true}
        getTooltip={getTooltip}
      >
        <Map
          reuseMaps
          mapLib={maplibregl}
          mapStyle={mapStyle}
          preventStyleDiffing={true}
        />
      </DeckGL>
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
                ? (Math.floor(cycler / 3) * 67) % 1199 + 1
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
      {epilogue && (
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
      )}
      {epilogue && (
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
      )}
      {epilogue && (
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
      )}
      {epilogue && (
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
      )}
    </>
  );
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
