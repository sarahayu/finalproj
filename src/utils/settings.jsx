import { AmbientLight, _SunLight as SunLight } from '@deck.gl/core'

export const INITIAL_VIEW_STATE = {
    longitude: -120.52,
    latitude: 37.14,
    zoom: 7,
    minZoom: 7,
    maxZoom: 11,
    pitch: 50.85,
    bearing: 32.58
}

export const AMBIENT_LIGHT = new AmbientLight({
    color: [255, 255, 255],
    intensity: 1.0
});

export const DIR_LIGHT = new SunLight({
    timestamp: Date.UTC(2019, 6, 1, 22),
    color: [255, 255, 255],
    intensity: 0.9,
    // _shadow: true
});