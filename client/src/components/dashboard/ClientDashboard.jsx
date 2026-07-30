import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { useAdminDashboardQuery, useDashboardMonthlyTrendQuery } from "../../redux/adminSlice";
import { useGetSingleClientQuery } from "../../redux/clientSlice";

import Loading from "../Loading";
import AlertMessage from "../AlertMessage";
import ComplaintTable from "../ComplaintTable";
import PieChart from "./PieChart";
import MultiLineChart from "./MultiLineChart";
import { StatCard } from "./AdminDashboard";
import UnScheduledList from "../single_location/UnScheduledList";

// Products Services
const prMapped = {
  Done: "Done ",
  Missed: "Missed",
  Pending: "Pending",
};

// Regular Services
const regMapped = {
  Done: "Done ",
  Missed: "Missed",
  Pending: "Pending",
  Invalid: "Invalid",
};

const keyMapping = {
  total: "Total Complaints",
  open: "Open Complaints",
  inProgress: "In Progress",
  closeReq: "Close Requested",
  closed: "Closed Complaints",
  reopenCount: "Re Opened",
};

const colorMap = {
  open: { text: "text-red-600", border: "border-l-red-500" },
  inProgress: { text: "text-amber-600", border: "border-l-amber-500" },
  closeReq: { text: "text-orange-600", border: "border-l-orange-500" },
  closed: { text: "text-emerald-600", border: "border-l-emerald-500" },
  total: { text: "text-blue-600", border: "border-l-blue-500" },
  reopenCount: { text: "text-cyan-600", border: "border-l-cyan-500" },
};

// const prMapped = {
//   Done: "Done Products Services",
//   Missed: "Missed Products Services",
//   Pending: "Pending Products Services",
// };
// const regMapped = {
//   Done: "Done Regular Services",
//   Missed: "Missed Regular Services",
//   Pending: "Pending Regular Services",
//   Invalid: "Invalid",
// };

