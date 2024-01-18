import maplibregl from 'maplibre-gl';
import React from 'react';
import { Map } from 'react-map-gl';

import DeckGL from '@deck.gl/react';

import mapStyle from './assets/style.json';
import { LIGHTING } from './utils/settings';

import { resScale } from './utils/scales';
import * as d3 from 'd3';
import { data } from './utils/data';

const resRange = Object.keys(data).map((d) => parseInt(d));

export default function WaterDeckGL({
  layers,
  setCurRes,
  curViewState,
  getTooltip,
}) {
  return (
    <DeckGL
      onViewStateChange={({ viewState }) => {
        // optimization; only update state when resolution changes
        setCurRes(
          d3.scaleQuantize().domain([0, 1]).range(resRange)(
            resScale(viewState.zoom)
          )
        );
        // console.log(viewState);
      }}
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
