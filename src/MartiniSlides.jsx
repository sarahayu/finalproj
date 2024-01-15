import { CompositeLayer } from 'deck.gl';

import SlideAverages from './slides/SlideAverages';
import SlideDeliveries from './slides/SlideDeliveries';
import SlideDemandIntro from './slides/SlideDemandIntro';
import SlideDemandVsUnmet from './slides/SlideDemandVsUnmet';
import SlideEndRandomized from './slides/SlideEndRandomized';
import SlideOwners from './slides/SlideOwners';
import SlideScenarioExplanations from './slides/SlideScenarioExplanations';
import SlideTerrain from './slides/SlideTerrain';

export default class MartiniSlides extends CompositeLayer {
  renderLayers() {
    return [
      new SlideTerrain(this.props),
      new SlideDemandIntro(this.props),
      new SlideDemandVsUnmet(this.props),
      new SlideAverages(this.props),
      new SlideOwners(this.props),
      new SlideDeliveries(this.props),
      new SlideScenarioExplanations(this.props),
      new SlideEndRandomized(this.props),
    ];
  }
}
