import React from 'react';
import { BarChart, Bar } from 'recharts';

interface TinyHistogramProps {
  data: number[];
  width?: number;
  height?: number;
}

const TinyHistogram: React.FC<TinyHistogramProps> = ({ 
  data,
  width = 100,
  height = 30
}) => {
  if (!data || data.length === 0) return null;

  // Create bins for the histogram
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binCount = 10;
  const binWidth = (max - min) / binCount;

  // Initialize bins
  const bins = Array(binCount).fill(0);

  // Fill bins
  data.forEach(value => {
    const binIndex = Math.min(
      Math.floor((value - min) / binWidth),
      binCount - 1
    );
    bins[binIndex]++;
  });

  // Convert to Recharts format
  const chartData = bins.map(count => ({ value: count }));

  return (
    <BarChart width={width} height={height} data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
      <Bar 
        dataKey="value" 
        fill="#8884d8" 
        isAnimationActive={false}
      />
    </BarChart>
  );
};

export default TinyHistogram; 