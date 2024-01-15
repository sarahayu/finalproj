import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import { OBJLoader } from '@loaders.gl/obj';
import { CompositeLayer } from 'deck.gl';
import AnimatedIconHexTileLayer from '../AnimatedIconHexTileLayer';
import IconHexTileLayer from '../IconHexTileLayer';
import SolidHexTileLayer from '../SolidHexTileLayer';
import {
  colorInterpDifference,
  colorInterpGW,
  valueInterpDemand,
  valueInterpUnmet,
} from '../utils/scales';
import { SCENARIOS, USE_TERRAIN_3D } from '../utils/settings';
import { dataFilter } from '../utils/utils';

export default class SlideEpilogue extends CompositeLayer {
  renderLayers() {
    const {
      data,
      curRes,
      slide,
      curScenario,
      speedyCounter,
      displayGW,
      displayDiff,
      displayUnmet,
      displayDemand,
      displayLandUse,
    } = this.props;
    const isEpilogue = slide >= 22;

    return [
      new SolidHexTileLayer({
        id: `GroundwaterEpilogue`,
        data,
        thicknessRange: [0, 1],
        filled: true,
        resolution: curRes,
        extruded: false,
        raised: false,
        getFillColor: (d) =>
          colorInterpGW(d.properties.Groundwater[speedyCounter]),
        visible: displayGW && isEpilogue,
        opacity: 0.2,
        ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
        pickable: true,
      }),
      new SolidHexTileLayer({
        id: `DifferenceEpilogue`,
        data,
        thicknessRange: [0.5, 0.65],
        filled: true,
        resolution: curRes,
        extruded: false,
        raised: false,
        getFillColor: (d) =>
          colorInterpDifference(
            d.properties.UnmetDemand[SCENARIOS[curScenario]][speedyCounter] -
              d.properties.UnmetDemandBaseline[speedyCounter]
          ),
        visible: displayDiff && isEpilogue,
        opacity: 1.0,
        ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
        pickable: true,
      }),
      new AnimatedIconHexTileLayer({
        id: `ScenarioUnmetEpilogue`,
        data,
        loaders: [OBJLoader],
        mesh: './src/assets/drop.obj',
        raised: true,
        extruded: false,
        resolution: curRes,
        getColor: (d) => /* colorUnmet */ [255, 130, 35],
        getValue: (d) =>
          valueInterpUnmet(
            d.properties.UnmetDemand[SCENARIOS[curScenario]][speedyCounter]
          ),
        sizeScale: 3000,
        visible: displayUnmet && isEpilogue,
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
      }),
      new AnimatedIconHexTileLayer({
        id: `ScenarioDemandEpilogue`,
        data,
        loaders: [OBJLoader],
        mesh: './src/assets/drop.obj',
        raised: true,
        extruded: false,
        resolution: curRes,
        getColor: (d) => /* colorDemand */ [255, 130, 35],
        getValue: (d) =>
          valueInterpDemand(
            d.properties.Demand[SCENARIOS[curScenario]][speedyCounter]
          ),
        sizeScale: 3000,
        visible: displayDemand && isEpilogue,
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
      }),
      new IconHexTileLayer({
        id: `SettlementIconsEpilogue`,
        data: dataFilter(data, (d) => d.LandUse[0] == 0),
        loaders: [OBJLoader],
        mesh: './src/assets/dam.obj',
        raised: false,
        resolution: curRes,
        getColor: (d) => [255, 127, 206],
        sizeScale: 0.8 * 500,
        visible: displayLandUse && isEpilogue,
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
      }),
      new IconHexTileLayer({
        id: `ExhangeIconsEpilogue`,
        data: dataFilter(data, (d) => d.LandUse[0] == 1),
        loaders: [OBJLoader],
        mesh: './src/assets/cow.obj',
        raised: false,
        resolution: curRes,
        getColor: (d) => [255, 127, 206],
        sizeScale: 0.8 * 550,
        visible: displayLandUse && isEpilogue,
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
      }),
      new IconHexTileLayer({
        id: `ProjectIconsEpilogue`,
        data: dataFilter(data, (d) => d.LandUse[0] == 2),
        loaders: [OBJLoader],
        mesh: './src/assets/project.obj',
        raised: false,
        resolution: curRes,
        getColor: (d) => [255, 127, 206],
        sizeScale: 0.8 * 180,
        visible: displayLandUse && isEpilogue,
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
      }),
      new IconHexTileLayer({
        id: `NonProjectIconsEpilogue`,
        data: dataFilter(data, (d) => d.LandUse[0] == 3),
        loaders: [OBJLoader],
        mesh: './src/assets/nonproject.obj',
        raised: false,
        resolution: curRes,
        getColor: (d) => [255, 127, 206],
        sizeScale: 0.8 * 140,
        visible: displayLandUse && isEpilogue,
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
      }),
    ];
  }
}
