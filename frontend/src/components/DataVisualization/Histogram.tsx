import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface HistogramProps {
  data: number[];
  variant?: "tiny" | "big";
  width?: number;
  height?: number;
  initialBins?: number;
  showControls?: boolean;
  showAxes?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  barColor?: string;
  animated?: boolean;
  title?: string;
}

const Histogram: React.FC<HistogramProps> = ({
  data,
  variant = "big",
  width = variant === "tiny" ? 100 : undefined,
  height = variant === "tiny" ? 30 : 300,
  initialBins = 10,
  showControls = variant === "big",
  showAxes = variant === "big",
  showTooltip = variant === "big",
  showGrid = variant === "big",
  barColor = "#8884d8",
  animated = false,
  title,
}) => {
  const [bins, setBins] = useState(initialBins);
  const binOptions = [2, 5, 10, 15, 20, 25, 30];

  if (!data || data.length === 0) return null;

  // Calculate bins
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;

  // Create and populate bins with improved label formatting
  const histogramData = Array.from({ length: bins }, (_, i) => {
    const lowerBound = min + i * binWidth;
    const upperBound = min + (i + 1) * binWidth;

    // Simplify bin labels for better display
    let binLabel;
    if (max < 0.1) {
      // For small values, use scientific notation
      binLabel = `${lowerBound.toExponential(1)}`;
    } else if (max > 1000) {
      // For large values, round to nearest integer
      binLabel = `${Math.round(lowerBound)}`;
    } else {
      // For medium values, use fewer decimals
      const decimals = max < 1 ? 3 : max < 10 ? 2 : max < 100 ? 1 : 0;
      binLabel = `${lowerBound.toFixed(decimals)}`;
    }

    return {
      bin: binLabel,
      fullLabel: `${lowerBound.toFixed(3)} - ${upperBound.toFixed(3)}`,
      count: 0,
    };
  });

  // Fill bins
  data.forEach((value) => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
    histogramData[binIndex].count += 1;
  });

  // Custom tooltip to show the full range
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { bin: string; fullLabel: string; count: number }; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="custom-tooltip"
          style={{
            backgroundColor: "var(--color-white-transparent)",
            padding: "10px",
            border: "1px solid var(--color-gray-light)",
            borderRadius: "4px",
          }}
        >
          <p className="label">{`Range: ${payload[0].payload.fullLabel}`}</p>
          <p className="desc">{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="histogram-wrapper">
      {title && (
        <div className="histogram-title" style={{ textAlign: "center", marginBottom: "10px" }}>
          <strong>{title}</strong>
        </div>
      )}
      {showControls && (
        <div className="histogram-controls">
          <label>Bin Count: </label>
          <select value={bins} onChange={(e) => setBins(Number(e.target.value))} className="bin-select">
            {binOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
      {width ? (
        <BarChart
          width={width}
          height={height}
          data={histogramData}
          margin={
            variant === "big" ? { top: 20, right: 30, bottom: 20, left: 20 } : { top: 0, right: 0, bottom: 0, left: 0 }
          }
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          {showAxes && (
            <XAxis dataKey="bin" angle={-45} textAnchor="end" height={60} interval={0} tick={{ fontSize: 10 }} />
          )}
          {showAxes && <YAxis />}
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          <Bar dataKey="count" fill={barColor} isAnimationActive={animated} id={`histogram-${variant}-${Date.now()}`} />
        </BarChart>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={histogramData}
            margin={
              variant === "big"
                ? { top: 20, right: 30, bottom: 20, left: 20 }
                : { top: 0, right: 0, bottom: 0, left: 0 }
            }
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showAxes && (
              <XAxis dataKey="bin" angle={-45} textAnchor="end" height={60} interval={0} tick={{ fontSize: 10 }} />
            )}
            {showAxes && <YAxis />}
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Bar
              dataKey="count"
              fill={barColor}
              isAnimationActive={animated}
              id={`histogram-${variant}-${Date.now()}`}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default Histogram;
