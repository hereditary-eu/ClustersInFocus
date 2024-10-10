import React from 'react';
import {
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
  Line,
  ResponsiveContainer
} from 'recharts';

interface BoxplotRechartsProps {
  data: number[];
}

const BoxplotRecharts: React.FC<BoxplotRechartsProps> = ({ data }) => {
  if (data.length === 0) return <p>No data available</p>;

  // Sort data and calculate the quartiles
  const sortedData = data.sort((a, b) => a - b);
  const q1 = sortedData[Math.floor(sortedData.length * 0.25)];
  const median = sortedData[Math.floor(sortedData.length * 0.5)];
  const q3 = sortedData[Math.floor(sortedData.length * 0.75)];
  const min = sortedData[0];
  const max = sortedData[sortedData.length - 1];

  const chartData = [
    {
      name: 'Data',
      min,
      q1,
      median,
      q3,
      max,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart
        layout="horizontal"
        data={chartData}
        margin={{ top: 20, right: 30, bottom: 20, left: 40 }}
      >
        <CartesianGrid stroke="#f5f5f5" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" />
        <Tooltip />

        {/* Whiskers */}
        <Bar dataKey="max" fill="rgba(0,0,0,0)" stroke="#000" strokeWidth={1} />
        <Bar dataKey="min" fill="rgba(0,0,0,0)" stroke="#000" strokeWidth={1} />

        {/* Box */}
        <Bar dataKey="q3" stackId="a" fill="#69b3a2" />
        <Bar dataKey="q1" stackId="a" fill="#69b3a2" />

        {/* Median Line */}
        <Line type="monotone" dataKey="median" stroke="#ff0000" strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default BoxplotRecharts;
