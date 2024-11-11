import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ScatterplotClusteredProps {
  data: number[][];
  xLabel: string;
  yLabel: string;
  k: number;
  width?: string | number;
  height?: number;
}

const ScatterplotClustered: React.FC<ScatterplotClusteredProps> = ({
  data,
  xLabel,
  yLabel,
  k,
  width = "100%",
  height = 400
}) => {
  if (!data || data.length === 0) return <p>No data available</p>;

  // Transform data into the format Recharts expects and separate by clusters
  const clusterData = Array.from({ length: k }, (_, i) => 
    data
      .filter(point => point[2] === i)
      .map(point => ({
        x: point[0],
        y: point[1],
        cluster: point[2]
      }))
  );

  // Generate k different colors for the clusters
  const colors = Array.from({ length: k }, (_, i) => 
    `hsl(${(i * 360) / k}, 70%, 50%)`
  );

  return (
    <div className="scatterplot-wrapper">
      <ResponsiveContainer width={width} height={height}>
        <ScatterChart 
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
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
                    <p>{`Cluster: ${Number(payload[0].payload.cluster) + 1}`}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          {clusterData.map((cluster, i) => (
            <Scatter
              key={i}
              data={cluster}
              fill={colors[i]}
              fillOpacity={0.6}
              shape="circle"
              r={4}
              animationDuration={0}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScatterplotClustered;