import React from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAppStore } from "../../stores/useAppStore";
import { isNumericDataPoint } from "../../utils/validation";

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
  height = 400,
}) => {
  const setSelectedCluster = useAppStore(state => state.setSelectedCluster);
  const setExpandedPanel = useAppStore(state => state.setExpandedPanel);
  // Early return if data is missing or empty
  if (!data || data.length === 0) return <p>No data available</p>;


  // Check if any data point has non-numerical values
  const hasNonNumericalValues = data.some(point => !isNumericDataPoint(point));

  if (hasNonNumericalValues) {
    return <p>Please select numerical columns only</p>;
  }

  // Get the actual number of unique clusters in the data, which may be different from k
  const actualClusterIds = Array.from(new Set(data.map((point) => point[2])))
    .filter((id) => id !== -1 && id !== undefined)
    .sort((a, b) => a - b);


  // Use the maximum of k and actual unique clusters to ensure we have enough colors
  const numClusters = Math.max(k, actualClusterIds.length);

  // Transform data into the format Recharts expects and separate by clusters
  const clusterData = actualClusterIds.map((clusterId) =>
    data
      .filter((point) => point[2] === clusterId)
      .map((point) => ({
        x: point[0],
        y: point[1],
        cluster: clusterId, // Explicitly store cluster index
      })),
  );

  // Generate different colors for all clusters
  const colors = Array.from({ length: numClusters }, (_, i) => `hsl(${(i * 360) / numClusters}, 70%, 50%)`);

  const handleClick = (clusterIndex: number) => {
    setSelectedCluster(clusterIndex);
    setExpandedPanel("right");
  };

  return (
    <div className="scatterplot-wrapper">
      <ResponsiveContainer width={width} height={height}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" name={xLabel} type="number" label={{ value: xLabel, position: "bottom", offset: 5 }} />
          <YAxis
            dataKey="y"
            name={yLabel}
            type="number"
            label={{ value: yLabel, angle: -90, position: "left", offset: 5 }}
          />
          <Tooltip
            cursor={{
              strokeDasharray: "3 3",
              stroke: "rgba(0, 0, 0, 0.2)",
              strokeWidth: 1,
              fill: "rgba(0, 0, 0, 0.05)",
            }}
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
          {/* <Legend /> */}
          {clusterData.map((cluster, i) => {
            const clusterId = actualClusterIds[i];
            return (
              <Scatter
                key={clusterId}
                name={`Cluster ${clusterId + 1}`}
                data={cluster}
                fill={colors[i % colors.length]} // Use modulo to avoid index errors
                fillOpacity={0.6}
                shape="circle"
                r={4}
                animationDuration={0}
                onClick={() => handleClick(clusterId)}
                cursor="pointer"
              />
            );
          })}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScatterplotClustered;
