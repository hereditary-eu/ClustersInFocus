import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HistogramProps {
  data: number[];
  variant?: 'tiny' | 'big';
  width?: number;
  height?: number;
  initialBins?: number;
  showControls?: boolean;
  showAxes?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  barColor?: string;
  animated?: boolean;
}

const Histogram: React.FC<HistogramProps> = ({ 
  data,
  variant = 'big',
  width = variant === 'tiny' ? 100 : undefined,
  height = variant === 'tiny' ? 30 : 300,
  initialBins = 10,
  showControls = variant === 'big',
  showAxes = variant === 'big',
  showTooltip = variant === 'big',
  showGrid = variant === 'big',
  barColor = '#8884d8',
  animated = false
}) => {
  const [bins, setBins] = useState(initialBins);
  const binOptions = [2, 5, 10, 15, 20, 25, 30];

  if (!data || data.length === 0) return null;

  // Calculate bins
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;

  // Create and populate bins
  const histogramData = Array.from({ length: bins }, (_, i) => ({
    bin: `${(min + i * binWidth).toFixed(3)} - ${(min + (i + 1) * binWidth).toFixed(3)}`,
    count: 0,
  }));

  // Fill bins
  data.forEach((value) => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
    histogramData[binIndex].count += 1;
  });

  return (
    <div className="histogram-wrapper">
      {showControls && (
        <div className="histogram-controls">
          <label>Bin Count: </label>
          <select 
            value={bins} 
            onChange={(e) => setBins(Number(e.target.value))}
            className="bin-select"
          >
            {binOptions.map(option => (
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
          margin={variant === 'big' ? { top: 20, right: 30, bottom: 20, left: 20 } : { top: 0, right: 0, bottom: 0, left: 0 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          {showAxes && <XAxis dataKey="bin" />}
          {showAxes && <YAxis />}
          {showTooltip && <Tooltip />}
          <Bar 
            dataKey="count" 
            fill={barColor}
            isAnimationActive={animated}
            id={`histogram-${variant}-${Date.now()}`}
          />
        </BarChart>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart 
            data={histogramData}
            margin={variant === 'big' ? { top: 20, right: 30, bottom: 20, left: 20 } : { top: 0, right: 0, bottom: 0, left: 0 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            {showAxes && <XAxis dataKey="bin" />}
            {showAxes && <YAxis />}
            {showTooltip && <Tooltip />}
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