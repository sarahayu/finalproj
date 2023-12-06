import * as d3 from 'd3'
import { LightingEffect } from '@deck.gl/core'
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions'
import { TerrainLayer, TileLayer } from '@deck.gl/geo-layers'
import DeckGL from '@deck.gl/react'
import { OBJLoader } from '@loaders.gl/obj'
import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Map } from 'react-map-gl'

import maplibregl from 'maplibre-gl'

import _data from './assets/combine_hex_med_norm.json'
import mapStyle from './assets/style.json'
import IconHexTileLayer from './IconHexTileLayer'
import SolidHexTileLayer from './SolidHexTileLayer'

import { colorInterpDifference, valueInterpUnmet, valueInterpDemand, colorInterpGW } from './utils/scales'
import { AMBIENT_LIGHT, DIR_LIGHT, INITIAL_VIEW_STATE } from './utils/settings'
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

  useEffect(() => {
    let timer = setTimeout(() => setCounter(c => (c + 1) % 1200), 250)
    return function () {
      clearTimeout(timer)

    }
  }, [counter])

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
    //   resRange: [5, 5],
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
      resolution: 1,
      extruded: false,
      raised: false,
      getFillColor: d => colorInterpGW(d.properties.Groundwater[slide <= 2 ? counter : (slide <= 4 ? 1026 : 1197)]),
      resRange: [5, 5],
      visible: slide >= 1,
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
      resolution: 1,
      getColor: d => [255, 158, 102],
      getValue: d => valueInterpDemand(d.properties.DemandBaseline[counter]),
      sizeScale: 3000,
      resRange: [5, 5],
      visible: slide == 1,
      opacity: 1,
      // extensions: [new TerrainExtension({
      //   terrainDrawMode: 'offset'
      // })],
    }),
    new AnimatedIconHexTileLayer({
      id: `UnmetDemandIcons`,
      data, 
      loaders: [OBJLoader],
      mesh: './src/assets/drop.obj',
      raised: true,
      extruded: false,
      resolution: 1,
      getColor: d => [255, 158, 102],
      getValue: slide <= 2 ? 0 : (slide <= 3 ? d => valueInterpDemand(d.properties.DemandBaseline[1026]) : (
        slide <= 4 ? d => valueInterpUnmet(d.properties.UnmetDemand[1026]) : (
          slide <= 5 ? d => valueInterpDemand(d.properties.DemandBaseline[1197]) : d => valueInterpUnmet(d.properties.UnmetDemand[1197])
        )
      )),
      sizeScale: 3000,
      resRange: [5, 5],
      visible: slide >= 2,
      opacity: 1,
      // extensions: [new TerrainExtension({
      //   terrainDrawMode: 'offset'
      // })],
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
      <Card {...{ slide }} />
      { slide >= 1 && <Clock counter={ slide <= 2 ? counter : (slide <= 4 ? 1026 : 1197) }/> }
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
