import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import { OBJLoader } from '@loaders.gl/obj';
import { CompositeLayer } from 'deck.gl';
import IconHexTileLayer from '../IconHexTileLayer';
import { inRange, USE_TERRAIN_3D } from '../utils/settings';
import { dataFilter } from '../utils/utils';

export default class SlideOwners extends CompositeLayer {
  renderLayers() {
    const { data, curRes, slide, transitioning } = this.props;

    return [
      new IconHexTileLayer({
        id: `SettlementIconsLayer`,
        data: dataFilter(data, (d) => d.LandUse[0] == 0),
        loaders: [OBJLoader],
        mesh: './src/assets/dam.obj',
        raised: true,
        getElevation: !transitioning && inRange(slide, 11, 11) ? 2000 : 0,

        getColor: [255, 127, 206],
        sizeScale: 0.8 * 500,
        visible: inRange(slide, 9, 13),
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
        pickable: true,
        updateTriggers: {
          getElevation: [slide, transitioning],
        },
      }),
      new IconHexTileLayer({
        id: `ExhangeIconsLayer`,
        data: dataFilter(data, (d) => d.LandUse[0] == 1),
        loaders: [OBJLoader],
        mesh: './src/assets/cow.obj',
        raised: true,
        getElevation: !transitioning && inRange(slide, 9, 9) ? 2000 : 0,

        getColor: [255, 127, 206],
        sizeScale: 0.8 * 550,
        visible: inRange(slide, 9, 13),
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
        pickable: true,
        updateTriggers: {
          getElevation: [slide, transitioning],
        },
      }),
      new IconHexTileLayer({
        id: `ProjectIconsLayer`,
        data: dataFilter(data, (d) => d.LandUse[0] == 2),
        loaders: [OBJLoader],
        mesh: './src/assets/project.obj',
        raised: true,
        getElevation: !transitioning && inRange(slide, 10, 10) ? 2000 : 0,

        getColor: [255, 127, 206],
        sizeScale: 0.8 * 180,
        visible: inRange(slide, 9, 13),
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
        pickable: true,
        updateTriggers: {
          getElevation: [slide, transitioning],
        },
      }),
      new IconHexTileLayer({
        id: `NonProjectIconsLayer`,
        data: dataFilter(data, (d) => d.LandUse[0] == 3),
        loaders: [OBJLoader],
        mesh: './src/assets/nonproject.obj',
        raised: true,
        getElevation: 0,

        getColor: [255, 127, 206],
        sizeScale: 0.8 * 140,
        visible: inRange(slide, 9, 13),
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
        pickable: true,
        updateTriggers: {
          getElevation: [slide, transitioning],
        },
      }),
    ];
  }
}

SlideOwners.layerName = 'SlideOwners';
