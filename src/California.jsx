import { AmbientLight, LightingEffect, _SunLight as SunLight } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import maplibregl from 'maplibre-gl';
import React, { useState } from 'react';
import { Map } from 'react-map-gl';
import mapStyle from './assets/style.json';
import {TerrainLayer} from '@deck.gl/geo-layers';

// mapStyle.layers = mapStyle.layers.filter(layer => {
//     let idd = layer.id
//     let isLabel = /label|place_city|place_capital|poi|name/.test(idd)
//     return isLabel
// })

// console.log(JSON.stringify(mapStyle))

// mapStyle.layers.forEach(layer => {
//   let idd = layer.id
//   let isWater = /water/.test(idd)
//   if (isWater) {
//     layer.layout["text-size"] = 36
//   }

// })

const INITIAL_VIEW_STATE = {
    longitude: -120.52,
    latitude: 37.14,
    zoom: 7,
    minZoom: 7,
    maxZoom: 11,
    pitch: 50.85,
    bearing: 32.58
}

const ambientLight = new AmbientLight({
    color: [255, 255, 255],
    intensity: 1.0
});

const dirLight = new SunLight({
    timestamp: Date.UTC(2019, 6, 1, 22),
    color: [255, 255, 255],
    intensity: 0.9,
    _shadow: true
});


export default function California() {
    const [effects] = useState(() => {
        const lightingEffect = new LightingEffect({ ambientLight, dirLight });
        lightingEffect.shadowColor = [0, 0, 0, 0.5];
        return [lightingEffect];
    });

    const layers = [
        new TerrainLayer({
            id: 'terrain',
            minZoom: 7,
            maxZoom: 11,
            strategy: 'no-overlap',
            elevationDecoder: {
                rScaler: 5 * 256,
                gScaler: 5 * 1,
                bScaler: 5 * 1 / 256,
                offset: 5 * -32768
            },
            elevationData: `https://tile.nextzen.org/tilezen/terrain/v1/256/terrarium/{z}/{x}/{y}.png?api_key=GkCfj4cgQl-es-CPM8qS2Q`,
            texture: `https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.png`,
            // operation: 'terrain+draw'
        }),
        // new GeoJsonLayer({
        //     data,
        //     getFillColor: [0, 160, 180, 200],
        //     getLineColor: [220, 80, 0],
        //     getLineWidth: 50,
        //     getPointRadius: 150,
        //     extensions: [new TerrainExtension()]
        // })
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
        </>
    );
}