import { AmbientLight, LightingEffect, _SunLight as SunLight } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import maplibregl from 'maplibre-gl';
import React, { useState } from 'react';
import { Map } from 'react-map-gl';
import mapStyle from './assets/style.json';

const INITIAL_VIEW_STATE = {
    longitude: -120.52,
    latitude: 37.14,
    zoom: 7.87,
    pitch: 50.85,
    bearing: 32.58
}

const ambientLight = new AmbientLight({
    color: [255, 255, 255],
    intensity: 1.0
});

const dirLight = new SunLight({
    timestamp: Date.UTC(2019, 7, 1, 22),
    color: [255, 255, 255],
    intensity: 1.0,
    // _shadow: true
});


export default function Demand() {
    const [effects] = useState(() => {
        const lightingEffect = new LightingEffect({ ambientLight, dirLight });
        lightingEffect.shadowColor = [0, 0, 0, 0.5];
        return [lightingEffect];
    });

    const layers = []

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
            }}>Demand.</p>
        </>
    );
}