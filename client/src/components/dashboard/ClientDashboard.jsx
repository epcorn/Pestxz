import { RiErrorWarningLine } from "react-icons/ri";
import { IoMdTime } from "react-icons/io";
import { GrInProgress } from "react-icons/gr";
import { GoIssueReopened } from "react-icons/go";
import { AiOutlineFileDone } from "react-icons/ai";
import { motion } from 'motion/react'


import { IoLockClosed, IoLockOpen } from "react-icons/io5";
import { TbProgressAlert } from "react-icons/tb";

import { useDispatch, useSelector } from "react-redux";
import { useAdminDashboardQuery, useClientAdminDashboardQuery } from "../../redux/adminSlice";
import Loading from "../Loading";
import AlertMessage from "../AlertMessage";
import ComplaintTable from "../ComplaintTable";
import { useGetSingleClientQuery } from "../../redux/clientSlice";
import { useEffect, useMemo, useState } from "react";
import { BsGear } from "react-icons/bs";
import PieChart from "./PieChart";
import MultiLineChart from "./MultiLineChart";
import { clientAdminStatus } from "../../utils/constData";
import { useGetUnscheduledReportsQuery } from "../../redux/locationSlice";
import { useNavigate } from "react-router-dom";
import UnscheduledNotification from "./UnscheduledNotification";
import { StatCard } from "./AdminDashboard";
import UnScheduledList from "../single_location/UnScheduledList";
import React from "react";



const prMapped = {
  Done: "Done Products Services",
  Missed: "Missed Products Services",
  Pending: "Pending Products Services",
}
const regMapped = {
  Done: "Done Regular Services",
  Missed: "Missed Regular Services",
  Pending: "Pending Regular Services",
  Invalid: "Invalid",
}
const keyMapping = { total: "Total Complaints", open: "Open Complaints", inProgress: "In Progress", closed: "Closed Complaints", closed: "Closed Complaints", }

const colorMap = {
  open: { text: "text-red-600", border: "border-l-red-500", },
  inProgress: { text: "text-amber-600", border: "border-l-amber-500", },
  closed: { text: "text-green-600", border: "border-l-green-500", },
  total: { text: "text-blue-600", border: "border-l-blue-500", },
  "Done Regular Services": {
    text: "text-blue-600", border: "border-l-blue-500",
  },
  "Pending Regular Services": {
    text: "text-sky-500", border: "border-l-sky-400",
  },
  "Missed Regular Services": {
    text: "text-indigo-700", border: "border-l-indigo-700",
  },
  Invalid: { text: "text-gray-500", border: "border-l-gray-400", },
  "Done Products Services": { text: "text-violet-600", border: "border-l-violet-500", },
  "Pending Products Services": {
    text: "text-fuchsia-400", border: "border-l-fuchsia-300",
  },
  "Missed Products Services": { text: "text-purple-700", border: "border-l-purple-700", },
};


