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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Color helper for dynamic admin charts
const getColor = (index, alpha = 1) => {
  const colors = [
    `rgba(54, 162, 235, ${alpha})`,   // Blue
    `rgba(255, 159, 64, ${alpha})`,   // Orange
    `rgba(153, 102, 255, ${alpha})`,  // Purple
    `rgba(90, 184, 201, ${alpha})`,   // Teal
    `rgba(255, 99, 132, ${alpha})`,   // Red
    `rgba(75, 192, 192, ${alpha})`,   // Green
  ];
  return colors[index % colors.length];
};

const keyMapping = {
  "complaints": "Total Complaints",
  "regulars": "Total Services",
  "productCompleted": "Total Product Service Done",
}

function MultiLineChart({ values = [], selectedMonth, admin = [], toggle }) {

  // --- 1. VALUES CHART CONFIGURATION ---
  const valuesLabels = values?.map(item => {
    const text = item.month.split(" ") || ''
    const text1 = text[0].slice(0, 3)
    const text2 = text[1].slice(2, 4)
    return `${text1}-${text2}`
  });

  const valuesData = {
    labels: valuesLabels,
    datasets: [
      {
        label: 'Total Complaints',
        data: values.map(item => item.complaints ?? 0),
        borderColor: '#FB2C36',
        backgroundColor: '#FB2C3633',
        tension: 0.4,
      },
      {
        label: 'Closed Complaints',
        data: values.map(item => item.closed ?? 0),
        borderColor: '#00C950',
        backgroundColor: '#00C95033',
        tension: 0.2,
      },
      {
        label: 'Regular Services',
        data: values.map(item => item?.regularDone),
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        tension: 0.2,
      },
      {
        label: 'Product Services',
        data: values.map(item => item?.productDone),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.2,
      },
    ],
  };

  // --- 2. ADMIN CHART CONFIGURATION ---
  const adminLabels = admin?.map(item => item.month || '');
  const selectedData = admin?.[selectedMonth] ?? {}
  const adminKeys = Object?.keys(selectedData)?.filter(key => ['complaints', 'regulars', 'productCompleted']?.includes(key));

  const adminDatasets = adminKeys?.map((key, index) => ({
    label: keyMapping?.[key] || (key.charAt(0)?.toUpperCase() + key?.slice(1)),
    data: admin.map(item => item?.[key] ?? 0),
    borderColor: getColor(index, 1),
    backgroundColor: getColor(index, 0.2),
    tension: 0.3,
  }));

  const adminData = {
    labels: adminLabels,
    datasets: adminDatasets,
  };

  // --- 3. SHARED OPTIONS CONFIG ---
  const getOptions = (titleText) => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 11 }, color: 'black' },
      },
      title: {
        display: true,
        text: titleText,
        font: { size: 14, weight: 'bold' },
        padding: { bottom: 10 }
      },
    },
    scales: {
      y: { beginAtZero: true },
    },
  });

  return (
    <>
      {/* Values Data Chart */}
      {toggle === "values" && (
        <div className="relative w-full h-[300px]">
          <Line data={valuesData} options={getOptions('Admin Metrics Overview')} />
        </div>
      )}

      {/* Admin Data Chart */}
      {toggle === "admin" && (
        <div className="relative w-full h-[300px]">
          <Line data={adminData} options={getOptions('Admin Metrics Overview')} />
        </div>
      )}
    </>

  );
}

export default MultiLineChart;
