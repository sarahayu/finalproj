import { CompositeLayer, SolidPolygonLayer } from 'deck.gl';
import * as d3 from 'd3';
import * as h3 from 'h3-js';
import { lerp } from '@math.gl/core';
import { resScale } from '../utils/scales';

function scaleBounds(hexId, paths, value = 1) {
  // if(!outside) return

  // get center and distance to lerp from
  const dist = value;
  const [centerLat, centerLng] = h3.cellToLatLng(hexId);

  // lerp each vertex
  let scaledPaths = paths.map((v) => {
    let v1Lng = lerp(centerLng, v[0], dist);
    let v1Lat = lerp(centerLat, v[1], dist);

    return [v1Lng, v1Lat];
  });

  return scaledPaths;
}

function calcPolyBorder(hexId, [thicknessMin, thicknessMax]) {
  // calc hexagonal tile outline boundary
  let bounds = h3.cellToBoundary(hexId).map((p) => [p[1], p[0]]);

  // scale bounds and create polygons
  let scaledBoundsOuter = scaleBounds(hexId, bounds, thicknessMax);
  let scaledBoundsInner = scaleBounds(hexId, bounds, thicknessMin);
  // let borderPolygons = createBorderPolygons(scaledBoundsOuter, scaledBoundsInner)

  return [scaledBoundsOuter, scaledBoundsInner];
}

export default class SolidHexTileLayer extends CompositeLayer {
  initializeState() {
    super.initializeState();

    const resRange = Object.keys(this.props.data).map((d) => parseInt(d));
    const lastResolution = d3.scaleQuantize().domain([0, 1]).range(resRange)(
      resScale(this.context.viewport.zoom)
    );

    this.setState({
      ...this.state,
      resRange,
      lastResolution,
    });

    this.createPolygons();
  }

  createPolygons() {
    console.log('updating SolidHexTile polygons');
    const { lastResolution } = this.state;

    const polygons = [];

    const resHex = this.props.data[lastResolution];

    Object.keys(resHex).forEach((hexId, i) => {
      let properts = resHex[hexId];

      let tilePolygon = calcPolyBorder(hexId, [
        this.props.getValue
          ? 1 - this.props.getValue({ properties: properts })
          : this.props.thicknessRange[0],
        this.props.thicknessRange[1],
      ]);

      if (this.props.raised)
        polygons.push({
          polygon: tilePolygon.map((hexPoints) =>
            hexPoints.map(([x, y]) => [
              x,
              y,
              typeof this.props.getElevation === 'function'
                ? this.props.getElevation({ properties: properts })
                : this.props.getElevation,
            ])
          ),
          properties: properts,
        });
      else
        polygons.push({
          polygon: tilePolygon,
          properties: properts,
        });
    });

    this.setState({
      ...this.state,
      polygons,
    });
  }

  shouldUpdateState({ changeFlags }) {
    return changeFlags.somethingChanged;
  }

  updateState(params) {
    const { resRange, lastResolution } = this.state;
    const { props, oldProps, changeFlags, context } = params;
    // const sup = super.shouldUpdateState(params);

    if (
      props.getElevation != oldProps.getElevation ||
      changeFlags.viewportChanged
    ) {
      const curRes = d3.scaleQuantize().domain([0, 1]).range(resRange)(
        resScale(context.viewport.zoom)
      );

      if (
        curRes != lastResolution ||
        props.getElevation != oldProps.getElevation
      ) {
        this.setState({
          ...this.state,
          lastResolution: curRes,
        });
        this.createPolygons();
      }
    }
  }

  renderLayers() {
    return [
      new SolidPolygonLayer({
        id: `${this.props.id}SolidHexTileLayer`,
        data: this.state.polygons,
        getPolygon: (d) => d.polygon,
        filled: this.props.filled,
        wireframe: this.props.wireframe,
        extruded: this.props.extruded,
        getFillColor: this.props.getFillColor,
        getElevation: this.props.getElevation,
        getLineColor: this.props.getLineColor,
        getLineWidth: this.props.getLineWidth,
        opacity: this.props.opacity,
        updateTriggers: this.props.updateTriggers,
        extensions: this.props.extensions,
        transitions: this.props.transitions,
        pickable: this.props.pickable,
        autoHighlight: this.props.autoHighlight,
        highlightColor: this.props.highlightColor,
        // parameters: {cull: true},
      }),
    ];
  }
}

SolidHexTileLayer.layerName = 'SolidHexTileLayer';
SolidHexTileLayer.defaultProps = {
  ...CompositeLayer.defaultProps,
  ...SolidPolygonLayer.defaultProps,
  thicknessRange: [0.7, 0.9],
  getValue: undefined,
};
