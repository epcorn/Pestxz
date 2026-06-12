import React from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie, Doughnut } from 'react-chartjs-2'


ChartJS.register(ArcElement, Tooltip, Legend);

function PieChart({ values }) {

  const filteredKeys = Object.keys(values).filter(key => key !== "allcomplaints")
  const chartDataValues = filteredKeys.map(key => values[key])

  console.log(filteredKeys)


  const data = {
    labels: ["Open complaint", "In progress", "Closed complaint", "Reopened", " regular services"],
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
    responsive: true, plugins: { legend: { position: "top", labels: { font: { size: 10 }, color: "black" } }, tootip: { position: "nearest" }, title: { display: false, text: "Status of Services" } }
  }
  return (
    <>
      {/* <div style={{ width: '250px', margin: "0 auto" }}>
       <Pie data={data} options={options} />
    </div> */}
      <div style={{ width: '250px', margin: "0 auto" }}>
        <Doughnut data={data} options={options} />
      </div>
    </>
  )
}

export default PieChart

