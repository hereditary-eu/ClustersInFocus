import React from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAppStore } from "../../stores/useAppStore";
import { isNumericDataPoint } from "../../utils/validation";
import styles from "./ScatterplotClustered.module.css";

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
  const setSelectedCluster = useAppStore((state) => state.setSelectedCluster);
  const setExpandedPanel = useAppStore((state) => state.setExpandedPanel);

  if (!data || data.length === 0) return <p>No data available</p>;

  const hasNonNumericalValues = data.some((point) => !isNumericDataPoint(point));

  if (hasNonNumericalValues) {
    return <p>Please select numerical columns only</p>;
  }

  const actualClusterIds = Array.from(new Set(data.map((point) => point[2])))
    .filter((id) => id !== -1 && id !== undefined)
    .sort((a, b) => a - b);

  const numClusters = Math.max(k, actualClusterIds.length);

  const clusterData = actualClusterIds.map((clusterId) =>
    data
      .filter((point) => point[2] === clusterId)
      .map((point) => ({
        x: point[0],
        y: point[1],
        cluster: clusterId,
      })),
  );

  const colors = Array.from({ length: numClusters }, (_, i) => `hsl(${(i * 360) / numClusters}, 70%, 50%)`);

  const handleClick = (clusterIndex: number) => {
    setSelectedCluster(clusterIndex);
    setExpandedPanel("right");
  };

  return (
    <div className={styles.wrapper}>
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
            wrapperStyle={{ outline: "none", pointerEvents: "none" }}
            cursor={{
              strokeDasharray: "3 3",
              stroke: "rgba(0, 0, 0, 0.2)",
              strokeWidth: 1,
              fill: "rgba(0, 0, 0, 0.05)",
            }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className={styles.tooltip}>
                    <div className={styles.tooltipLine}>
                      <strong>{xLabel}:</strong> {Number(payload[0].value).toFixed(4)}
                    </div>
                    <div className={styles.tooltipLine}>
                      <strong>{yLabel}:</strong> {Number(payload[0].payload.y).toFixed(4)}
                    </div>
                    <div className={styles.tooltipLine}>
                      <strong>Cluster:</strong> {Number(payload[0].payload.cluster) + 1}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          {clusterData.map((cluster, i) => {
            const clusterId = actualClusterIds[i];
            return (
              <Scatter
                key={clusterId}
                name={`Cluster ${clusterId + 1}`}
                data={cluster}
                fill={colors[i % colors.length]}
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
