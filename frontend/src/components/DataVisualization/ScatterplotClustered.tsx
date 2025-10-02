import React from "react";
// import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAppStore } from "../../stores/useAppStore";
import { isNumericDataPoint } from "../../utils/validation";
import { VegaEmbed } from "react-vega";

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
  // Early return if data is missing or empty
  if (!data || data.length === 0) return <p>No data available</p>;

  // Check if any data point has non-numerical values
  const hasNonNumericalValues = data.some((point) => !isNumericDataPoint(point));

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
      }))
  );

  // Generate different colors for all clusters
  const colors = Array.from({ length: numClusters }, (_, i) => `hsl(${(i * 360) / numClusters}, 70%, 50%)`);

  const handleClick = (clusterIndex: number) => {
    setSelectedCluster(clusterIndex);
    setExpandedPanel("right");
  };

  console.log(data);

  return (
    <div className="scatterplot-wrapper">
      <VegaEmbed
        spec={{
          config: { view: { continuousWidth: 300, continuousHeight: 300, stroke: "transparent" } },
          data: { name: "data" },
          mark: { type: "point" },
          encoding: {
            color: { field: "cluster", type: "nominal" },
            opacity: {
              condition: { param: "param_3", value: 0.8, empty: true },
              value: 0.2,
            },
            tooltip: { field: "Name", type: "nominal" },
            x: { field: "x", type: "quantitative" },
            y: {
              field: "y",
              title: "Y Label",
              type: "quantitative",
            },
          },
          params: [
            {
              name: "param_3",
              select: { type: "point", fields: ["cluster"] },
              bind: "legend",
            },
            {
              name: "param_4",
              select: { type: "interval", encodings: ["x", "y"] },
              bind: "scales",
            },
          ],
          $schema: "https://vega.github.io/schema/vega-lite/v5.20.1.json",
          datasets: {
            data: data.map((entry) => {
              return {
                x: entry[0],
                y: entry[1],
                cluster: entry[2],
              };
            }),
          },
        }}
      />
    </div>
  );
};

export default ScatterplotClustered;
