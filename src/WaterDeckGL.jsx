import maplibregl from 'maplibre-gl';
import React from 'react';
import { Map } from 'react-map-gl';

import DeckGL from '@deck.gl/react';

import mapStyle from './assets/style.json';
import { LIGHTING } from './utils/settings';

export default function WaterDeckGL({ layers, curViewState, getTooltip }) {
  return (
    <DeckGL
      layers={layers}
      effects={[LIGHTING]}
      initialViewState={curViewState}
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
  );
}