const ClientDashboard = () => {
  const dispatch = useDispatch();
  const [toggle, setToggle] = useState(sessionStorage.getItem("ClientDashboardToggle") || "Complaint");
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState("");
  const { user } = useSelector((store) => store.helper);

  const { data: adminDash = { latestComplaints: [], complaintData: [] }, isLoading, error } =
    useClientAdminDashboardQuery(user?.client, {
      skip: !user?.client, selectFromResult: ({ data, isLoading, isError, error }) => ({
        data: data ?? { latestComplaints: [], complaintData: [] },
        isLoading,
        error
      }),
      refetchOnReconnect: true,
    });

  const { data: clientDash, isLoading: clgLoading } = useAdminDashboardQuery(user.client, {
    skip: !user.client,
  });
  console.log(clientDash)
  const { data: unschedule, isLoading: unscLoading } = useGetUnscheduledReportsQuery({
    refetchOnReconnect: true, // ✅
  });

  const { data: client } = useGetSingleClientQuery(user?.client, { skip: !user?.client });

  // Filter data efficiently using useMemo
  const complaints = useMemo(() => {
    if (statusFilter.length > 0) {
      return clientDash?.all.filter(cl => cl.complaintDetails.status === statusFilter)
    }
    if (!clientDash?.latestComplaints) return [];
    return clientDash.latestComplaints.filter(lat => lat.type === toggle);
  }, [toggle, clientDash, statusFilter]);

  const handleCards = (value) => {
    const map = { open: "Open", inProgress: "In Progress", closed: "Close", "Done Regular Services": "Done", "Done Products Services": "Done" }
    const status = map[value]

    if (["Close", "In Progress", "Open"].includes(status)) {
      setStatusFilter(status)
      setToggle("Complaint")
      window.scrollTo({
        top: document.documentElement.scrollHeight - window.innerHeight - 10, behavior: "smooth"
      })
    }
    if (["Done"].includes(value)) {
      setStatusFilter(value)
      setToggle("Regular")
      window.scrollTo({
        top: document.documentElement.scrollHeight - window.innerHeight - 100, behavior: "smooth"
      })
    }
  }
  const handleChange = (e) => {
    if (e.target.value) {
      setToggle(e.target.value)
      sessionStorage.setItem("ClientDashboardToggle", e.target.value)
    }
  }
  const { statusCounts, ...allData } = adminDash?.dashBoardData || {};
  const statusCount = Object.assign({}, ...(adminDash?.dashBoardData?.statusCounts?.map(s => ({ [s._id]: s.count })) || []));

  const dashData = adminDash?.dashBoardData;
  const { complaints: complaintsData, monthlyData, products, services } = clientDash?.summary || {}

  const prObj = Object.fromEntries((products?.scheduleCount ?? []).map(p => ([prMapped[p.label], p.count])))
  const regObj = Object.fromEntries((services?.scheduleCount ?? []).map(p => ([regMapped[p.label], p.count])))

  const statsStrips = { ...complaintsData, ...prObj, ...regObj }

  return (
    <section className="p-2 bg-slate-50/50 min-h-screen font-sans">
      {isLoading ? (
        <Loading />
      ) : error ? (
        <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      ) : (
        <div className="max-w-7xl mx-auto">

          {/* Design 2: Symmetrical Split Header */}
          <div className="mb-3 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-200 pb-3 ">
            <div className="w-full">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Welcome back, {user?.name}
              </h1>
              <div className="flex items-center gap-5 w-full">
                <p className="text-slate-500 text-sm mt-1">
                  Here is your dashboard overview for today.
                </p>

              </div>
            </div>
          </div>

          {/* Stat Cards */}

          <div className="flex flex-wrap gap-3">
            {Object.entries(statsStrips ?? [])?.map(([key, val]) => {
              if (["Pending Products Services", "Pending Regular Services", "Missed Regular Services", "Missed Products Services"].includes(key)) { return };
              return (
                <React.Fragment key={key}>
                  <StatCard
                    title={keyMapping?.[key] || key}
                    value={val}
                    textColor={colorMap?.[key]?.text}
                    color={colorMap?.[key]?.border}
                    onClick={handleCards}
                    arrkey={key}
                    active={statusFilter}
                  />
                </React.Fragment>
              )
            })}
          </div>

          <div className="my-2">
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 p-2">

              {/* Multiline Chart */}
              <div className="lg:col-span-4 rounded-2xl shadow-md p-4 bg-white min-w-0">
                <h3 className="h4 text-center mb-2">Multiline Chart</h3>
                <div className="w-full overflow-x-auto">
                  <MultiLineChart
                    values={adminDash?.monthlyData}
                    weekly={adminDash?.weekly}
                    toggle="values"
                  />
                </div>
              </div>

              {/* Product Pie */}
              <div className="lg:col-span-2 rounded-2xl shadow-md p-4 bg-white flex items-center justify-center min-w-0">
                <PieChart values={prObj} modelKey="Product Service" />
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2 mt-4">

              {/* Complaint Pie */}
              <div className="rounded-2xl shadow-md p-4 bg-white flex items-center justify-center min-w-0">
                <PieChart values={complaintsData} modelKey="Complaints" />
              </div>

              {/* Regular Pie */}
              <div className="rounded-2xl shadow-md p-4 bg-white flex items-center justify-center min-w-0">
                <PieChart values={regObj} modelKey="Regular Service" />
              </div>

            </div>
          </div>


          {/* Table Section */}
          <div className="mt-12">
            <div className="flex flex-col md:flex-row md:items-center  md:justify-between mb-5">
              <div className="order-2 md:order-1">
                <h4 className="text-lg font-bold text-slate-800"> Latest {toggle !== "Complaint" ? toggle + " service" : toggle} Update</h4>
                <div>
                  {/* <p className="text-xs text-slate-400 mt-0.5">Real-time ticket logging status</p> */}
                  {statusFilter && <div className="text-sm text-gray-700">
                    Filtered By: <span className="font-semibold">{statusFilter}</span> <span className="underline text-cyan-600 text-sm" onClick={() => setStatusFilter("")}>Clear</span>
                  </div>}
                </div>
              </div>
              <div className="ml-auto order-1 md:order-2 flex items-center gap-2">
                {["Complaint", "Regular", "Unscheduled", "Casual"].map((type) => {
                  const isActive = toggle === type;

                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setToggle(type);
                        setStatusFilter('');
                        sessionStorage.setItem("ClientDashboardToggle", type);
                      }}

                      className={`relative text-xs font-bold px-3 py-1.5 rounded tracking-wider uppercase transition-colors duration-150 outline-none ${isActive
                        ? "text-white"
                        : "text-slate-600 bg-slate-200 hover:bg-slate-300"
                        }`}
                    >
                      {/* 2. The Shared Layout Indicator Layer */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute inset-0 mix-blend-multiply bg-cyan-700 rounded -z-10"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}

                      {type === "Regular" ? "Service" : type}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {["Regular", "Complaint"].includes(toggle) && <ComplaintTable data={complaints} user={user} toggle={toggle} />}
              {toggle === "Unscheduled" && <UnScheduledList work={unschedule} />}
              {toggle === "Casual" && <UnScheduledList />}
            </div>
          </div>

        </div>
      )}
    </section>
  );
};

export default ClientDashboard;

