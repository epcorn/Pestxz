import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useAllClientsQuery } from "../../redux/clientSlice";
import { useAdminDashboardQuery } from "../../redux/adminSlice";
import { Link, useNavigate } from "react-router-dom";
import QuickPanel from "./QuickPanel";
import { AssignWork } from "../../pages/Complaints";

function AdminDashboard() {
  const [assign, setAssign] = useState({ id: "", status: false })
  const navigate = useNavigate();
  const [toggle, setToggle] = useState(() => sessionStorage.getItem("adminDashboardToggle") || "Complaint");
  const [selectedClient, setSelectedClient] = useState(null);

  const { user } = useSelector((store) => store.helper);
  const { data: clients = [] } = useAllClientsQuery();

  const { data: adminDash, isLoading } = useAdminDashboardQuery(
    selectedClient?._id || "select",
    {
      skip: user?.role !== "Admin",
    }
  );

  const handleChange = (e) => {
    const { value } = e.target;
    if (value === "select") {
      setSelectedClient(null);
      return;
    }
    const client = clients.find((d) => d._id === value);
    setSelectedClient(client || null);
  };

  const handleToggle = (val) => {
    setToggle(val);
    sessionStorage.setItem("adminDashboardToggle", val);
  };

  const clientReq = useMemo(() => {
    if (!adminDash?.latestComplaints) return [];
    return adminDash.latestComplaints.filter((item) => item.type === toggle);
  }, [adminDash, toggle]);

  const isRegular = toggle === "Regular";

  return (
    <section className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">

      {/* HEADER SECTION AREA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            System Overview
          </p>
          <h3 className="text-2xl font-black text-gray-800 mt-1">
            {selectedClient?.name || `All Clients Data (${clients.length})`}
          </h3>
        </div>

        {/* TOP INTERACTION CONTROLS BAR CONTAINER */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* CLIENT FILTERS SELECTOR CARD */}
          {user.role === "Admin" && (
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-xs">
              <div className="flex items-center gap-2.5">
                <label htmlFor="select" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Client
                </label>
                <select
                  id="select"
                  onChange={handleChange}
                  className="outline-none text-xs sm:text-sm font-semibold bg-transparent cursor-pointer text-gray-700"
                >
                  <option value="select">Total Statistics</option>
                  {clients.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* INTEGRATED QUICK PANEL ICON DROPDOWN ALIGNMENT */}
          {/* <QuickPanel data={adminDash?.latestComplaints} /> */}
        </div>
      </div>

      {/* STATS COUNT GRID CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {adminDash?.complaintData?.map((d, i) => (
          <React.Fragment key={i}>
            <StatCard title="Open" value={d.open} color="text-red-500 border-l-4 border-l-red-500" />
            <StatCard title="In Progress" value={d.inProgress} color="text-amber-500 border-l-4 border-l-amber-500" />
            <StatCard title="Closed" value={d.closed} color="text-green-500 border-l-4 border-l-green-500" />
            <StatCard title="Total" value={d.total} color="text-blue-500 border-l-4 border-l-blue-500" />
          </React.Fragment>
        ))}
      </div>

      {/* COMPLAINTS & SERVICES DATA TABLE TRACKER */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        {/* TAB TOGGLES BAR */}
        <div className="bg-gray-800 px-4 py-3 flex gap-2 border-b border-gray-700">
          <button
            type="button"
            onClick={() => handleToggle("Complaint")}
            className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${toggle === "Complaint" ? "bg-blue-500 text-white shadow-xs" : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
          >
            Complaints
          </button>
          <button
            type="button"
            onClick={() => handleToggle("Regular")}
            className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${toggle === "Regular" ? "bg-blue-500 text-white shadow-xs" : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
          >
            Services
          </button>
        </div>

        {/* SCROLLABLE RESPONSIVE DATA GRID */}
        <div className="overflow-x-auto">
          <div className={`min-w-[900px] grid ${isRegular ? "grid-cols-6" : "grid-cols-7"} gap-4 px-4 py-3 bg-gray-50 border-b text-xs font-bold uppercase text-gray-400 tracking-wider`}>
            <p>Number</p>
            {!isRegular && <p>Assigned to</p>}
            <p>Date</p>
            <p>{isRegular ? "Serviced By" : "Raised By"}</p>
            <p className="col-span-2">Client</p>
            <p className="text-center">Status</p>
          </div>

          <div className="min-w-[900px] divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm font-medium">Loading records...</div>
            ) : clientReq?.length > 0 ? (
              clientReq.map((latest, i) => {
                const latestUpdate = latest?.complaintUpdate?.at(-1);
                const regularUser = latest?.regularService?.[0]?.userName;
                const regularAction = latest?.regularService?.[0]?.action;
                return (
                  <div
                    key={latest._id}
                    onClick={() => navigate(isRegular ? `/location/${latest?.location?._id}` : `/complaint/${latest?._id}`)}
                    className={`grid ${isRegular?"grid-cols-6": "grid-cols-7"} gap-4 px-4 py-4 text-sm items-center hover:bg-gray-50/80 transition-colors `}
                  >
                    <div className="font-bold text-blue-600" >
                      {isRegular ? i + 1 : latest?.complaintDetails?.number || "—"}
                    </div>

                    {latest.type === "Complaint" && <div>
                      <div className=" whitespace-nowrap relative"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssign((prev) =>
                            prev.id === latest?._id && prev.status
                              ? { id: "", status: false }
                              : { id: latest?._id, status: true }
                          );
                        }}>
                        <span className="block text-sm font-semibold">{latest?.complaintDetails?.assignedTo?.userName || <span className="text-gray-600">Assign</span>}</span>
                        {latest?.complaintDetails?.assignedBy?.userName && <span
                          className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-bold capitalize tracking-wide border border-gray-200">
                          {latest?.complaintDetails?.assignedBy?.userName}
                        </span>}

                        {assign.id === latest?._id && assign.status && <AssignWork
                          complaintId={latest?._id}
                          currentAssgndVal={{ label: latest?.complaintDetails?.assignedTo?.userName, value: latest?.complaintDetails?.assignedTo?.userName }}
                          show={setAssign} />}
                      </div>
                    </div>}

                    <div className="text-gray-600 text-xs">
                      <p className="font-semibold">{new Date(latest.createdAt).toLocaleDateString()}</p>
                      <p className="text-gray-400 mt-0.5">{new Date(latest.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>

                    <div className="font-medium text-gray-700 truncate">
                      {isRegular ? regularUser || "—" : latest?.complaintDetails?.status === "Open" ? latest?.complaintDetails?.userName : latestUpdate?.userName || "—"}
                    </div>

                    <div className="col-span-2">
                      <span className="px-2.5 py-0.5 rounded-full text-sm">
                        {latest?.clientName || latest?.complaintDetails?.clientName || "—"}
                      </span>
                    </div>

                    <div className="text-center">
                      {isRegular ? (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {regularAction || "Done"}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset uppercase tracking-wide ${latest?.complaintDetails?.status === "Open" ? "bg-red-50 text-red-700 ring-red-600/10" :
                          latest?.complaintDetails?.status === "In Progress" ? "bg-amber-50 text-amber-800 ring-amber-600/10" : "bg-green-50 text-green-700 ring-green-600/10"
                          }`}>
                          {latest?.complaintDetails?.status || "—"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">No recent matching records found.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;

function StatCard({ title, value, color }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-xs p-4 text-left ${color}`}>
      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">{title}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  );
}