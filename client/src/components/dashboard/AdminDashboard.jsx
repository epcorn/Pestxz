import React, { useMemo, useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useAllClientsQuery } from "../../redux/clientSlice";
import { useAdminDashboardQuery } from "../../redux/adminSlice";
import { Link, useNavigate } from "react-router-dom";
import { AssignWork } from "../../pages/Complaints";

function AdminDashboard() {
  const [assignId, setAssignId] = useState(null);
  const [toggle, setToggle] = useState(
    () => sessionStorage.getItem("adminDashboardToggle") || "Complaint"
  );
  const [selectedClient, setSelectedClient] = useState(null);
  const assignRef = useRef(null);
  const navigate = useNavigate();

  const { user } = useSelector((store) => store.helper);
  const { data: clients = [] } = useAllClientsQuery();
  const { data: adminDash, isLoading } = useAdminDashboardQuery(
    selectedClient?._id || "select",
    { skip: user?.role !== "Admin" }
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

  return (
    <section className="p-2 md:p-6 bg-gray-50 min-h-screen space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">System Overview</p>
          <h3 className="text-2xl font-black text-gray-800 mt-1">
            {selectedClient?.name || `All Clients Data (${clients.length})`}
          </h3>
        </div>

        {user.role === "Admin" && (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-xs self-end sm:self-auto">
            <div className="flex items-center gap-2.5">
              <label htmlFor="client-select" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Client
              </label>
              <select
                id="client-select"
                onChange={(e) => {
                  const client = clients.find((d) => d._id === e.target.value);
                  setSelectedClient(client || null);
                }}
                className="outline-none text-xs sm:text-sm font-semibold bg-transparent cursor-pointer text-gray-700">
                <option value="">Total Statistics</option>
                {clients.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {adminDash?.complaintData?.map((d, i) => (
          <React.Fragment key={i}>
            <StatCard title="Open" value={d.open} color="border-l-red-500" textColor="text-red-500" />
            <StatCard title="In Progress" value={d.inProgress} color="border-l-amber-500" textColor="text-amber-500" />
            <StatCard title="Closed" value={d.closed} color="border-l-green-500" textColor="text-green-500" />
            <StatCard title="Total" value={d.total} color="border-l-blue-500" textColor="text-blue-500" />
          </React.Fragment>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">

        {/* Tabs */}
        <div className="bg-gray-800 px-4 py-3 flex gap-2">
          {["Complaint", "Regular"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleToggle(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${toggle === tab
                  ? "bg-blue-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}>
              {tab === "Complaint" ? "Complaints" : "Services"}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {/* Column headers */}
          <div className={`min-w-[900px] grid ${isRegular ? "grid-cols-6" : "grid-cols-7"} gap-4 px-4 py-3 bg-gray-50 border-b text-xs font-bold uppercase text-gray-600 tracking-wider`}>
            <p>Number</p>
            {!isRegular && <p>Assigned to</p>}
            <p>Date</p>
            <p>{isRegular ? "Serviced by" : "Raised by"}</p>
            <p className="col-span-2">Client</p>
            <p className="text-center">Status</p>
          </div>

          {/* Rows */}
          <div className="min-w-[900px] divide-y divide-gray-100">
            {isLoading ? (
              <p className="p-8 text-center text-gray-400 text-sm">Loading records...</p>
            ) : clientReq.length === 0 ? (
              <p className="p-8 text-center text-gray-400 text-sm">No recent matching records found.</p>
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
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;


function Row({ item, index, isRegular, assignId, assignRef, setAssignId, navigate }) {
  const latestUpdate = item?.complaintUpdate?.at(-1);
  const cd = item?.complaintDetails;

  const statusStyle = {
    Open: "bg-red-50 text-red-700 ring-red-600/10",
    "In Progress": "bg-amber-50 text-amber-800 ring-amber-600/10",
    Close: "bg-green-50 text-green-700 ring-green-600/10",
  };

  return (
    <div
      onClick={() => navigate(isRegular ? `/location/${item?.location?._id}` : `/complaint/${item?._id}`)}
      className={`grid ${isRegular ? "grid-cols-6" : "grid-cols-7"} gap-4 px-4 py-4 text-sm items-center hover:bg-gray-50/80 transition-colors cursor-pointer`}>

      <div className="font-bold text-blue-600">
        {isRegular ? index + 1 : cd?.number || "—"}
      </div>

      {!isRegular && (
        <div
          ref={assignId === item._id ? assignRef : null}
          className="whitespace-nowrap relative"
          onClick={(e) => {
            e.stopPropagation();
            setAssignId((prev) => (prev === item._id ? null : item._id));
          }}>
          <span className="block text-sm font-semibold">
            {cd?.assignedTo?.userName || <span className="text-gray-600">Assign</span>}
          </span>
          {cd?.assignedBy?.userName && (
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-bold capitalize tracking-wide border border-gray-200">
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
      )}

      <div className="text-gray-600 text-xs">
        <p className="font-semibold">{new Date(item.createdAt).toLocaleDateString()}</p>
        <p className="text-gray-400 mt-0.5">
          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <div className="font-medium text-gray-700 truncate">
        {isRegular
          ? item?.regularService?.[0]?.userName || "—"
          : cd?.status === "Open" ? cd?.userName : latestUpdate?.userName || "—"}
      </div>

      <div className="col-span-2 text-sm">
        {item?.clientName || cd?.clientName || "—"}
      </div>

      <div className="text-center">
        {isRegular ? (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10">
            {item?.regularService?.[0]?.action || "Done"}
          </span>
        ) : (
          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset uppercase tracking-wide ${statusStyle[cd?.status] ?? ""}`}>
            {cd?.status || "—"}
          </span>
        )}
      </div>
    </div>
  );
}


function StatCard({ title, value, color, textColor }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-xs p-4 border-l-4 ${color}`}>
      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">{title}</p>
      <p className={`text-2xl font-black ${textColor}`}>{value}</p>
    </div>
  );
}