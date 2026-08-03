import React, { useMemo, useState, useRef } from "react";
import { useSelector } from "react-redux";

import {
  useAdminDashboardQuery,
  useDashboardMonthlyTrendQuery,
} from "../../redux/adminSlice";

import Loading from "../Loading";
import AlertMessage from "../AlertMessage";
import ComplaintTable from "../ComplaintTable";
import PieChart from "./PieChart";
import MultiLineChart from "./MultiLineChart";
import { StatCard } from "./AdminDashboard";
import UnScheduledList from "../single_location/UnScheduledList";

const getStatusColors = (label, type) => {
  const norm = label?.toLowerCase() || "";
  if (type === "product") {
    if (norm.includes("done"))
      return { border: "border-l-cyan-500", text: "text-cyan-600" };
    if (norm.includes("pending"))
      return { border: "border-l-purple-500", text: "text-purple-600" };
    if (norm.includes("missed"))
      return { border: "border-l-pink-500", text: "text-pink-600" };
  }
  if (type === "service") {
    if (norm.includes("done"))
      return { border: "border-l-blue-500", text: "text-blue-600" };
    if (norm.includes("pending"))
      return { border: "border-l-slate-400", text: "text-slate-600" };
    if (norm.includes("missed"))
      return { border: "border-l-orange-500", text: "text-orange-600" };
  }
  return { border: "border-l-gray-400", text: "text-gray-600" };
};

const prMapped = {
  Done: "Done Products Services",
  Missed: "Missed Products Services",
  Pending: "Pending Products Services",
};

const regMapped = {
  Done: "Done Regular Services",
  Missed: "Missed Regular Services",
  Pending: "Pending Regular Services",
  Invalid: "Invalid",
};

