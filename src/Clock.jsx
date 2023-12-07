import React, { useEffect } from 'react'
import { dateInterpIdx } from './utils/scales'
import * as d3 from 'd3'
import averageData from './assets/averages.json'

export default function Clock({ counter, displayMonth, dataset }) {

    const monthIdx = (((counter + 9) % 12) + 1)
    const radScale = d3.scaleLinear()
        .domain([0, d3.max(averageData[dataset], d => d)])
        .range([40, 90])
    const monthScale = d3
        .scaleLinear()
        .domain([1, 12])
        .range([0, 2 * Math.PI])
    const radial = d3.lineRadial()
        .radius(d => radScale(d))
        .curve(d3.curveCatmullRom)
        .angle((_, i) => monthScale((((i + 9) % 12) + 1)))
    const radialMonth = d3.lineRadial()
        .radius(d => radScale(d))
        .curve(d3.curveCatmullRom)
        .angle((_, i) => monthScale((((i) % 12) + 1)))
        
    useEffect(() => {
        d3.select("#pieOutline path")
            .attr("d", d3.arc()
                .innerRadius(40)
                .outerRadius(90)
                .startAngle(0)
                .endAngle(Math.PI * 2))
            .attr("fill", "none")
            .attr("stroke", "rgba(255, 205, 178, 1)")
        d3.select("#demandLine path")
            .data([averageData[dataset]])
            .join("path")
            .attr("d", avgs => radial(avgs))
            .attr("stroke", "rgba(178, 108, 71, 0.3)")
            .attr("stroke-width", "0.2")
            .attr("fill", "none")

        return function() {
            d3.select("#pie path").attr("d", "")
            d3.select("#pieOutline path").attr("d", "")
            d3.select("#demandLine path").attr("d", "")
            d3.select("#demandLineCur path").attr("d", "")
            d3.select("#date").text("")
        }
    }, [])
    useEffect(() => {
        d3.select("#pie path")
            .attr("d", d3.arc()
                .innerRadius(40)
                .outerRadius(90)
                .startAngle(0)
                .endAngle(Math.PI * monthIdx / 12 * 2))
            .attr("fill", "rgba(255, 205, 178, 1)")
        let date = dateInterpIdx(counter)
        if (displayMonth)
            d3.select("#date").html(date.toLocaleString('default', { year: 'numeric' }) + "<br/>" + date.toLocaleString('default', { month: 'long' }))
        else
            d3.select("#date").html(date.toLocaleString('default', { year: 'numeric' }))
        d3.selectAll("#demandLineCur path")
            .data([averageData[dataset].filter((_, i) => dateInterpIdx(i).toLocaleString('default', { year: 'numeric' }) == date.toLocaleString('default', { year: 'numeric' }))])
            .join("path")
            .attr("d", avgs => radialMonth(avgs))
            .attr("stroke", "rgb(178, 108, 71)")
            .attr("stroke-width", "2")
            .attr("fill", "none")

        // return function() {
        //     d3.select("#pie path").attr("d", "")
        //     d3.select("#demandLine path").attr("d", "")
        //     d3.select("#date").text("")
        //     d3.select("#year").text("")
        // }
    })
}