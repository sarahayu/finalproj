import * as d3 from 'd3';
import { saturate } from './utils';

export const colorInterpGW = (groundwater) => saturate(d3.interpolateBlues(
    d3.scaleLinear().domain([-250, 700]).range([0, 1])(groundwater)
).replace(/[^\d,]/g, '').split(',').map(d => Number(d)))

export const colorInterpDifference = (unmetDemand) => saturate(d3.interpolatePRGn(
    d3.scaleLinear().domain([-30, 30]).range([0, 1])(unmetDemand)
).replace(/[^\d,]/g, '').split(',').map(d => Number(d)))

export const valueInterp = d3.scaleLinear()
    .domain([-150, 0])
    .range([1, 0])
    .clamp(true)

export const valueInterp2 = d3.scaleLinear()
    .domain([0, 150])
    .range([0, 1])
    .clamp(true)