import { AmbientLight, _SunLight as SunLight } from '@deck.gl/core'
import { FlyToInterpolator } from 'deck.gl';

export const INITIAL_VIEW_STATE = {
    longitude: -120.52,
    latitude: 37.14,
    zoom: 7,
    minZoom: 7,
    maxZoom: 11,
    pitch: 50.85,
    bearing: 32.58
}


export const COWS_VIEW_STATE = {
    longitude: -120.799348991653,
    latitude: 37.07909824584108,
    zoom: 8.589607161282105,
    minZoom: 7,
    maxZoom: 11,
    pitch: 50.85,
    bearing: 32.58,
    transitionDuration: 3000,
    transitionInterpolator: new FlyToInterpolator()
}


export const OUT_COW_VIEW_STATE = {
    longitude: -121.134704643101,
    latitude: 37.71392572292552,
    zoom: 7.714668594935653,
    minZoom: 7,
    maxZoom: 11,
    pitch: 50.85,
    bearing: 32.58,
    transitionDuration: 3000,
    transitionInterpolator: new FlyToInterpolator()
}

export const SETT_VIEW_STATE = {
    longitude: -121.816103974157,
    latitude: 38.98693235425995,
    zoom: 8.654348182289308,
    minZoom: 7,
    maxZoom: 11,
    pitch: 50.85,
    bearing: 32.58,
    transitionDuration: 3000,
    transitionInterpolator: new FlyToInterpolator()
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

export function inRange(a, x, y) { return a >= x && a <= y }