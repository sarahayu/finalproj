import * as d3 from 'd3'
import { saturate } from './utils'

export const colorInterpGW = (groundwater) => saturate(d3.interpolateGreys(
    d3.scaleLinear().domain([-250, 700]).range([0, 1])(groundwater)
).replace(/[^\d,]/g, '').split(',').map(d => Number(d)))

export const colorInterpDifference = (unmetDemand) => saturate(d3.interpolatePRGn(
    d3.scaleLinear().domain([-30, 30]).range([0, 1])(unmetDemand)
).replace(/[^\d,]/g, '').split(',').map(d => Number(d)))

export const valueInterpUnmet = d3.scaleLinear()
    .domain([-150, 0])
    .range([1, 0])
    .clamp(true)

export const valueInterpDemand = d3.scaleLinear()
    .domain([0, 150])
    .range([0, 1])
    .clamp(true)

export const dateInterpIdx = d3.scaleTime()
    .domain([new Date('10/31/1921'), new Date('9/30/2021')])
    .range([0, 1199])
    .invert