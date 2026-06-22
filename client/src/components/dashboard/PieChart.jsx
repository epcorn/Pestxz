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
    "Done": "Services Done",
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
        '#B331F1', // Open - Trust Blue
        '#FF62BB', // In Progress - Warm Amber
        '#FB2C36', // Close - Neutral Gray
        '#FE9A00', // reopenCount - Purple Alert
        '#00C950',  // completedServices - Success Green
      ],
      borderColor: [
        '#B331F1',
        '#FF62BB',
        '#FB2C36',
        '#FE9A00',
        '#00C950',
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

