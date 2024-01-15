import { BitmapLayer, CompositeLayer, TileLayer } from 'deck.gl';
import { USE_TERRAIN_3D } from '../utils/settings';

export default class SlideTerrain extends CompositeLayer {
  renderLayers() {
    return [
      ...(!USE_TERRAIN_3D
        ? [
            new TileLayer({
              data: 'https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.png',

              minZoom: 7,
              maxZoom: 11,
              tileSize: 256,

              renderSubLayers: (props) => {
                const {
                  bbox: { west, south, east, north },
                } = props.tile;

                return new BitmapLayer(props, {
                  data: null,
                  image: props.data,
                  bounds: [west, south, east, north],
                });
              },
            }),
          ]
        : []),
      ...(USE_TERRAIN_3D
        ? [
            new TerrainLayer({
              id: 'terrain',
              minZoom: 7,
              maxZoom: 11,
              strategy: 'no-overlap',
              elevationDecoder: {
                rScaler: 5 * 256,
                gScaler: 5 * 1,
                bScaler: (5 * 1) / 256,
                offset: 5 * -32768,
              },
              elevationData: `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`,
              texture: `https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.png`,
              operation: 'terrain+draw',
            }),
          ]
        : []),
    ];
  }
}
