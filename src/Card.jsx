import React from 'react';
import {
  colorDemand,
  colorDiffHigh,
  colorDiffLow,
  colorUnmet,
} from './utils/scales';

const TEXT = {
  0: `This is California’s <b>Central Valley</b>, home to over 7 million people and 18% of California’s total population. (2020 US Census)`,
  1: `We have lots of demand that tends to cycle through highs and lows depending on the time of the year, peaking at around July. Each drop that you see represents a unit of <b>demand</b> for water.`,
  2: `However, our groundwater supply stays consistent throughout the year, and usually cannot keep up during peak demands.`,
  3: `This leads to unmet demand. For example, take May 2007. This is the demand of that month.`,
  4: `As you can see, not everyone will get their demand. Notice anything?`,
  5: `Let’s try another timestep. This is water demand from July 2021.`,
  6: `This is unmet demand.`,
  7: `This is the average over 100 years. We can see that the areas of <b style="color: rgb(${colorUnmet});">unmet demand</b> does not necessarily correspond with areas of <b style="color: rgb(${colorDemand});">demand</b>.`,
  8: `If we take a closer look at this region, we can investigate what might have contributed to this inequity.`,
  9: `If we overlay the map with land holders, we can see that exchange holders, symbolized with cows, are the ones predominantly demanding high amounts of <b style="color: rgb(${colorDemand});">demand</b>. However, they aren’t suffering from as high <b style="color: rgb(${colorUnmet});">unmet demand</b>. In fact, they seem to be doing quite well.`,
  10: `What we should expect is more of the following. Here, a patch of land held by project holders are symbolized with a paper scroll. This area contends with high levels of <b style="color: rgb(${colorUnmet});">unmet demand</b>; this is expected, since it has high levels of <b style="color: rgb(${colorDemand});">demand</b>.`,
  11: `On the other hand, settlement holders are similar to exchange holders in that they also historically have <b style="color: rgb(${colorDemand});">high demand</b>, but get special treatment as well.`,
  12: `In fact, we can see on average, settlement and exchange land holders get higher water delivery rates because they are higher priority; this is how they are able to maintain low average levels of unmet demand even though they have high average levels of demand.`,
  13: `And this does not necessarily correspond to groundwater supply.`,
  14: `Thus, we can see that due to certain government policies, certain regions get higher priority and access to water supply, even if their demand largely outweigh surrounding regions. The question is, is this the only option?`,
  15: `Certainly not. That is where CalSim comes in, a simulation program that plays out the “what-if” scenarios. Imagine an alternate universe where government policies were different; we’ll call this Scenario 1. Let us revisit the first time step from earlier, May 2007.`,
  16: `This time, the rings indicate regions that are doing <b style="color: rgb(${colorDiffHigh});">better</b> or <b style="color: rgb(${colorDiffLow});">worse</b> than real-life, or historical, baselines.`,
  17: `Notice that now in this region, unmet demand is now more equal across regions, at the cost of some regions doing better than historical levels and other regions doing worse than historical levels.`,
  18: `What about another alternate scenario, Scenario 2? We can see that this scenario favors less equal distribution of unmet demand at the tradeoff of keeping levels closer to baseline historical level.`,
  19: `Scenario 3 is somewhere in between.`,
  20: `Here’s a timestep with more dramatic differences between scenarios, July 2021.`,
  21: `As you may have noticed, rarely is there a situation where everyone wins. Tradeoffs must be made between regions, if not between months, and who and when to save water. With climate change and increasing population in the Central Valley, these choices become all the more pertinent. Which scenario is best? That choice is up to <b>you</b>.<br/><i>Data from James Gilbert (NOAA)</i>`,
};

const TEXT_LEN = Object.values(TEXT).length;

export default function Card({ slide, transitioning }) {
  if (transitioning || slide >= 22) return;

  return (
    <div className="cardContainer">
      <p
        className="cardP"
        dangerouslySetInnerHTML={{ __html: TEXT[slide % TEXT_LEN] }}
      ></p>
    </div>
  );
}
