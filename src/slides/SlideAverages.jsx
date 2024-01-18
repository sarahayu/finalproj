import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import { CompositeLayer } from 'deck.gl';
import SolidHexTileLayer from '../SolidHexTileLayer';
import { colorInterpDemand, colorInterpUnmet } from '../utils/scales';
import { inRange, USE_TERRAIN_3D } from '../utils/settings';

export default class SlideAverages extends CompositeLayer {
  renderLayers() {
    const { data, curRes, slide, transitioning } = this.props;

    return [
      new SolidHexTileLayer({
        id: `AverageDemand`,
        data,
        thicknessRange: [0, 1],
        filled: true,
        curRes: curRes,
        extruded: true,
        getElevation: (d) =>
          !transitioning &&
          ((inRange(slide, 9, 9) && d.properties.LandUse[0] == 1) ||
            (inRange(slide, 10, 10) && d.properties.LandUse[0] == 2) ||
            (inRange(slide, 11, 11) && d.properties.LandUse[0] == 0))
            ? 2000
            : 0,
        raised: false,
        getFillColor: (d) =>
          colorInterpDemand(d.properties.DemandBaselineAverage),
        visible: inRange(slide, 6, 11),
        opacity: slide >= 7 ? 1.0 : 0,
        transitions: {
          opacity: 250,
        },
        ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
        pickable: true,
      }),
      new SolidHexTileLayer({
        id: `AverageUnmetDemand`,
        data,
        thicknessRange: [0.5, 0.65],
        filled: true,
        curRes: curRes,
        extruded: true,
        getElevation: (d) =>
          !transitioning &&
          ((inRange(slide, 9, 9) && d.properties.LandUse[0] == 1) ||
            (inRange(slide, 10, 10) && d.properties.LandUse[0] == 2) ||
            (inRange(slide, 11, 11) && d.properties.LandUse[0] == 0))
            ? 2000
            : 0,
        raised: false,
        getFillColor: (d) =>
          colorInterpUnmet(d.properties.UnmetDemandBaselineAverage),
        visible: inRange(slide, 6, 11),
        opacity: slide >= 7 ? 1 : 0,
        transitions: {
          opacity: 250,
        },
        ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
        pickable: true,
      }),
    ];
  }
}

SlideAverages.layerName = 'SlideAverages';
