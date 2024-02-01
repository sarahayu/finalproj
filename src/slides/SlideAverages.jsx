import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';
import { CompositeLayer } from 'deck.gl';
import SolidHexTileLayer from '../hextile/SolidHexTileLayer';
import { colorInterpDemand, colorInterpUnmet } from '../utils/scales';
import { inRange, USE_TERRAIN_3D } from '../utils/settings';

export default class SlideAverages extends CompositeLayer {
  initializeState() {
    super.initializeState();

    this.setState({
      getElevationFn: (d) =>
        !this.props.transitioning &&
        ((inRange(this.props.slide, 9, 9) && d.properties.LandUse[0] == 1) ||
          (inRange(this.props.slide, 10, 10) && d.properties.LandUse[0] == 2) ||
          (inRange(this.props.slide, 11, 11) && d.properties.LandUse[0] == 0))
          ? 2000
          : 0,
    });
  }
  updateState(params) {
    const { props, oldProps, changeFlags, context } = params;

    if (
      props.transitioning != oldProps.transitioning ||
      props.slide != oldProps.slide
    ) {
      this.setState({
        getElevationFn: (d) =>
          !props.transitioning &&
          ((inRange(props.slide, 9, 9) && d.properties.LandUse[0] == 1) ||
            (inRange(props.slide, 10, 10) && d.properties.LandUse[0] == 2) ||
            (inRange(props.slide, 11, 11) && d.properties.LandUse[0] == 0))
            ? 2000
            : 0,
      });
    }
  }
  renderLayers() {
    const { data, curRes, slide, transitioning } = this.props;

    return [
      new SolidHexTileLayer({
        id: `AverageDemand`,
        data,
        thicknessRange: [0, 1],
        filled: true,

        extruded: true,
        getElevation: this.state.getElevationFn,
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
        autoHighlight: true,
        updateTriggers: {
          getElevation: [slide, transitioning],
        },
      }),
      new SolidHexTileLayer({
        id: `AverageUnmetDemand`,
        data,
        thicknessRange: [0.5, 0.65],
        filled: true,

        extruded: true,
        getElevation: this.state.getElevationFn,
        raised: false,
        getFillColor: (d) =>
          colorInterpUnmet(d.properties.UnmetDemandBaselineAverage),
        visible: inRange(slide, 6, 11),
        opacity: slide >= 7 ? 1 : 0,
        transitions: {
          opacity: 250,
        },
        ...(USE_TERRAIN_3D ? { extensions: [new TerrainExtension()] } : {}),
        // pickable: true,
        // autoHighlight: true,
        updateTriggers: {
          getElevation: [slide, transitioning],
        },
      }),
    ];
  }
}

SlideAverages.layerName = 'SlideAverages';
