import React, { useMemo, useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useAllClientsQuery } from "../../redux/clientSlice";
import { useAdminDashboardQuery } from "../../redux/adminSlice";
import { Link, useNavigate } from "react-router-dom";
import { AssignWork } from "../../pages/Complaints";
import PieChart from "./PieChart";
import MultiLineChart from "./MultiLineChart";

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

// month.product = { Done, Pending, Missed } -> [{ label, count }]
// so it matches the exact shape products.scheduleCount already has.
const nestedToScheduleCount = (statusCounts) =>
  Object.entries(statusCounts || {})
    .map(([label, count]) => ({ label, count: count || 0 }))

function AdminDashboard() {
  const [assignId, setAssignId] = useState(null);
  const [toggle, setToggle] = useState(
    () => sessionStorage.getItem("adminDashboardToggle") || "Complaint"
  );
  // "overall" or a stringified index into monthlyData
  const [selectedMonth, setSelectedMonth] = useState("overall");
  const [selectedClient, setSelectedClient] = useState(null);
  const assignRef = useRef(null);
  const navigate = useNavigate();

  const { user } = useSelector((store) => store.helper);
  const { data: clients = [] } = useAllClientsQuery();
  const { data: adminDash, isLoading: admindashLoading } = useAdminDashboardQuery(
    selectedClient?._id || "select",
    { skip: user?.role !== "Admin", refetchOnReconnect: true }
  );

  useEffect(() => {
    if (!assignId) return;
    const handler = (e) => {
      if (!assignRef.current?.contains(e.target)) setAssignId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [assignId]);

  const handleToggle = (val) => {
    setToggle(val);
    sessionStorage.setItem("adminDashboardToggle", val);
  };
  const isRegular = toggle === "Regular";

  const clientReq = useMemo(
    () => adminDash?.latestComplaints?.filter((item) => item.type === toggle) ?? [],
    [adminDash, toggle]
  );

  const { products, services, complaints, monthlyData } = adminDash?.summary || {};

  const isOverall = selectedMonth === "overall";
  const activeMonth = !isOverall ? monthlyData?.[Number(selectedMonth)] : null;

  // Reset back to "overall" if the client/data changes and the previously
  // selected month index no longer exists (e.g. switching clients).
  useEffect(() => {
    if (!isOverall && !monthlyData?.[Number(selectedMonth)]) {
      setSelectedMonth("overall");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyData]);

  // ---- Complaint stat cards: overall summary vs. one month's slice ----
  const complaintStats = isOverall
    ? {
      open: complaints?.open || 0,
      inProgress: complaints?.inProgress || 0,
      closed: complaints?.closed || 0,
      closeReq: complaints?.closeReq || 0,
      total: complaints?.total || 0,
      reopenCount: complaints?.reopenCount || 0,
    }
    : {
      open: activeMonth?.open || 0,
      inProgress: activeMonth?.inProgress || 0,
      closeReq: activeMonth?.closeReq || 0,
      closed: activeMonth?.closed || 0,
      total: activeMonth?.complaints || 0,
      reopenCount: activeMonth?.reopenCount || 0,
    };
  const { open, inProgress, closed, total, closeReq, reopenCount } = complaintStats;
  // ---- Products / Services blocks: same {total, scheduleCount} shape either way ----
  const productsView = isOverall
    ? products
    : {
      total: products.total,
      scheduleCount: nestedToScheduleCount(activeMonth?.product),
    };

  const servicesView = isOverall
    ? services
    : {
      total: products.total,
      scheduleCount: nestedToScheduleCount(activeMonth?.regular),
    };

  const prObj = Object.fromEntries(
    (productsView?.scheduleCount ?? []).map((p) => [prMapped[p.label], p.count])
  );
  const regObj = Object.fromEntries(
    (servicesView?.scheduleCount ?? []).map((p) => [regMapped[p.label], p.count])
  );

  const pieChartComplaints = isOverall
    ? complaints
    : {
      Open: activeMonth?.open || 0,
      "In Progress": activeMonth?.inProgress || 0,
      Close: activeMonth?.closed || 0,
    };

  return (
    <section className="p-2 md:p-3 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">System Overview</p>
          <h3 className="h3 font-black text-gray-800 mt-1">
            {selectedClient?.name || `All Clients Data (${clients.length})`}
          </h3>
        </div>

        {user.role === "Admin" && (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-xs self-end sm:self-auto">
            <div className="flex items-center gap-2.5">
              <label htmlFor="client-select" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">

              </label>
              <select
                id="client-select"
                onChange={(e) => {
                  const client = clients.find((d) => d._id === e.target.value);
                  setSelectedClient(client || null);
                }}
                className="outline-none text-xs sm:text-sm font-semibold bg-transparent cursor-pointer text-gray-700">
                <option value="">Choose Clients</option>
                {clients.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>


      {/* overall / monthly toggle */}
      <div className="ml-auto bg-white outline outline-gray-600 rounded w-fit px-2 mt-2">
        <select
          className="px-2 py-1 focus:outline-0"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="overall">Overall</option>
          {monthlyData?.map(({ month }, i) => (
            <option key={month + i} value={i}>{month}</option>
          ))}
        </select>
      </div>

      {/* Stat cards */}
      <div className="space-y-4">
        <h3 className="text-gray-600 hidden font-semibold text-center mb-2">Complaints</h3>

        {/* Container for all layout blocks */}
        <div className={`flex flex-col gap-3 ${admindashLoading ? "animate-pulse" : ""}`}>

          {/* Complaints Section */}
          <div className="flex flex-wrap gap-y-1 gap-x-2">
            <StatCard title="Open Complaints" value={open || 0} color="border-l-red-500" textColor="text-red-500" />
            <StatCard title="In Progress" value={inProgress || 0} color="border-l-amber-500" textColor="text-amber-500 animate-pulse" />
            <StatCard title="Closed Complaints" value={closed || 0} color="border-l-green-500" textColor="text-green-500" />
            <StatCard title="Total Complaints" value={total || 0} color="border-l-blue-500" textColor="text-blue-500" />
            <StatCard title="Re Opened" value={reopenCount || 0} color="border-l-blue-500" textColor="text-blue-500" />
            <StatCard title="Close Req" value={closeReq || 0} color="border-l-blue-500" textColor="text-blue-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

            {/* Products Section */}
            {productsView?.scheduleCount?.length > 0 && (
              <div title="products" className="bg-white">
                <h3 className="font-semibold text-gray-600 text-center">Products ({products?.total})</h3>
                <div className="flex flex-wrap gap-x-2 gap-y-1 outline-2 outline-indigo-600 pb-1 rounded-md">
                  {productsView.scheduleCount.map(({ label, count }, i) => (
                    <StatCard key={i} title={label} value={count} color="border-l-indigo-600" textColor="text-indigo-700" />
                  ))}
                </div>
              </div>
            )}

            {/* Services Section */}
            {servicesView?.scheduleCount?.length > 0 && (
              <div title="service" className="bg-white">
                <h3 className="font-semibold text-gray-600 text-center">Services ({services.total})</h3>
                <div className="flex flex-wrap gap-x-2 gap-y-1 rounded-md outline-2 outline-fuchsia-700 pb-1">
                  {servicesView.scheduleCount.map(({ label, count }) =>
                    label !== "Invalid" && (
                      <StatCard key={label} title={label} value={count || 0} color="border-l-fuchsia-600" textColor="text-fuchsia-700" />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* charts  */}
      <div className="my-2">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 ">

          {/* Multiline Chart — always shows the full monthly trend regardless of toggle */}
          <div className="lg:col-span-6 rounded-2xl shadow-md p-2 bg-white min-w-0">

            <div className={`w-full overflow-x-auto ${admindashLoading ? "animate-pulse" : ""}`}>
              <MultiLineChart
                values={monthlyData}
                weekly={adminDash?.weekly}
                toggle="values"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-2 mt-4">

          {/* Product/Service Pie */}
          <div className={`rounded-2xl shadow-md p-4 bg-white flex items-center justify-center min-w-0 ${admindashLoading ? "animate-pulse" : ""}`}>
            <PieChart values={prObj} modelKey="Product Service" />
          </div>

          {/* Complaint Pie */}
          <div className={`rounded-2xl shadow-md p-4 bg-white flex items-center justify-center min-w-0 ${admindashLoading ? "animate-pulse" : ""}`}>
            <PieChart values={pieChartComplaints} modelKey="Complaints" />
          </div>

          {/* Regular Pie */}
          <div className={`rounded-2xl shadow-md p-4 bg-white flex items-center justify-center min-w-0 ${admindashLoading ? "animate-pulse" : ""}`}>
            <PieChart values={regObj} modelKey="Regular Service" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="bg-gray-300 px-4 py-3 flex gap-2">
          {["Complaint", "Regular"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleToggle(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${toggle === tab
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:text-white hover:bg-gray-700"
                }`}>
              {tab === "Complaint" ? "Complaints" : "Services"}
            </button>
          ))}
        </div>

        <div className="w-full overflow-x-auto border border-gray-200">
          <table className="w-full min-w-[900px] border-collapse bg-white text-left text-sm text-gray-500">

            {/* Column headers */}
            <thead className="bg-gray-400 border-b border-gray-200 text-xs font-bold uppercase text-gray-600 tracking-wider ">
              <tr >
                <th scope="col" className="px-2 py-3 text-center">{isRegular ? "Number" : "Complaint No"}</th>
                {!isRegular && <th scope="col" className="px-4 py-3">Assigned to</th>}
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3">{isRegular ? "Serviced by" : "Updated by"}</th>
                <th scope="col" className="px-4 py-3">Client</th>
                <th scope="col" className="px-4 py-3">Status</th>
              </tr>
            </thead>

            {/* Rows Container */}
            <tbody className="divide-y divide-gray-100 bg-white">
              {admindashLoading ? (
                <tr>
                  <td colSpan={isRegular ? 6 : 7} className="p-8 text-center text-gray-400 text-sm">
                    Loading records...
                  </td>
                </tr>
              ) : clientReq.length === 0 ? (
                <tr>
                  <td colSpan={isRegular ? 6 : 7} className="p-8 text-center text-gray-400 text-sm">
                    No recent matching records found.
                  </td>
                </tr>
              ) : (
                clientReq.map((item, i) => (
                  <Row
                    key={item._id}
                    item={item}
                    index={i}
                    isRegular={isRegular}
                    assignId={assignId}
                    assignRef={assignRef}
                    setAssignId={setAssignId}
                    navigate={navigate}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section >
  );
}

export default AdminDashboard;


function Row({ item, index, isRegular, assignId, assignRef, setAssignId, navigate }) {
  const latestUpdate = item?.complaintUpdate?.at(-1);
  const cd = item?.complaintDetails;

  const bgStyle = {
    Open: "bg-red-100",
    "In Progress": "bg-amber-100",
    Close: "bg-green-100",
    "Close Req": "bg-gray-100",
    "Reopen": "bg-blue-100"
  };
  const statusStyle = {
    Open: "bg-red-50 text-red-700 ring-red-600/10",
    "In Progress": "bg-amber-50 text-amber-800 ring-amber-600/10",
    Close: "bg-green-50 text-green-700 ring-green-600/10",
  };

  return (
    <tr
      onClick={() => navigate(isRegular ? `/location/${item?.location?._id}` : `/complaint/${item?._id}`)}
      className={`hover:bg-gray-50/80 transition-colors cursor-pointer text-sm  transition-all text-xs`}
    >
      {/* Column 1 */}
      <td className="px-2 text-center py-4 font-bold text-blue-600 whitespace-nowrap">
        {isRegular ? index + 1 : cd?.number || "—"}
      </td>

      {/* Column 2 (Conditional) */}
      {!isRegular && (
        <td className="px-4 py-4 whitespace-nowrap">
          <div
            ref={assignId === item._id ? assignRef : null}
            className="relative inline-block"
            onClick={(e) => {
              e.stopPropagation();
              setAssignId((prev) => (prev === item._id ? null : item._id));
            }}
          >
            <p className="text-sm font-semibold">
              {cd?.assignedTo?.userName || <span className="">Assign</span>}
            </p>
            {cd?.assignedBy?.userName && (
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[.6rem] md:text-xs font-bold capitalize outline">
                {cd.assignedBy.userName}
              </span>
            )}
            {assignId === item._id && (
              <AssignWork
                complaintId={item._id}
                currentAssgndVal={{ label: cd?.assignedTo?.userName, value: cd?.assignedTo?.userName }}
                show={() => setAssignId(null)}
              />
            )}
          </div>
        </td>
      )}

      {/* Column 3 */}
      <td className="px-4 py-4 text-gray-600 text-xs whitespace-nowrap">
        <p className="font-semibold">{new Date(item.createdAt).toLocaleDateString()}</p>
        <p className="text-gray-400 mt-0.5">
          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </td>

      {/* Column 4 */}
      <td className="px-4 py-4 font-medium text-gray-700 truncate">
        {isRegular
          ? item?.regularService?.[0]?.userName || "—"
          : cd?.status === "Open" ? cd?.userName : latestUpdate?.userName || "—"}
      </td>

      {/* Column 5 & 6 (Merged via colSpan to dynamically align with client header) */}
      <td className="px-4 py-4 text-sm font-normal text-gray-900 truncate">
        {item?.clientName || cd?.clientName || "—"}
      </td>

      {/* Column 7 */}
      <td className="px-4 py-4 whitespace-nowrap">
        {isRegular ? (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10">
            {item?.regularService?.[0]?.action || "Done"}
          </span>
        ) : (
          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset uppercase tracking-wide ${statusStyle[cd?.status] ?? ""}`}>
            {cd?.status || "—"}
          </span>
        )}
      </td>
    </tr>
  );
}


export function StatCard({ active, title, value, color, textColor, arrkey, onClick = () => { } }) {

  const isActive = active === arrkey || active === title;

  return (
    <div title={title}
      className={`bg-gray-50 shadow flex-1 px-3 py-2 md:px-5 md:py-3 rounded-l-xl border border-gray-100 whitespace-nowrap border-l-4 transition-all duration-200 ease-in-out ${color} ${isActive ? "translate-y-1 shadow-md bg-white" : "translate-y-0 cursor-pointer"}`}
      onClick={() => onClick(arrkey || title)}
    >
      <p className="text-[9px] md:text-xs uppercase tracking-wide text-gray-400 font-semibold">{title}</p>
      <p className={`text-lg md:text-2xl font-bold leading-tight ${textColor}`}>{value}</p>
    </div>
  );
}