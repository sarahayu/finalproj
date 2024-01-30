import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import { OBJLoader } from '@loaders.gl/obj';
import { CompositeLayer } from 'deck.gl';
import IconHexTileLayer from '../IconHexTileLayer';
import { valueInterpDemand } from '../utils/scales';
import { USE_TERRAIN_3D } from '../utils/settings';

export default class SlideDemandIntro extends CompositeLayer {
  renderLayers() {
    const { data, curRes, slide, counter } = this.props;

    return [
      new IconHexTileLayer({
        id: `DemandIcons`,
        data,
        loaders: [OBJLoader],
        mesh: './src/assets/drop.obj',
        raised: true,
        extruded: false,

        getColor: (d) => /* colorDemand */ [255, 130, 35],
        getValue: (d) =>
          valueInterpDemand(d.properties.DemandBaseline[counter]),
        sizeScale: 3000,
        visible: slide == 1,
        opacity: 1,
        ...(USE_TERRAIN_3D
          ? {
              extensions: [
                new TerrainExtension({
                  terrainDrawMode: 'offset',
                }),
              ],
            }
          : {}),
        // pickable: true,
        updateTriggers: {
          getTranslation: [counter],
        },
      }),
    ];
  }
}

SlideDemandIntro.layerName = 'SlideDemandIntro';