const ClientDashboard = () => {
  const [toggle, setToggle] = useState(
    sessionStorage.getItem("ClientDashboardToggle") || "Complaint",
  );
  const [selectedState, setSelectedState] = useState({
    month: "overall",
    date: "",
  });
  const [statusFilter, setStatusFilter] = useState("");

  const tableRef = useRef(null);
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
    { skip: !user?.client },
  );

  const { data: monthlyTrend } = useDashboardMonthlyTrendQuery(
    user?.client || null,
  );

  // Filter complaints by status if statusFilter is active
  const complaints = useMemo(() => {
    const latest = Array.isArray(clientDash?.latestComplaints)
      ? clientDash?.latestComplaints
      : [];

    if (statusFilter && statusFilter.length > 0) {
      return (
        latest?.filter((cl) => cl?.complaintDetails?.status === statusFilter) ||
        []
      );
    }

    if (toggle === "Complaint") return clientDash?.latestComplaints || [];
    if (toggle === "Regular") return clientDash?.latestServices || [];
    return [];
  }, [toggle, clientDash, statusFilter]);

  // Handle clicking on stat cards to filter and scroll to table
  const handleComplaintCardClick = (statusKey) => {
    const map = {
      "Open Complaints": "Open",
      "In Progress": "In Progress",
      "Closed Complaints": "Close",
      "Close Req": "Close Req",
    };

    const status = map[statusKey];
    
    if (status) setStatusFilter(status);

    setToggle("Complaint");
    sessionStorage.setItem("ClientDashboardToggle", "Complaint");

    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const {
    complaints: complaintsData = {},
    products,
    services,
    casualCounts,
    unscheduledCounts,
  } = clientDash?.summary || {};
  const { open, inProgress, closed, total, closeReq, reopenCount } =
    complaintsData;

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
              <p className="text-slate-500 text-sm mt-1">
                Here is your dashboard overview for today.
              </p>
            </div>

            <div className="bg-white border w-fit ml-auto border-slate-300 rounded-lg px-2 shrink-0">
              <select
                className="px-2 py-1.5 text-sm font-semibold text-slate-700 focus:outline-0 bg-transparent cursor-pointer"
                value={selectedState.month}
                onChange={(e) =>
                  setSelectedState((prev) => ({
                    ...prev,
                    month: e.target.value,
                  }))
                }>
                <option value="overall">Overall</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </select>
              {selectedState.month !== "overall" && (
                <input
                  type="date"
                  onChange={(e) =>
                    setSelectedState((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              )}
            </div>
          </div>

          {/* Stat Cards */}
          <div className="flex flex-wrap gap-3">
            <div
              className={`flex flex-col gap-3 w-full ${clgLoading ? "animate-pulse" : ""}`}>
              <div className="flex flex-wrap gap-y-1 gap-x-2">
                <StatCard
                  title="Open Complaints"
                  value={open || 0}
                  color="border-l-red-500"
                  textColor="text-red-500"
                  onClick={handleComplaintCardClick}
                />
                <StatCard
                  title="In Progress"
                  value={inProgress || 0}
                  color="border-l-amber-500"
                  textColor="text-amber-500 animate-pulse"
                  onClick={handleComplaintCardClick}
                />
                <StatCard
                  title="Closed Complaints"
                  value={closed || 0}
                  color="border-l-emerald-500"
                  textColor="text-emerald-500"
                  onClick={handleComplaintCardClick}
                />
                <StatCard
                  title="Total Complaints"
                  value={total || 0}
                  color="border-l-blue-500"
                  textColor="text-blue-500"
                  onClick={handleComplaintCardClick}
                />
                <StatCard
                  title="Re Opened"
                  value={reopenCount || 0}
                  color="border-l-purple-500"
                  textColor="text-purple-500"
                  onClick={handleComplaintCardClick}
                />
                <StatCard
                  title="Close Req"
                  value={closeReq || 0}
                  color="border-l-yellow-500"
                  textColor="text-yellow-500"
                  onClick={handleComplaintCardClick}
                />
                <StatCard
                  title="Casual Services"
                  value={casualCounts || 0}
                  color="border-l-slate-500"
                  textColor="text-slate-600"
                />
                <StatCard
                  title="Unscheduled Services"
                  value={unscheduledCounts || 0}
                  color="border-l-slate-500"
                  textColor="text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Service Strip Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {products?.scheduleCount?.length > 0 && (
              <div title="products" className="bg-white p-2 rounded-md">
                <h3 className="font-semibold text-gray-600 text-center mb-1">
                  Products ({products?.total})
                </h3>
                <div className="flex flex-wrap gap-x-2 gap-y-1 outline-2 outline-purple-500/30 pb-1 rounded-md p-1">
                  {products?.scheduleCount?.map(({ label, count }, i) => {
                    const colors = getStatusColors(label, "product");
                    return (
                      <StatCard
                        key={i}
                        title={label}
                        value={count}
                        color={colors.border}
                        textColor={colors.text}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {services?.scheduleCount?.length > 0 && (
              <div title="service" className="bg-white p-2 rounded-md">
                <h3 className="font-semibold text-gray-600 text-center mb-1">
                  Services ({services.total})
                </h3>
                <div className="flex flex-wrap gap-x-2 gap-y-1 rounded-md outline-2 outline-blue-500/30 pb-1 p-1">
                  {services?.scheduleCount?.map(({ label, count }) => {
                    if (label === "Invalid") return null;
                    const colors = getStatusColors(label, "service");
                    return (
                      <StatCard
                        key={label}
                        title={label}
                        value={count || 0}
                        color={colors.border}
                        textColor={colors.text}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Charts Section */}
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
                    Open: complaintsData?.open || 0,
                    "In Progress": complaintsData?.inProgress || 0,
                    "Close Req": complaintsData?.closeReq || 0,
                    Closed: complaintsData?.closed || 0,
                  }}
                  modelKey="Complaints"
                />
              </div>
              <div className="rounded-2xl shadow-md p-4 bg-white flex items-center justify-center min-w-0">
                <PieChart values={regObj} modelKey="Regular Service" />
              </div>
            </div>
          </div>

          {/* Table Section with Ref for scrolling */}
          <div ref={tableRef} className="mt-8 scroll-mt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
              <div className="order-2 md:order-1">
                <h4 className="text-lg font-bold text-slate-800">
                  Latest {toggle !== "Complaint" ? `${toggle} service` : toggle}{" "}
                  Update
                </h4>
                {statusFilter && (
                  <div className="text-sm text-gray-700">
                    Filtered By:{" "}
                    <span className="font-semibold">{statusFilter}</span>{" "}
                    <span
                      className="underline text-cyan-600 text-sm cursor-pointer"
                      onClick={() => setStatusFilter("")}>
                      Clear
                    </span>
                  </div>
                )}
              </div>

              <div className="ml-auto order-1 md:order-2 flex items-center gap-2">
                {["Complaint", "Regular", "Unscheduled", "Casual"].map(
                  (type) => {
                    const isActive = toggle === type;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setToggle(type);
                          setStatusFilter("");
                          sessionStorage.setItem("ClientDashboardToggle", type);
                        }}
                        className={`relative text-xs font-bold px-3 py-1.5 rounded tracking-wider uppercase transition-colors duration-150 outline-none ${
                          isActive
                            ? "text-white bg-blue-600"
                            : "text-slate-600 bg-slate-200 hover:bg-slate-300"
                        }`}>
                        {type === "Regular" ? "Service" : type}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {["Regular", "Complaint"].includes(toggle) && (
                <ComplaintTable data={complaints} user={user} toggle={toggle} />
              )}
              {toggle === "Unscheduled" && (
                <UnScheduledList work={clientDash?.latestUnschedules} />
              )}
              {toggle === "Casual" && (
                <UnScheduledList
                  type="casual"
                  work={clientDash?.latestCasuals}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ClientDashboard;
