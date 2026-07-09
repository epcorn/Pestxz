import React from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie, Doughnut, Line } from 'react-chartjs-2'


ChartJS.register(ArcElement, Tooltip, Legend);

function PieChart({ values, line = false, modelKey }) {
  const filteredKeys = Object.keys(values ?? []).filter(key => !["allcomplaints", "Pending", "Invalid", "total", "completed"].includes(key))
  const chartDataValues = filteredKeys.map(key => values[key])

  const keyMapping = {
    open: "Open",
    Open: "Open",

    inProgress: "In Progress",
    "In Progress": "In Progress",

    closed: "Close",
    Close: "Close",

    reOpenCount: "Reopened",
    reopenCount: "Reopened",

    completedServices: "Done Regular Services",
    completed: "Done Regular Services",

    "Done Products Services": "Done",
    "Pending Products Services": "Pending",
    "Missed Products Services": "Missed",

    "Done Regular Services": "Done",
    "Pending Regular Services": "Pending",
    "Missed Regular Services": "Missed",

    Invalid: "Invalid",
  };

  const statusColors = {
    // Complaints

    "open": "#EF4444",
    "Open": "#EF4444",
    "inProgress": "#F59E0B",
    "In Progress": "#F59E0B",
    "Close": "#22C55E",
    "Reopened Complaints": "#8B5CF6",
    // Regular Services
    regular: {
      "Done": "#3B82F6",
      "Pending": "#94A3B8",
      "Missed": "#F97316",
    },
    // Product Services
    product: {
      "Done": "#06B6D4",
      "Pending": "#A855F7",
      "Missed": "#EC4899",
    }
  };
  const newKeys = filteredKeys.map(f => keyMapping[f] || f)
  const chartType = modelKey?.split(" ")?.[0].toLowerCase();

  const backgroundColor = newKeys.map(
    key =>
      statusColors[key] ||
      statusColors[chartType]?.[key] ||
      "#9CA3AF"
  );
  const borderColor = backgroundColor;

  const data = {
    labels: newKeys,
    datasets: [
      {
        label: "Count",
        data: chartDataValues,
        backgroundColor,
        borderColor,
        borderWidth: 1,
      },
    ],

  }
  const options = {
    responsive: true,
    maintainAspectRatio: false, // let it fill the fixed-height wrapper below
    plugins: {
      legend: { display: true, position: "bottom", labels: { font: { size: 10 }, color: "black" } },
      tooltip: { position: "nearest" }, // was "tootip" — typo, tooltip config was silently ignored
      title: { display: true, text: `Status of ${modelKey}` }
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: 320, height: 260, position: 'relative', margin: '0 auto' }}>
      <Doughnut data={data} options={options} />
    </div>
  )
}

export default PieChart

