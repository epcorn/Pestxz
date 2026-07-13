import React from 'react'
import ClientDashboard from '../components/dashboard/ClientDashboard'
import AdminDashboard from '../components/dashboard/AdminDashboard'
import { useSelector } from 'react-redux'
import OperatorDashboard from './OperatorDashboard'

function NewDashboard() {
  const { user } = useSelector(store => store.helper)

  return (
    <>
      {user.role === "ClientAdmin" && <ClientDashboard />}
      {(user.role === "Admin" || user.role === "BranchAdmin") && <AdminDashboard />}
      {user.role === "Operator" && <OperatorDashboard />}
    </>
  )
}

export default NewDashboard;

