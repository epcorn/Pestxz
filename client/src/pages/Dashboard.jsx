import React from 'react'
import ClientDashboard from '../components/dashboard/ClientDashboard'
import AdminDashboard from '../components/dashboard/AdminDashboard'
import { useSelector } from 'react-redux'
import OperatorDashboard from './OperatorDashboard'
import AuditorDashboard from '../components/auditor/AuditorDashboard'


function NewDashboard() {
  const { user } = useSelector(store => store.helper)

  const dashboards = {
    ClientAdmin: <ClientDashboard />,
    Admin: <AdminDashboard />,
    BranchAdmin: <AdminDashboard />,
    Operator: <OperatorDashboard />,
    Auditor: <AuditorDashboard />
  }

  return dashboards[user.role] || null
}

export default NewDashboard;

