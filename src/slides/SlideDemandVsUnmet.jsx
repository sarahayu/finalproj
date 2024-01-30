import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import { OBJLoader } from '@loaders.gl/obj';
import { CompositeLayer } from 'deck.gl';
import AnimatedIconHexTileLayer from '../AnimatedIconHexTileLayer';
import SolidHexTileLayer from '../SolidHexTileLayer';
import {
  colorInterpGW,
  valueInterpDemand,
  valueInterpUnmet,
} from '../utils/scales';
import { inRange, USE_TERRAIN_3D } from '../utils/settings';

export default class SlideDemandVsUnmet extends CompositeLayer {
  renderLayers() {
    const { data, curRes, slide, counter } = this.props;

    return [
      new SolidHexTileLayer({
        id: `GroundwaterLayer`,
        data,
        thicknessRange: [0, 1],
        filled: true,

        extruded: false,
        raised: false,
        getFillColor: (d) =>
          colorInterpGW(
            d.properties.Groundwater[
              slide <= 2 ? counter : slide <= 4 ? 1026 : 1197
            ]
          ),
        visible: inRange(slide, 1, 6),
        opacity: slide >= 2 ? 0.2 : 0,
        transitions: {
          opacity: 250,
        },
        // pickable: true,
        ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
        updateTriggers: {
          getFillColor: [counter, slide],
        },
      }),
      new AnimatedIconHexTileLayer({
        id: `UnmetDemandIcons1`,
        data,
        loaders: [OBJLoader],
        mesh: './src/assets/drop.obj',
        raised: true,
        extruded: false,

        getColor: inRange(slide, 2, 3)
          ? (d) => /* colorDemand */ [255, 130, 35]
          : (d) => /* colorUnmet */ [255, 130, 35],
        getValue:
          slide == 2 || slide == 5
            ? (d) => 0
            : slide == 3
            ? (d) => valueInterpDemand(d.properties.DemandBaseline[1026])
            : (d) => valueInterpUnmet(d.properties.UnmetDemandBaseline[1026]),
        sizeScale: 3000,
        visible: inRange(slide, 2, 5),
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
      }),
      new AnimatedIconHexTileLayer({
        id: `UnmetDemandIcons2`,
        data,
        loaders: [OBJLoader],
        mesh: './src/assets/drop.obj',
        raised: true,
        extruded: false,

        getColor: inRange(slide, 4, 5)
          ? (d) => /* colorDemand */ [255, 130, 35]
          : (d) => /* colorUnmet */ [255, 130, 35],
        getValue:
          slide == 4 || slide == 7
            ? (d) => 0
            : slide == 5
            ? (d) => valueInterpDemand(d.properties.DemandBaseline[1197])
            : (d) => valueInterpUnmet(d.properties.UnmetDemandBaseline[1197]),
        sizeScale: 3000,
        visible: inRange(slide, 4, 7),
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
      }),
    ];
  }
}

SlideDemandVsUnmet.layerName = 'SlideDemandVsUnmet';
