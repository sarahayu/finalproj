import { LightingEffect } from '@deck.gl/core';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import { TerrainLayer } from '@deck.gl/geo-layers';
import DeckGL from '@deck.gl/react';
import { OBJLoader } from '@loaders.gl/obj';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Map } from 'react-map-gl';

import maplibregl from 'maplibre-gl';

import data from './assets/combine_hex_high_norm.json';
import mapStyle from './assets/style.json';
import IconHexTileLayer from './IconHexTileLayer';
import SolidHexTileLayer from './SolidHexTileLayer';

import { colorInterpDifference, valueInterp, valueInterp2 } from './utils/scales';
import { AMBIENT_LIGHT, DIR_LIGHT, INITIAL_VIEW_STATE } from './utils/settings';


export default function App() {

  const [slide, setSlide] = useState(0)
  const [effects] = useState(() => {
    const lightingEffect = new LightingEffect({ ambientLight: AMBIENT_LIGHT, dirLight: DIR_LIGHT });
    // lightingEffect.shadowColor = [0, 0, 0, 0.5];
    return [lightingEffect];
  });
  const [counter, setCounter] = useState(1026)

  // useEffect(() => {
  //     let timer = setTimeout(() => setCounter(c => (c + 1) % 1200), 100)
  //     return function () {
  //       clearTimeout(timer)

  //     }
  //   }, [counter])

  const layers = [
    new TerrainLayer({
      id: 'terrain',
      minZoom: 7,
      maxZoom: 11,
      strategy: 'no-overlap',
      elevationDecoder: {
        rScaler: 0 * 256,
        gScaler: 0 * 1,
        bScaler: 0 * 1 / 256,
        offset: 1
      },
      elevationData: `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`,
      texture: `https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.png`,
      operation: 'terrain+draw'
    }),
    new SolidHexTileLayer({
      id: `DifferenceLayerHex`,
      data: data.map(reses => {
        let newReses = {}
        for (let hexId in reses) {
          if (reses[hexId].Difference)
            newReses[hexId] = reses[hexId]
        }
        return newReses
      }),
      thicknessRange: [0.65, 0.8],
      filled: true,
      extruded: false,
      raised: false,
      resolution: 1,
      getFillColor: d => colorInterpDifference(d.properties.Difference[counter]),
      resRange: [6, 6],
      opacity: 0.2,
      updateTriggers: {
        getFillColor: [counter],
      },
      extensions: [new TerrainExtension()]
    }),
    // new SolidHexTileLayer({
    //     id: `GroundwaterLayer`,
    //     data,
    //     thicknessRange: [0.65, 0.80],
    //     filled: true,
    //     resolution: 1,
    //     extruded: false,
    //     raised: false,
    //     getFillColor: d => colorInterpGW(d.properties.Groundwater[counter]),
    //     resRange: [6, 6],
    //     opacity: 0.2,
    //     updateTriggers: {
    //         getFillColor: [counter],
    //     },
    //     extensions: [new TerrainExtension()]
    // }),
    new IconHexTileLayer({
      id: `DemandIcons`,
      data: data.map(reses => {
        let newReses = {}
        for (let hexId in reses) {
          if (reses[hexId].Demand)
            newReses[hexId] = reses[hexId]
        }
        return newReses
      }),
      loaders: [OBJLoader],
      mesh: './src/assets/drop.obj',
      raised: false,
      extruded: false,
      resolution: 1,
      getColor: d => [255, 158, 102],
      getValue: slide == 0 ? d => valueInterp2(d.properties.Demand[counter]) : d => valueInterp(d.properties.UnmetDemand[counter]),
      sizeScale: 3000,
      resRange: [6, 6],
      opacity: 0.9,
      updateTriggers: {
        getValue: [counter],
      },
      extensions: [new TerrainExtension({
        terrainDrawMode: 'offset'
      })],
      // offset: [-0.33, 0],
    }),
  ]

  return (
    <>
      <DeckGL
        layers={layers}
        effects={effects}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
      >
        <Map reuseMaps mapLib={maplibregl} mapStyle={mapStyle} preventStyleDiffing={true} />
      </DeckGL>
      <p style={{
        position: "absolute",
        top: "0",
        left: "0",
      }}>This is California.</p>
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
