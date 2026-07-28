import React from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend);

function PieChart({ values, line = false, modelKey }) {
  const filteredKeys = Object.keys(values ?? []).filter(key => !["allcomplaints", "Invalid", "total", "completed"].includes(key))
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
    complaints: {
      "open": "#EF444480",
      "Open": "#EF4444BF",
      "inProgress": "#F59E0BBF",
      "In Progress": "#F59E0BBF",
      "Close": "#22C55EBF",
      "Reopened": "#8B5CF6BF",
    },
    // Regular Services
    regular: {
      "Done": "#3B82F6BF",
      "Pending": "#4b6b99BF",
      "Missed": "#F97316BF",
    },
    // Product Services
    product: {
      "Done": "#06B6D4BF",
      "Pending": "#A855F7BF",
      "Missed": "#EC4899BF",
    }
  };

  const newKeys = filteredKeys.map(f => keyMapping[f] || f)
  const chartType = modelKey?.split(" ")?.[0].toLowerCase();

  // FIXED: Direct look up into the specific chart category color mapping
  const backgroundColor = newKeys.map(
    key => statusColors?.[chartType]?.[key] || "#9CA3AF"
  );

  const borderColor = backgroundColor?.map(p => p.slice(0, 7));

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
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "bottom", labels: { font: { size: 10 }, color: "black" } },
      tooltip: { position: "nearest" },
      title: { display: true, text: `Status of ${modelKey}` }
    }
  }


  return (
    <div style={{ width: '100%', maxWidth: 400, height: 260, position: 'relative', margin: '0 auto' }}>
      <Doughnut data={data} options={options} />
    </div>
  )
}

export default PieChart