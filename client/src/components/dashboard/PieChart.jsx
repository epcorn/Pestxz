import React from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie, Doughnut, Line } from 'react-chartjs-2'


ChartJS.register(ArcElement, Tooltip, Legend);

function PieChart({ values, line = false }) {
  const filteredKeys = Object.keys(values).filter(key => !["allcomplaints", "Pending", "Invalid", "total", "completed"].includes(key))
  const chartDataValues = filteredKeys.map(key => values[key])

  const keyMapping = {
    "Open": "Open Complaints",
    "open": "Open Complaints",
    "Done": "Complaints resolved",
    "Close": "Close Complaints",
    "closed": "Close Complaints",
    "missed": "Missed Services",
    "Missed": "Missed Services",
    "In Progress": "In Progress Complaints",
    "inProgress": "In Progress Complaints",
    "completedServices": "Completed Services",
    "completed": "Completed Services",
    "reOpenCount": "Reopened Complaints",
    "reopenCount": "Reopened Complaints"
  };
  const newKeys = filteredKeys.map(f => keyMapping[f] || f)

  const data = {
    // labels: ["Open complaint", "In progress", "Closed complaint", "Reopened", " regular services"],
    labels: newKeys,
    datasets: [{
      label: "Count", data: chartDataValues, backgroundColor: [
        '#3B82F6', // Open - Trust Blue
        '#F59E0B', // In Progress - Warm Amber
        '#6B7280', // Close - Neutral Gray
        '#8B5CF6', // reopenCount - Purple Alert
        '#10B981'  // completedServices - Success Green
      ],
      borderColor: [
        '#1D4ED8',
        '#D97706',
        '#4B5563',
        '#7C3AED',
        '#059669'
      ],
      borderWidth: 1
    }]
  }
  const options = {
    responsive: true, plugins: { legend: { display: true, position: "bottom", labels: { font: { size: 10 }, color: "black" } }, tootip: { position: "nearest" }, title: { display: true, text: "Status of Services" } }
  }
  return (
    <>
      <div className=''>
        <div style={{ width: '350px', margin: "0 auto" }}>
          <Doughnut data={data} options={options} />
        </div>
      </div>
    </>
  )
}

export default PieChart

