import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface BarChartProps {
  data: number[];
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    d3.select(svgRef.current).selectAll("*").remove();

    // SVG container
    const svg = d3.select(svgRef.current)
      .attr("width", 400)
      .attr("height", 300)
      .style("background", "#f4f4f4")
      .style("margin", "50px")
      .style("overflow", "visible");

    // scales
    const xScale = d3.scaleBand()
      .domain(data.map((_, i) => i.toString()))
      .range([0, 400])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data) as number])
      .range([300, 0]);

    // axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
      .call(xAxis)
      .attr("transform", "translate(0, 300)");

    svg.append("g")
      .call(yAxis);

    // bars
    svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (_, i) => xScale(i.toString()) as number)
      .attr("y", y => yScale(y))
      .attr("width", xScale.bandwidth())
      .attr("height", y => 300 - yScale(y))
      .attr("fill", "orange");

  }, [data]);

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default BarChart;
