import React, { useCallback, useEffect, useRef, useState } from 'react';
import { colorDemand, colorGW, dateInterpIdx } from './utils/scales';
import * as d3 from 'd3';
import averageData from './assets/averages.json';
import { saturate } from './utils/utils';

const gwUnsat = saturate({
  col: colorGW,
  saturation: 0.5,
});
const gwSat = saturate({
  col: colorGW,
  saturation: 0.5,
  brightness: 0.5,
});
const demandUnsat = saturate({
  col: colorDemand,
  saturation: 0.5,
});
const demandSat = saturate({
  col: colorDemand,
  saturation: 0.5,
  brightness: 0.5,
});

export default function Clock({ counter, displayMonth, dataset }) {
  const monthIdx = ((counter + 9) % 12) + 1;
  const avgDataByYr = useRef();

  useEffect(() => {
    avgDataByYr.current = Object.groupBy(averageData[dataset], (_, i) =>
      dateInterpIdx(i).toLocaleString('default', { year: 'numeric' })
    );
  }, [dataset]);

  const radScale = d3
    .scaleLinear()
    .domain([0, d3.max(averageData[dataset], (d) => d)])
    .range([40, 90]);
  const monthScale = d3
    .scaleLinear()
    .domain([1, 12])
    .range([0, 2 * Math.PI]);
  const radial = d3
    .lineRadial()
    .radius((d) => radScale(d))
    .curve(d3.curveCatmullRom)
    .angle((_, i) => monthScale(((i + 9) % 12) + 1));
  const radialMonth = d3
    .lineRadial()
    .radius((d) => radScale(d))
    .curve(d3.curveCatmullRom)
    .angle((_, i) => monthScale((i % 12) + 1));

  useEffect(() => {
    d3.select('#clockContainer').style('visibility', 'visible');

    d3.select('#pieOutline path')
      .attr(
        'd',
        d3
          .arc()
          .innerRadius(40)
          .outerRadius(90)
          .startAngle(0)
          .endAngle(Math.PI * 2)
      )
      .attr('fill', 'none')
      .attr(
        'stroke',
        dataset == 'averageGroundwater'
          ? `rgb(${gwUnsat})`
          : `rgba(${demandUnsat}, 1)`
      );
    d3.select('#demandLine path')
      .data([averageData[dataset]])
      .join('path')
      .attr('d', (avgs) => radial(avgs))
      .attr(
        'stroke',
        dataset == 'averageGroundwater'
          ? `rgba(${gwSat}, 0.3)`
          : `rgba(${demandSat}, 0.3)`
      )
      .attr('stroke-width', '0.2')
      .attr('fill', 'none');

    return function () {
      d3.select('#clockContainer').style('visibility', 'hidden');
      d3.select('#pie path').attr('d', '');
      d3.select('#pieOutline path').attr('d', '');
      d3.select('#demandLine path').attr('d', '');
      d3.select('#demandLineCur path').attr('d', '');
      d3.select('#date').text('');
    };
  }, [dataset]);

  useEffect(() => {
    d3.select('#pie path')
      .attr(
        'd',
        d3
          .arc()
          .innerRadius(40)
          .outerRadius(90)
          .startAngle(0)
          .endAngle(((Math.PI * monthIdx) / 12) * 2)
      )
      .attr(
        'fill',
        dataset == 'averageGroundwater'
          ? `rgb(${gwUnsat})`
          : `rgba(${demandUnsat}, 1)`
      );
    let date = dateInterpIdx(counter);
    if (displayMonth)
      d3.select('#date').html(
        '<b>' +
          date.toLocaleString('default', { year: 'numeric' }) +
          '</b><br/>' +
          date.toLocaleString('default', { month: 'long' })
      );
    else
      d3.select('#date').html(
        '<b>' + date.toLocaleString('default', { year: 'numeric' }) + '</b>'
      );

    d3.selectAll('#demandLineCur path')
      .data([
        avgDataByYr.current[
          dateInterpIdx(counter).toLocaleString('default', { year: 'numeric' })
        ],
      ])
      .join('path')
      .attr('d', (avgs) => radialMonth(avgs))
      .attr(
        'stroke',
        dataset == 'averageGroundwater'
          ? `rgba(${gwSat}, 1)`
          : `rgba(${demandSat}, 1)`
      )
      .attr('stroke-width', '2')
      .attr('fill', 'none');
  }, [dataset, counter]);
}
