import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register the required Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BoxplotChartProps {
  data: number[];
}

const BoxplotChart: React.FC<BoxplotChartProps> = ({ data }) => {
  if (data.length === 0) return <p>No data available</p>;

  // Sort data
  const sortedData = data.sort((a, b) => a - b);

  // Calculate quartiles and statistics for the boxplot
  const q1 = sortedData[Math.floor(sortedData.length * 0.25)];
  const median = sortedData[Math.floor(sortedData.length * 0.5)];
  const q3 = sortedData[Math.floor(sortedData.length * 0.75)];
  const min = sortedData[0];
  const max = sortedData[sortedData.length - 1];

  const chartData = {
    labels: ['Data'], // This could be the label for the selected column
    datasets: [
      {
        label: 'Boxplot',
        data: [q3 - q1], // Represents the "box"
        backgroundColor: '#69b3a2',
        borderColor: '#007bff',
        borderWidth: 1,
        base: q1,
      },
      {
        label: 'Whiskers',
        data: [max - min], // Represents the "whiskers"
        backgroundColor: 'rgba(0, 0, 0, 0)', // Transparent background
        borderColor: '#000000',
        borderWidth: 1,
        base: min,
      },
      {
        label: 'Median',
        data: [0], // Represent the "median" as a point
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: '#ff0000',
        borderWidth: 2,
        base: median,
      },
    ],
  };

  const options = {
    indexAxis: 'x' as const, // Horizontal bar chart
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function () {
            return `Q1: ${q1}, Median: ${median}, Q3: ${q3}, Min: ${min}, Max: ${max}`;
          },
        },
      },
    },
    scales: {
      x: {
        min: min,
        max: max,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default BoxplotChart;
