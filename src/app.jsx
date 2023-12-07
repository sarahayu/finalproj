import * as d3 from 'd3'
import { LightingEffect } from '@deck.gl/core'
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions'
import { TerrainLayer, TileLayer } from '@deck.gl/geo-layers'
import DeckGL from '@deck.gl/react'
import { OBJLoader } from '@loaders.gl/obj'
import React, { useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { Map } from 'react-map-gl'

import maplibregl from 'maplibre-gl'

import _data from './assets/combine_hex_5_6.json'
import mapStyle from './assets/style.json'
import IconHexTileLayer from './IconHexTileLayer'
import SolidHexTileLayer from './SolidHexTileLayer'

import { colorInterpDifference, valueInterpUnmet, valueInterpDemand, colorInterpGW, resScale, colorInterpDemand, colorInterpUnmet } from './utils/scales'
import { AMBIENT_LIGHT, COWS_VIEW_STATE, DIR_LIGHT, INITIAL_VIEW_STATE, inRange, OUT_COW_VIEW_STATE, SETT_VIEW_STATE } from './utils/settings'
import { BitmapLayer } from 'deck.gl'
import AnimatedIconHexTileLayer from './AnimatedIconHexTileLayer'
import Card from './Card'
import Clock from './Clock'

let data = _data.map(reses => {
  let newReses = {}
  for (let hexId in reses) {
    if (reses[hexId].DemandBaseline)
      newReses[hexId] = reses[hexId]
  }
  return newReses
})


export default function App() {

  const [slide, setSlide] = useState(0)
  const [effects] = useState(() => {
    const lightingEffect = new LightingEffect({ ambientLight: AMBIENT_LIGHT, dirLight: DIR_LIGHT })
    // lightingEffect.shadowColor = [0, 0, 0, 0.5]
    return [lightingEffect]
  })
  const [counter, setCounter] = useState(1026)
  const [curZoom, setCurZoom] = useState(1);
  const [initialViewState, setInitialViewState] = useState(INITIAL_VIEW_STATE);

  
  const zoomInCows = useCallback(() => {
    setInitialViewState(COWS_VIEW_STATE)
  }, []);

  const zoomInSett = useCallback(() => {
    setInitialViewState(SETT_VIEW_STATE)
  }, []);

  const zoomOutCows = useCallback(() => {
    setInitialViewState(Object.assign(OUT_COW_VIEW_STATE, { onTransitionEnd: zoomInSett }))
  }, []);

  useEffect(() => {
    let timer = setTimeout(() => setCounter(c => (c + 1) % 1200), 250)
    return function () {
      clearTimeout(timer)

    }
  }, [counter])

  
  useEffect(() => {
    if (slide == 8) {
      zoomInCows()
    }
    else if (slide == 8) {
      zoomOutCows()
    }
  }, [slide])

  const curRes = resScale(curZoom)

  const layers = [
    new TileLayer({
      data: 'https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.png',

      minZoom: 7,
      maxZoom: 11,
      tileSize: 256,

      renderSubLayers: props => {
        const {
          bbox: { west, south, east, north }
        } = props.tile;

        return new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [west, south, east, north]
        });
      }
    }),
    // new TerrainLayer({
    //   id: 'terrain',
    //   minZoom: 7,
    //   maxZoom: 11,
    //   strategy: 'no-overlap',
    //   elevationDecoder: {
    //     rScaler: 5 * 256,
    //     gScaler: 5 * 1,
    //     bScaler: 5 * 1 / 256,
    //     offset: 5 * -32768
    //   },
    //   elevationData: `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`,
    //   texture: `https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.png`,
    //   // operation: 'terrain+draw'
    // }),
    // new SolidHexTileLayer({
    //   id: `DifferenceLayerHex`,
    //   data: data.map(reses => {
    //     let newReses = {}
    //     for (let hexId in reses) {
    //       if (reses[hexId].Difference)
    //         newReses[hexId] = reses[hexId]
    //     }
    //     return newReses
    //   }),
    //   thicknessRange: [0.65, 0.8],
    //   filled: true,
    //   extruded: false,
    //   raised: false,
    //   resolution: 1,
    //   getFillColor: d => colorInterpDifference(d.properties.Difference[counter]),
    //   resRange: [5, 6],
    //   opacity: slide >= 2 ? 0.2 : 0,
    //   updateTriggers: {
    //     getFillColor: [counter],
    //   },
    //   transitions: {
    //     opacity: {
    //       duration: 500,
    //       // easing: d3.easeBackIn.overshoot(5),
    //     },
    //     getFillColor: {
    //       duration: 500,
    //       // easing: d3.easeBackIn.overshoot(5),
    //     },
    //   },
    //   // extensions: [new TerrainExtension()]
    // }),
    new SolidHexTileLayer({
      id: `GroundwaterLayer`,
      data,
      thicknessRange: [0.65, 0.80],
      filled: true,
      resolution: curRes,
      extruded: false,
      raised: false,
      getFillColor: d => colorInterpGW(d.properties.Groundwater[slide <= 2 ? counter : (slide <= 4 ? 1026 : 1197)]),
      resRange: [5, 6],
      visible: inRange(slide, 1, 6),
      opacity: slide >= 2 ? 0.8 : 0,
      transitions: {
        opacity: 250,
      }
      // extensions: [new TerrainExtension()]
    }),
    new IconHexTileLayer({
      id: `DemandIcons`,
      data,
      loaders: [OBJLoader],
      mesh: './src/assets/drop.obj',
      raised: true,
      extruded: false,
      resolution: curRes,
      getColor: d => [255, 158, 102],
      getValue: d => valueInterpDemand(d.properties.DemandBaseline[counter]),
      sizeScale: 3000,
      resRange: [5, 6],
      visible: slide == 1,
      opacity: 1,
      // extensions: [new TerrainExtension({
      //   terrainDrawMode: 'offset'
      // })],
    }),
    new AnimatedIconHexTileLayer({
      id: `UnmetDemandIcons1`,
      data,
      loaders: [OBJLoader],
      mesh: './src/assets/drop.obj',
      raised: true,
      extruded: false,
      resolution: curRes,
      getColor: inRange(slide, 2, 3) ? d => [255, 158, 102] : d => [174, 0, 255],
      getValue: slide == 2 || slide == 5 ? d => 0 : (
        slide == 3 ? d => valueInterpDemand(d.properties.DemandBaseline[1026]) : d => valueInterpUnmet(d.properties.UnmetDemandBaseline[1026])
      ),
      sizeScale: 3000,
      resRange: [5, 6],
      visible: inRange(slide, 2, 5),
      opacity: 1,
      // extensions: [new TerrainExtension({
      //   terrainDrawMode: 'offset'
      // })],
    }),
    new AnimatedIconHexTileLayer({
      id: `UnmetDemandIcons2`,
      data,
      loaders: [OBJLoader],
      mesh: './src/assets/drop.obj',
      raised: true,
      extruded: false,
      resolution: curRes,
      getColor: inRange(slide, 4, 5) ? d => [255, 158, 102] : d => [174, 0, 255],
      getValue: slide == 4 || slide == 7 ? d => 0 : (
        slide == 5 ? d => valueInterpDemand(d.properties.DemandBaseline[1197]) : d => valueInterpUnmet(d.properties.UnmetDemandBaseline[1197])
      ),
      sizeScale: 3000,
      resRange: [5, 6],
      visible: inRange(slide, 4, 7),
      opacity: 1,
      // extensions: [new TerrainExtension({
      //   terrainDrawMode: 'offset'
      // })],
    }),
    new SolidHexTileLayer({
      id: `AverageDemand`,
      data,
      thicknessRange: [0, 1],
      filled: true,
      resolution: curRes,
      extruded: false,
      raised: false,
      getFillColor: d => colorInterpDemand(d.properties.DemandBaselineAverage),
      resRange: [5, 6],
      visible: inRange(slide, 6, 9),
      opacity: slide >= 7 ? 0.8 : 0,
      transitions: {
        opacity: 250,
      }
      // extensions: [new TerrainExtension()]
    }),
    new SolidHexTileLayer({
      id: `AverageUnmetDemand`,
      data,
      thicknessRange: [0.65, 0.80],
      filled: true,
      resolution: curRes,
      extruded: false,
      raised: false,
      getFillColor: d => colorInterpUnmet(d.properties.UnmetDemandBaselineAverage),
      resRange: [5, 6],
      visible: inRange(slide, 6, 9),
      opacity: slide >= 7 ? 0.8 : 0,
      transitions: {
        opacity: 250,
      }
      // extensions: [new TerrainExtension()]
    }),
    new IconHexTileLayer({
      id: `SettlementIconsLayer`,
      data: data.map(reses => {
          let newReses = {}
          for (let hexId in reses) {
            if (reses[hexId].LandUse && reses[hexId].LandUse[0] == 0)
              newReses[hexId] = reses[hexId]
          }
          return newReses
        }),
      loaders: [OBJLoader],
      mesh: './src/assets/dam.obj',
      raised: true,
      extruded: false,
      resolution: curRes,
      getColor: d => [200, 200, 200],
      sizeScale: 0.8 * 500,
      resRange: [5, 6],
      visible: inRange(slide, 9, 1000),
      opacity: 1,
      // extensions: [new TerrainExtension({
      //   terrainDrawMode: 'offset'
      // })],
    }),
    new IconHexTileLayer({
      id: `ExhangeIconsLayer`,
      data: data.map(reses => {
          let newReses = {}
          for (let hexId in reses) {
            if (reses[hexId].LandUse && reses[hexId].LandUse[0] == 1)
              newReses[hexId] = reses[hexId]
          }
          return newReses
        }),
      loaders: [OBJLoader],
      mesh: './src/assets/cow.obj',
      raised: true,
      extruded: false,
      resolution: curRes,
      getColor: d => [200, 200, 200],
      sizeScale: 0.8 * 550,
      resRange: [5, 6],
      visible: inRange(slide, 9, 1000),
      opacity: 1,
      // extensions: [new TerrainExtension({
      //   terrainDrawMode: 'offset'
      // })],
    }),
    new IconHexTileLayer({
      id: `ProjectIconsLayer`,
      data: data.map(reses => {
          let newReses = {}
          for (let hexId in reses) {
            if (reses[hexId].LandUse && reses[hexId].LandUse[0] == 2)
              newReses[hexId] = reses[hexId]
          }
          return newReses
        }),
      loaders: [OBJLoader],
      mesh: './src/assets/project.obj',
      raised: true,
      extruded: false,
      resolution: curRes,
      getColor: d => [200, 200, 200],
      sizeScale: 0.8 * 180,
      resRange: [5, 6],
      visible: inRange(slide, 9, 1000),
      opacity: 1,
      // extensions: [new TerrainExtension({
      //   terrainDrawMode: 'offset'
      // })],
    }),
    new IconHexTileLayer({
      id: `NonProjectIconsLayer`,
      data: data.map(reses => {
          let newReses = {}
          for (let hexId in reses) {
            if (reses[hexId].LandUse && reses[hexId].LandUse[0] == 3)
              newReses[hexId] = reses[hexId]
          }
          return newReses
        }),
      loaders: [OBJLoader],
      mesh: './src/assets/nonproject.obj',
      raised: true,
      extruded: false,
      resolution: curRes,
      getColor: d => [200, 200, 200],
      sizeScale: 0.8 * 140,
      resRange: [5, 6],
      visible: inRange(slide, 9, 1000),
      opacity: 1,
      // extensions: [new TerrainExtension({
      //   terrainDrawMode: 'offset'
      // })],
    }),
  ]

  return (
    <>
      <DeckGL
        onViewStateChange={({ viewState }) => {
          setCurZoom(viewState.zoom)
          console.log(viewState)
        }}
        layers={layers}
        effects={effects}
        initialViewState={initialViewState}
        controller={true}
      >
        <Map reuseMaps mapLib={maplibregl} mapStyle={mapStyle} preventStyleDiffing={true} />
      </DeckGL>
      <Card {...{ slide }} />
      {inRange(slide, 1, 6) && <Clock counter={inRange(slide, 3, 6) ? (slide <= 4 ? 1026 : 1197) : counter} displayMonth={ inRange(slide, 3, 6) } dataset={ slide == 3 ? "averageDemandBaseline" : "averageDemandBaseline" } />}
      <button onClick={() => {
        setSlide(s => s + 1)
      }} style={{
        position: 'absolute', display: 'block', bottom: "20px", right: "20px"
      }}>Next Slide</button>
      <button onClick={() => {
        setSlide(s => s - 1)
      }} style={{
        position: 'absolute', display: 'block', bottom: "20px", left: "20px"
      }}>Prev Slide</button>
    </>
  )
}

export function renderToDOM(container) {
  createRoot(container).render(<App />)
}
