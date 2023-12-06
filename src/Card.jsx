import React from 'react'

const TEXT = {
    0: "This is California.",
    1: "This is demand.",
    2: "This is groundwater supply.",
    3: "This is unmet demand.",
}

const TEXT_LEN = Object.values(TEXT).length

export default function Card({ slide }) {

    return (
        <p style={{
          position: "absolute",
          top: "0",
          left: "0",
        }}>{ TEXT[slide % TEXT_LEN] }</p>
    )
}