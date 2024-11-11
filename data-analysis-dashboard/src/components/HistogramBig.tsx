import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HistogramRechartsProps {
  data: number[];
  initialBins?: number;
}

const HistogramRecharts: React.FC<HistogramRechartsProps> = ({ 
  data, 
  initialBins = 10 
}) => {
  const [bins, setBins] = useState(initialBins);
  const binOptions = [2, 5, 10, 15, 20, 25, 30];

  if (data.length === 0) return <p>No data available</p>;

  // Calculate bins
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;

  // Create bins
  const histogramData = Array.from({ length: bins }, (_, i) => ({
    bin: `${(min + i * binWidth).toFixed(2)} - ${(min + (i + 1) * binWidth).toFixed(2)}`,
    count: 0,
  }));

  // populate bins
  data.forEach((value) => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
    histogramData[binIndex].count += 1;
  });

  return (
    <div className="histogram-wrapper">
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
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={histogramData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bin" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistogramRecharts;
