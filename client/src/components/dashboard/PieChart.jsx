import React from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend);

function PieChart({ values, line = false, modelKey = "" }) {
  const filteredKeys = Object.keys(values ?? []).filter(
    key => !["allcomplaints", "Invalid", "total", "completed"].includes(key)
  );
  
  const chartDataValues = filteredKeys.map(key => values[key]);

  // Standardized Labels
  const keyMapping = {
    open: "Open",
    Open: "Open",

    inProgress: "In Progress",
    "In Progress": "In Progress",

    closed: "Closed",
    Close: "Closed",
    closedComplaints: "Closed",

    closeReq: "Close Req",
    CloseReq: "Close Req",

    reOpenCount: "Reopened",
    reopenCount: "Reopened",
    Reopened: "Reopened",

    completedServices: "Done",
    completed: "Done",

    "Done Products Services": "Done",
    "Pending Products Services": "Pending",
    "Missed Products Services": "Missed",

    "Done Regular Services": "Done",
    "Pending Regular Services": "Pending",
    "Missed Regular Services": "Missed",

    Invalid: "Invalid",
  };

  // Color Definitions keyed directly by display labels
  const statusColors = {
    complaint: {
      "Open": "#EF4444BF",        // Red
      "In Progress": "#F59E0BBF", // Amber/Yellow
      "Close Req": "#EAB308BF",   // Yellow-Green
      "Closed": "#6B7280BF",      // Grey
      "Reopened": "#8B5CF6BF",    // Purple
    },
    regular: {
      "Done": "#3B82F6BF",        // Blue
      "Pending": "#64748B33",     // Muted Slate Blue
      "Missed": "#F97316BF",      // Orange
    },
    product: {
      "Done": "#06B6D4BF",        // Cyan
      "Pending": "#A855F7BF",     // Purple
      "Missed": "#EC4899BF",      // Pink
    }
  };

  const newKeys = filteredKeys.map(f => keyMapping[f] || f);

  // Extract category type reliably ("product", "regular", "complaint" / "complaints")
  const rawType = modelKey.split(" ")[0].toLowerCase();
  const chartType = rawType.startsWith("complaint") ? "complaint" : rawType;

  // Match colors using the mapped display keys
  const backgroundColor = newKeys.map(
    key => statusColors?.[chartType]?.[key] || "#9CA3AF"
  );

  const borderColor = backgroundColor.map(color => 
    color.startsWith("#") && color.length === 9 ? color.slice(0, 7) : color
  );

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
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "bottom", labels: { font: { size: 10 }, color: "black" } },
      tooltip: { position: "nearest" },
      title: { display: true, text: `Status of ${modelKey}` }
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 400, height: 260, position: 'relative', margin: '0 auto' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}

export default PieChart;