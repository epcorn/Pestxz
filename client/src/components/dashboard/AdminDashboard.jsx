import React from 'react'
import { useSelector } from 'react-redux'

function AdminDashboard() {
  const { user } = useSelector(store => store.helper)
  console.log(user)
  return (
    <section>
      <h3>Hello {user.name ? <strong>{user.name}</strong> : "User"}</h3>
    </section>
  )
}

export default AdminDashboard