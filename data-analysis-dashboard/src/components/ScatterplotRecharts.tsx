import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ScatterplotRechartsProps {
  data: number[][];
  xIndex: number;
  yIndex: number;
  xLabel: string;
  yLabel: string;
  width?: string | number;
  height?: number;
}

const ScatterplotRecharts: React.FC<ScatterplotRechartsProps> = ({ 
  data,
  xIndex,
  yIndex,
  xLabel,
  yLabel,
  width = "100%",
  height = 300
}) => {
  if (!data || data.length === 0) return <p>No data available</p>;

  // Transform data into the format Recharts expects
  const scatterData = data.map((point) => ({
    x: point[xIndex],
    y: point[yIndex]
  }));

  return (
    <div className="scatterplot-wrapper">
      <ResponsiveContainer width={width} height={height}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="x" 
            name={xLabel}
            type="number"
            label={{ 
              value: xLabel, 
              position: 'bottom',
              offset: 5
            }}
          />
          <YAxis 
            dataKey="y" 
            name={yLabel}
            type="number"
            label={{ 
              value: yLabel, 
              angle: -90, 
              position: 'left',
              offset: 5
            }}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="scatter-tooltip">
                    <p>{`${xLabel}: ${Number(payload[0].value).toFixed(4)}`}</p>
                    <p>{`${yLabel}: ${Number(payload[0].payload.y).toFixed(4)}`}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter 
            data={scatterData} 
            fill="#8884d8"
            fillOpacity={0.6}
            shape="circle"
            r={4}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScatterplotRecharts; 