import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import { CompositeLayer } from 'deck.gl';
import SolidHexTileLayer from '../SolidHexTileLayer';
import { colorInterpDiffDemand, colorInterpGW } from '../utils/scales';
import { inRange, USE_TERRAIN_3D } from '../utils/settings';

export default class SlideDeliveries extends CompositeLayer {
  renderLayers() {
    const { data, curRes, slide } = this.props;

    return [
      new SolidHexTileLayer({
        id: `GroundwaterAgainLayer`,
        data,
        thicknessRange: [0, 1],
        filled: true,
        resolution: curRes,
        extruded: false,
        raised: false,
        getFillColor: (d) => colorInterpGW(d.properties.GroundwaterAverage),
        visible: inRange(slide, 12, 13),
        opacity: inRange(slide, 13, 13) ? 0.2 : 0,
        transitions: {
          opacity: 250,
        },
        ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
        pickable: true,
      }),
      new SolidHexTileLayer({
        id: `DeliveryWaterLayer`,
        data,
        thicknessRange: [0.5, 0.65],
        filled: true,
        resolution: curRes,
        extruded: false,
        raised: false,
        getFillColor: (d) =>
          colorInterpDiffDemand(
            d.properties.DemandBaselineAverage +
              d.properties.UnmetDemandBaselineAverage
          ),
        visible: inRange(slide, 11, 13),
        opacity: inRange(slide, 12, 13) ? 1 : 0,
        transitions: {
          opacity: 250,
        },
        ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
        pickable: true,
      }),
    ];
  }
}
