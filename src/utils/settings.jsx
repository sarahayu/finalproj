import { AmbientLight, _SunLight as SunLight } from '@deck.gl/core';
import { FlyToInterpolator, LightingEffect } from 'deck.gl';

export const INITIAL_VIEW_STATE = {
  longitude: -121.046040643251,
  latitude: 37.53320315272563,
  zoom: 7.3252675985610685,
  minZoom: 7,
  maxZoom: 11,
  pitch: 50.85,
  bearing: 32.58,
};

export const COWS_VIEW_STATE = {
  longitude: -120.799348991653,
  latitude: 37.07909824584108,
  zoom: 9.589607161282105,
  minZoom: 7,
  maxZoom: 11,
  pitch: 50.85,
  bearing: 32.58,
  transitionDuration: 3000,
  transitionInterpolator: new FlyToInterpolator(),
};

export const COWS_OUT_VIEW_STATE = {
  longitude: -121.134704643101,
  latitude: 37.71392572292552,
  zoom: 7.714668594935653,
  minZoom: 7,
  maxZoom: 11,
  pitch: 50.85,
  bearing: 32.58,
  transitionDuration: 3000,
  transitionInterpolator: new FlyToInterpolator(),
};

export const PROJ_OUT_VIEW_STATE = {
  longitude: -121.724611542995,
  latitude: 38.20436329728941,
  zoom: 8.054386171593723,
  minZoom: 7,
  maxZoom: 11,
  pitch: 50.85,
  bearing: 32.58,
  transitionDuration: 3000,
  transitionInterpolator: new FlyToInterpolator(),
};

export const SETT_VIEW_STATE = {
  longitude: -121.816103974157,
  latitude: 38.98693235425995,
  zoom: 9.654348182289308,
  minZoom: 7,
  maxZoom: 11,
  pitch: 50.85,
  bearing: 32.58,
  transitionDuration: 3000,
  transitionInterpolator: new FlyToInterpolator(),
};

export const PROJ_VIEW_STATE = {
  longitude: -121.80183018585,
  latitude: 38.26807071392864,
  zoom: 9.572807132250027,
  minZoom: 7,
  maxZoom: 11,
  pitch: 50.85,
  bearing: 32.58,
  transitionDuration: 3000,
  transitionInterpolator: new FlyToInterpolator(),
};

export const JUXTAPOSE_VIEW_STATE = {
  longitude: -120.732027389154,
  latitude: 37.00972667884932,
  zoom: 8.599616427840187,
  minZoom: 7,
  maxZoom: 11,
  pitch: 50.85,
  bearing: 32.58,
  transitionDuration: 3000,
  transitionInterpolator: new FlyToInterpolator(),
};

export const AMBIENT_LIGHT = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.7,
});

export const DIR_LIGHT = new SunLight({
  timestamp: Date.UTC(2019, 6, 1, 22),
  color: [255, 255, 255],
  intensity: 0.8,
  // _shadow: true
});

export const HOLDERS = {
  0: 'Settlement',
  1: 'Exchange',
  2: 'Project',
  3: 'Non-Project',
};

export const SCENARIOS = {
  0: 'bl_h000',
  1: 'CS3_ALT3_2022med_L2020ADV',
  2: 'LTO_BA_EXP1_2022MED',
};

export const SCENARIO_LABELS = {
  0: 'Scenario 1',
  1: 'Scenario 2',
  2: 'Scenario 3',
};

export function inRange(a, x, y) {
  return a >= x && a <= y;
}

export const USE_TERRAIN_3D = false;

export const LIGHTING = new LightingEffect({
  ambientLight: AMBIENT_LIGHT,
  dirLight: DIR_LIGHT,
});