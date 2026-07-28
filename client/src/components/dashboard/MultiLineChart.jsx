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
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(
  zoomPlugin,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function MultiLineChart({ values = [] }) {
  const safeValues = Array.isArray(values) ? values : [];

  // Format month labels (e.g. "January 2026" -> "Jan-26")
  const valuesLabels = safeValues.map((item) => {
    if (!item?.month) return "";
    const parts = item.month.split(" ");
    const monthShort = parts[0]?.slice(0, 3) || "";
    const yearShort = parts[1]?.slice(2, 4) || "";
    return `${monthShort}-${yearShort}`;
  });

  const valuesData = {
    labels: valuesLabels,
    datasets: [
      {
        label: 'Total Complaints',
        data: safeValues.map((item) => item.totalComplaints ?? 0),
        borderColor: '#2563EB',      // Blue
        backgroundColor: '#2563EB33',
        tension: 0.3,
      },
      {
        label: 'Closed Complaints',
        data: safeValues.map((item) => item.closedComplaints ?? 0),
        borderColor: '#16A34A',      // Green
        backgroundColor: '#16A34A33',
        tension: 0.3,
      },
      {
        label: 'Regular Services Done',
        data: safeValues.map((item) => item.totalRegularDone ?? 0),
        borderColor: '#F59E0B',      // Amber/Orange
        backgroundColor: '#F59E0B33',
        tension: 0.3,
      },
      {
        label: 'Product Services Done',
        data: safeValues.map((item) => item.totalProductDone ?? 0),
        borderColor: '#8B5CF6',      // Purple
        backgroundColor: '#8B5CF633',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: "x",
        },
      },
      legend: {
        position: 'top',
        labels: { font: { size: 11 }, color: 'black' },
      },
      title: {
        display: true,
        text: 'Monthly Trends Overview',
        font: { size: 14, weight: 'bold' },
        padding: { bottom: 10 },
      },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="relative w-full h-[300px]">
      <Line data={valuesData} options={chartOptions} />
    </div>
  );
}

export default MultiLineChart;