import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import { OBJLoader } from '@loaders.gl/obj';
import { CompositeLayer } from 'deck.gl';
import AnimatedIconHexTileLayer from '../AnimatedIconHexTileLayer';
import SolidHexTileLayer from '../SolidHexTileLayer';
import {
  colorInterpDifference,
  colorInterpGW,
  valueInterpUnmet,
} from '../utils/scales';
import { inRange, SCENARIOS, USE_TERRAIN_3D } from '../utils/settings';

export default class SlideScenarioExplanations extends CompositeLayer {
  renderLayers() {
    const { data, curRes, slide, curScenario, cycler } = this.props;

    return [
      new SolidHexTileLayer({
        id: `GroundwaterAgainTimed`,
        data,
        thicknessRange: [0, 1],
        filled: true,

        extruded: false,
        raised: false,
        getFillColor: (d) =>
          colorInterpGW(
            d.properties.Groundwater[
              inRange(slide, 13, 19)
                ? 1026
                : slide == 20
                ? 1197
                : ((Math.floor(cycler / 3) * 67) % 1199) + 1
            ]
          ),
        visible: inRange(slide, 13, 21),
        opacity: inRange(slide, 14, 21) ? 0.2 : 0,
        transitions: {
          opacity: 250,
        },
        ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
        pickable: true,
      }),
      new AnimatedIconHexTileLayer({
        id: `ScenarioUnmet`,
        data,
        loaders: [OBJLoader],
        mesh: './src/assets/drop.obj',
        raised: true,
        extruded: false,

        getColor: (d) => /* colorUnmet */ [255, 130, 35],
        getValue:
          slide == 13
            ? (d) => 0
            : slide == 14
            ? (d) => valueInterpUnmet(d.properties.UnmetDemandBaseline[1026])
            : (d) =>
                valueInterpUnmet(
                  d.properties.UnmetDemand[SCENARIOS[curScenario]][1026]
                ),
        sizeScale: 3000,
        visible: inRange(slide, 13, 19),
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
      new SolidHexTileLayer({
        id: `DifferenceLayer`,
        data,
        thicknessRange: [0.5, 0.65],
        filled: true,

        extruded: false,
        raised: false,
        getFillColor: (d) =>
          colorInterpDifference(
            d.properties.UnmetDemand[SCENARIOS[curScenario]][1026] -
              d.properties.UnmetDemandBaseline[1026]
          ),
        visible: inRange(slide, 15, 19),
        opacity: inRange(slide, 16, 19) ? 1.0 : 0,
        transitions: {
          opacity: 250,
        },
        ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
        pickable: true,
      }),
      new AnimatedIconHexTileLayer({
        id: `ScenarioUnmet1197`,
        data,
        loaders: [OBJLoader],
        mesh: './src/assets/drop.obj',
        raised: true,
        extruded: false,

        getColor: (d) => /* colorUnmet */ [255, 130, 35],
        getValue: (d) =>
          valueInterpUnmet(
            d.properties.UnmetDemand[SCENARIOS[cycler % 3]][1197]
          ),
        sizeScale: 3000,
        visible: inRange(slide, 20, 20),
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
      new SolidHexTileLayer({
        id: `DifferenceLayer1197`,
        data,
        thicknessRange: [0.5, 0.65],
        filled: true,

        extruded: false,
        raised: false,
        getFillColor: (d) =>
          colorInterpDifference(
            d.properties.UnmetDemand[SCENARIOS[cycler % 3]][1197] -
              d.properties.UnmetDemandBaseline[1197]
          ),
        visible: inRange(slide, 19, 20),
        opacity: inRange(slide, 20, 20) ? 1.0 : 0,
        transitions: {
          opacity: 250,
        },
        ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
        pickable: true,
      }),
    ];
  }
}

SlideScenarioExplanations.layerName = 'SlideScenarioExplanations';