const ClientDashboard = () => {
  const [toggle, setToggle] = useState(
    sessionStorage.getItem("ClientDashboardToggle") || "Complaint"
  );
  const [selectedState, setSelectedState] = useState({ month: "overall", date: "" });
  const [statusFilter, setStatusFilter] = useState("");

  const navigate = useNavigate();
  const { user } = useSelector((store) => store.helper);

  const {
    data: clientDash,
    isLoading: clgLoading,
    error: clgError,
  } = useAdminDashboardQuery(
    {
      id: user?.client,
      filter: selectedState?.month,
      startDate: selectedState?.month !== "overall" ? selectedState?.date : "",
    },
    { skip: !user?.client }
  );

  const { data: monthlyTrend } = useDashboardMonthlyTrendQuery(user?.client || null);

  const { data: client } = useGetSingleClientQuery(user?.client, { skip: !user?.client });

  // Filter data efficiently
  const complaints = useMemo(() => {
    const latest = Array.isArray(clientDash?.latestComplaints) ? clientDash?.latestComplaints : [];

    if (statusFilter && statusFilter.length > 0) {
      return latest?.filter((cl) => cl?.complaintDetails?.status === statusFilter) || [];
    }

    if (toggle === "Complaint") return clientDash?.latestComplaints || [];
    if (toggle === "Regular") return clientDash?.latestServices || [];
    return [];
  }, [toggle, clientDash, statusFilter]);



  const handleCards = (value) => {
    const map = {
      open: "Open",
      inProgress: "In Progress",
      closeReq: "Close Req",
      closed: "Close",
      "Done Regular Services": "Done",
      "Done Products Services": "Done",
    };
    const status = map[value];

    if (["Close", "In Progress", "Open", "Close Req"].includes(status)) {
      setStatusFilter(status);
      setToggle("Complaint");
      window.scrollTo({
        top: document.documentElement.scrollHeight - window.innerHeight - 10,
        behavior: "smooth",
      });
    }

    if (value === "Done") {
      setStatusFilter(value);
      setToggle("Regular");
      window.scrollTo({
        top: document.documentElement.scrollHeight - window.innerHeight - 100,
        behavior: "smooth",
      });
    }
  };

  const { complaints: complaintsData = {}, products, services, casualCounts, unscheduledCounts } = clientDash?.summary || {};

  const { open, inProgress, closed, total, closeReq, reopenCount } =
    complaintsData;

  console.log(clientDash)

  const prObj = Object.fromEntries(
    (products?.scheduleCount ?? []).map((p) => [
      prMapped[p.label] || p.label,
      p.count,
    ]),
  );

  const regObj = Object.fromEntries(
    (services?.scheduleCount ?? []).map((p) => [
      regMapped[p.label] || p.label,
      p.count,
    ]),
  );

  return (
    <section className="p-2 bg-slate-50/50 min-h-screen font-sans">
      {clgLoading ? (
        <Loading />
      ) : clgError ? (
        <AlertMessage>{clgError?.data?.msg || clgError.error}</AlertMessage>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-3 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-200 pb-3">
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

            {/* Filter Toggle */}
            <div className="bg-white border w-fit ml-auto border-slate-300 rounded-lg px-2 shrink-0">
              <select
                className="px-2 py-1.5 text-sm font-semibold text-slate-700 focus:outline-0 bg-transparent cursor-pointer"
                value={selectedState.month}
                onChange={(e) => setSelectedState((prev) => ({ ...prev, month: e.target.value }))}
              >
                <option value="overall">Overall</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </select>
              {selectedState.month !== "overall" && (
                <input type="date" onChange={(e) => setSelectedState(prev => ({ ...prev, date: e.target.value }))}
                />
              )}
            </div>
          </div>

          {/* Stat Cards */}
          <div className="flex flex-wrap gap-3">
            <div
              className={`flex flex-col gap-3 ${clgLoading ? "animate-pulse" : ""}`}>
              {/* Complaints Section */}
              <div className="flex flex-wrap gap-y-1 gap-x-2">
                <StatCard
                  title="Open Complaints"
                  value={open || 0}
                  color="border-l-red-500"
                  textColor="text-red-500"
                />
                <StatCard
                  title="In Progress"
                  value={inProgress || 0}
                  color="border-l-amber-500"
                  textColor="text-amber-500 animate-pulse"
                />
                <StatCard
                  title="Closed Complaints"
                  value={closed || 0}
                  color="border-l-green-500"
                  textColor="text-green-500"
                />
                <StatCard
                  title="Total Complaints"
                  value={total || 0}
                  color="border-l-blue-500"
                  textColor="text-blue-500"
                />
                <StatCard
                  title="Re Opened"
                  value={reopenCount || 0}
                  color="border-l-blue-500"
                  textColor="text-blue-500"
                />
                <StatCard
                  title="Close Req"
                  value={closeReq || 0}
                  color="border-l-blue-500"
                  textColor="text-blue-500"
                />
                <StatCard
                  title="Casual Services"
                  value={casualCounts || 0}
                  color="border-l-gray-500"
                  textColor="text-gray-500"
                />
                <StatCard
                  title="Unscheduled Services"
                  value={unscheduledCounts || 0}
                  color="border-l-gray-500"
                  textColor="text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Service Strip Breakdown */}
          <div className="flex flex-col md:flex-row gap-5 mt-2">
            <div className="w-full flex flex-col">
              <h3 className="text-center font-semibold">Product Service ({products?.total})</h3>
              <div className="flex gap-3 outline-2 rounded pb-1 px-1 outline-fuchsia-700">
                {products?.scheduleCount?.map(({ count, label }, i) => (
                  <StatCard
                    key={i}
                    value={count}
                    textColor="text-fuchsia-600"
                    color="border-l-fuchsia-600"
                    title={label}
                  />
                ))}
              </div>
            </div>
            <div className="w-full flex flex-col">
              <h3 className="text-center font-semibold">Regular Service ({services?.total})</h3>
              <div className="flex gap-3 outline-2 rounded pb-1 px-1 outline-amber-700">
                {services?.scheduleCount?.map(
                  ({ count, label }, i) =>
                    label !== "Invalid" && (
                      <StatCard
                        key={i}
                        value={count}
                        textColor="text-amber-600"
                        color="border-l-amber-600"
                        title={label}
                      />
                    )
                )}
              </div>
            </div>
          </div>

          {/* Multiline Chart & Pie Charts */}
          <div className="my-2">
            <div className="rounded-2xl shadow-md p-4 bg-white min-w-0">
              <div className="w-full overflow-x-auto">
                <MultiLineChart values={monthlyTrend} toggle="values" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-2 mt-4">
              <div className="rounded-2xl shadow-md p-4 bg-white flex items-center justify-center min-w-0">
                <PieChart values={prObj} modelKey="Product Service" />
              </div>
              <div className="rounded-2xl shadow-md p-4 bg-white flex items-center justify-center min-w-0">
                <PieChart
                  values={{
                    "Open": complaints?.open || 0,
                    "In Progress": complaints?.inProgress || 0,
                    "Close Req": complaints?.closeReq || 0,
                    "Closed": complaints?.closed || 0,
                  }}
                  modelKey="Complaints"
                />
              </div>
              <div className="rounded-2xl shadow-md p-4 bg-white flex items-center justify-center min-w-0">
                <PieChart values={regObj} modelKey="Regular Service" />
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="mt-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-5">
              <div className="order-2 md:order-1">
                <h4 className="text-lg font-bold text-slate-800">
                  Latest {toggle !== "Complaint" ? `${toggle} service` : toggle} Update
                </h4>
                {statusFilter && (
                  <div className="text-sm text-gray-700">
                    Filtered By: <span className="font-semibold">{statusFilter}</span>{" "}
                    <span
                      className="underline text-cyan-600 text-sm cursor-pointer"
                      onClick={() => setStatusFilter("")}
                    >
                      Clear
                    </span>
                  </div>
                )}
              </div>

              <div className="ml-auto order-1 md:order-2 flex items-center gap-2">
                {["Complaint", "Regular", "Unscheduled", "Casual"].map((type) => {
                  const isActive = toggle === type;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setToggle(type);
                        setStatusFilter("");
                        sessionStorage.setItem("ClientDashboardToggle", type);
                      }}
                      className={`relative text-xs font-bold px-3 py-1.5 rounded tracking-wider uppercase transition-colors duration-150 outline-none ${isActive
                        ? "text-white bg-white/10"
                        : "text-slate-600 bg-slate-200 hover:bg-slate-300"
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute inset-0 mix-blend-hard-light bg-yellow-900 rounded -z-10"
                          transition={{ type: "spring", stiffness: 580, damping: 30 }}
                        />
                      )}
                      {type === "Regular" ? "Service" : type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {["Regular", "Complaint"].includes(toggle) && (
                <ComplaintTable data={complaints} user={user} toggle={toggle} />
              )}
              {toggle === "Unscheduled" && <UnScheduledList work={clientDash?.latestUnschedules} />}
              {toggle === "Casual" && <UnScheduledList type="casual" work={clientDash?.latestCasuals} />}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ClientDashboard;