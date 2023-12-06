import React, { useEffect } from 'react'
import { dateInterpIdx } from './utils/scales'
import * as d3 from 'd3'

export default function Clock({ counter }) {

    const monthIdx = (((counter + 9) % 12) + 1)
    useEffect(() => {
        d3.select("#clock g path")
            .attr("d", d3.arc()
                .innerRadius(20)
                .outerRadius(50)
                .startAngle(0)
                .endAngle(Math.PI * monthIdx / 12 * 2))
            .attr("fill", monthIdx <= 3 ? "pink" : (monthIdx <= 6 ? "yellow" : (monthIdx <= 9 ? "orange" : "white")))
        d3.select("#date").text(dateInterpIdx(counter).toLocaleString('default', { month: 'long' }))

        return function() {
            d3.select("#clock g path").attr("d", "")
            d3.select("#date").text("")
        }
    })
}