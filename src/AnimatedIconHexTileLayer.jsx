import * as d3 from 'd3';
import { CompositeLayer, SimpleMeshLayer } from 'deck.gl';
import * as h3 from 'h3-js';
import { valueInterpDemand } from './utils/scales';
import { FORMATIONS, INTERIM_FORMATIONS } from './utils/utils';

const formationInterp = d3
  .scaleQuantize()
  .domain([0, 1])
  .range(d3.range(0, FORMATIONS.length));

export default class AnimatedIconHexTileLayer extends CompositeLayer {
  initializeState() {
    super.initializeState();
    this.setState({
      hextiles: this.props.data,
      resRange: Object.keys(this.props.data).map((d) => parseInt(d)),
      transitioning: false,
      prevGetValueFn: null,
    });
  }

  renderLayers() {
    if (!this.props.visible) return;
    let { hextiles, transitioning, prevGetValueFn, resRange } = this.state;

    if (prevGetValueFn === null) {
      this.setState(
        Object.assign(this.state, {
          prevGetValueFn: this.props.getValue,
        })
      );
    } else if (prevGetValueFn !== this.props.getValue && !transitioning) {
      this.setState(
        Object.assign(this.state, {
          transitioning: true,
        })
      );

      transitioning = true;

      setTimeout(() => {
        this.setState(
          Object.assign(this.state, {
            transitioning: false,
            prevGetValueFn: this.props.getValue,
          })
        );
      }, 300);
    }

    if (!hextiles) return;

    let data = [];

    // let curRes = d3.scaleQuantize()
    //     .domain([0, 1])
    //     .range(resRange)(this.props.resolution)

    // console.log(resIdx)

    let resHex = hextiles[this.props.curRes];
    const edgeLen =
      (h3.getHexagonEdgeLengthAvg(this.props.curRes, h3.UNITS.km) / 250) * 1.75;
    let iconScale =
      h3.getHexagonEdgeLengthAvg(this.props.curRes, h3.UNITS.km) /
      h3.getHexagonEdgeLengthAvg(5, h3.UNITS.km);

    // console.log(iconScale)

    Object.keys(resHex).forEach((hexID) => {
      let properties = resHex[hexID];

      const [y, x] = h3.cellToLatLng(hexID);

      const id = this.props.getValue
        ? formationInterp(this.props.getValue({ properties }))
        : 1;

      for (let [dx, dy, dz] of this.props.getValue
        ? transitioning
          ? INTERIM_FORMATIONS[formationInterp(prevGetValueFn({ properties }))][
              id
            ]
          : FORMATIONS[id]
        : [[0, 0, 0]]) {
        let [ddx, ddy] = this.props.offset;
        data.push({
          position: [
            x + dx * edgeLen + ddx * edgeLen,
            y + dy * edgeLen + ddy * edgeLen,
            this.props.getElevation({ properties }) + dz * 10000,
          ],
          properties,
        });
      }
    });

    return [
      new SimpleMeshLayer({
        id: `${this.props.id}AnimatedIconHexTileLayer`,
        data,
        getPosition: (d) => d.position,

        mesh: this.props.mesh,
        texture: this.props.texture,
        sizeScale: this.props.sizeScale * iconScale,
        wireframe: this.props.wireframe,
        material: this.props.material,
        getColor: this.props.getColor,
        getOrientation: this.props.getOrientation,
        getScale: this.props.getScale,
        getTranslation: this.props.getTranslation,
        getTransformMatrix: this.props.getTransformMatrix,
        textureParameters: this.props.textureParameters,

        /* props inherited from Layer class */

        autoHighlight: this.props.autoHighlight,
        coordinateOrigin: this.props.coordinateOrigin,
        coordinateSystem: this.props.coordinateSystem,
        highlightColor: this.props.highlightColor,
        loaders: this.props.loaders,
        modelMatrix: this.props.modelMatrix,
        opacity: this.props.opacity,
        pickable: this.props.pickable,
        visible: this.props.visible,
        wrapLongitude: this.props.wrapLongitude,
        updateTriggers: this.props.updateTriggers,
        extensions: this.props.extensions,
        transitions: this.props.transitions,
      }),
    ];
  }
}

AnimatedIconHexTileLayer.layerName = 'AnimatedIconHexTileLayer';
AnimatedIconHexTileLayer.defaultProps = {
  ...CompositeLayer.defaultProps,
  ...SimpleMeshLayer.defaultProps,
  thicknessRange: [0.7, 0.9],
  resolution: 0,
  getValue: undefined,
  getElevation: () => 0,
  offset: [0, 0],
  transitions: {
    getPosition: {
      duration: 300,
      easing: d3.easeBackOut.overshoot(2),
    },
    getColor: {
      duration: 300,
      easing: d3.easeBackOut.overshoot(2),
    },
  },
};
