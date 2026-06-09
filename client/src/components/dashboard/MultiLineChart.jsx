import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register specific modules required for drawing lines and points
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function MultiLineChart({ values }) {
  // Shared X-axis labels

  const labels = values.map(item => item.month)

  // const labels = ['January', 'February', 'March', 'April', 'May', 'June'];

  const data = {

    labels,
    datasets: [
      {
        label: 'Complaints',
        data: values.map(item => item.complaints || 0),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.5, // Smoothes out the lines (0 = sharp angles)
      },
      {
        label: 'Close Complaints',
        data: values.map(item => item.Close || 0),
        // data: 7,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.2,
      },
      {
        label: 'Regular Services',
        data: values.map(i => i.completedServices || 0),
        // data: [2, 5, 3, 8, 10, 4],
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        tension: 0.2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top', labels: { font: { size: 10 }, color: "black" }
      },
      tooltip: {
        position: "nearest"
      },
      title: {
        display: true,
        text: 'Performance Analytics Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };


  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '250px' }}>
      <Line data={data} options={options} />
    </div>
  );

}

export default MultiLineChart;
