import React from 'react'
import ClientDashboard from '../components/dashboard/ClientDashboard'
import AdminDashboard from '../components/dashboard/AdminDashboard'
import { useSelector } from 'react-redux'

function NewDashboard() {
  const user = useSelector(store => store.helper)
  console.log(user)
  return (
    <>
      {user.role === "ClientAdmin" && < ClientDashboard />}
      <AdminDashboard />
    </>
  )
}

export default NewDashboard