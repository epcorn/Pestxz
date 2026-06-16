import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { socket } from '../socket'
import { apiSlice } from '../redux/apiSlice'
import { toast } from 'react-toastify'

const ADMIN_ROLES = ["Admin", "Operator", "ClientAdmin", "BranchAdmin"]

function NotificationManager() {
  const { user } = useSelector(store => store.helper)
  const dispatch = useDispatch()

  const notificationSound = new Audio("/notification.wav")

  // join admin room whenever role is available
  useEffect(() => {
    if (user?.role) {
      socket.emit("join-admin", user.role)
    }
  }, [user?.role])

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    const sendNotification = async (title, body) => {
      if ("Notification" in window && Notification.permission === "granted") {
        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(title, {
              body,
              vibrate: [200],
              tag: title.replace(/\s+/g, '-').toLowerCase()
            })
            return;
          } catch (error) {
            console.error("Service worker failed")
          }
        }
        const notif = new Notification(title, { body, icon: "/logo.png" })
        notif.onclick = () => window.focus()
      }
    }

    // 👇 check role inside handler so it always reads the latest value
    const isAdmin = () => ADMIN_ROLES.includes(user?.role)

    const onNewWork = (data) => {
      if (!isAdmin()) return;
      dispatch(apiSlice.util.invalidateTags(["unscheduled", "Location"]))

      notificationSound.play().catch(error => { console.warn("Browser blocked autoplay") })

      sendNotification("New Unscheduled Report", `${data.raisedBy} raised a report — ${data.service?.label || data.service}`)

      toast.info(`🔔 New unscheduled report by ${data.raisedBy}`)
    }

    const onStatusChanged = (data) => {
      dispatch(apiSlice.util.invalidateTags(["unscheduled", "Location"]))
      notificationSound.play().catch(error => { console.warn("Browser blocked autoplay") })
      sendNotification("Report Updated", `Work status changed to: ${data.status}`)
    }

    const onApproved = (data) => {
      dispatch(apiSlice.util.invalidateTags(["unscheduled"]))
      notificationSound.play().catch(error => { console.warn("Browser blocked autoplay") })
      sendNotification("Report Approved", `Work for location ${data.location} was approved`)
    }

    const onRejected = (data) => {
      dispatch(apiSlice.util.invalidateTags(["unscheduled"]))

      notificationSound.play().catch(error => { console.warn("Browser blocked autoplay") })
      sendNotification("Report Rejected", `Work for location ${data.location} was rejected`)
    }

    const onNewComplaint = (data) => {
      if (!isAdmin()) return
      notificationSound.play().catch(error => { console.warn("Browser blocked autoplay") })
      dispatch(apiSlice.util.invalidateTags(["Complaint"]))
      sendNotification("New Complaint Raised", `${data.user} raised a complaint`)
    }

    const complaintUpdate = (data) => {
      if (!isAdmin()) return
      notificationSound.play().catch(error => { console.warn("Browser blocked autoplay") })
      dispatch(apiSlice.util.invalidateTags(["Complaint"]))
      sendNotification("Update on Complaint", `complaint got ${data.status} by ${data.user}`)
    }



    socket.on("new-unscheduled-work", onNewWork)
    socket.on("work-status-changed", onStatusChanged)
    socket.on("work-status-approved", onApproved)
    socket.on("work-status-rejected", onRejected)
    socket.on("new-complaint", onNewComplaint)

    return () => {
      socket.off("new-unscheduled-work", onNewWork)
      socket.off("work-status-changed", onStatusChanged)
      socket.off("work-status-approved", onApproved)
      socket.off("work-status-rejected", onRejected)
      socket.off("new-complaint", onNewComplaint)
    }
  }, [user?.role, dispatch])

  return null
}

export default NotificationManager