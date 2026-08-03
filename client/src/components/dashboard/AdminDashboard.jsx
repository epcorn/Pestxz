import React, { useMemo, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAllClientsQuery } from "../../redux/clientSlice";
import { useAdminDashboardQuery, useDashboardMonthlyTrendQuery } from "../../redux/adminSlice";
import { useNavigate } from "react-router-dom";
import { AssignWork } from "../../pages/Complaints";
import PieChart from "./PieChart";
import MultiLineChart from "./MultiLineChart";
import { PEST_MAP } from "../../utils/constData";
import { dateFormat } from "../../utils/helperFunctions";
import UnScheduledList from "../single_location/UnScheduledList";
import ImagesModal from "../modals/ImagesModal";
import { toggleModal } from "../../redux/helperSlice";

// Shared color dynamic resolver
const getStatusColors = (label, type) => {
  const norm = label?.toLowerCase() || "";
  if (type === "product") {
    if (norm.includes("done")) return { border: "border-l-cyan-500", text: "text-cyan-600" };
    if (norm.includes("pending")) return { border: "border-l-purple-500", text: "text-purple-600" };
    if (norm.includes("missed")) return { border: "border-l-pink-500", text: "text-pink-600" };
  }
  if (type === "service") {
    if (norm.includes("done")) return { border: "border-l-blue-500", text: "text-blue-600" };
    if (norm.includes("pending")) return { border: "border-l-slate-400", text: "text-slate-600" };
    if (norm.includes("missed")) return { border: "border-l-orange-500", text: "text-orange-600" };
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

function AdminDashboard() {
  const [assignId, setAssignId] = useState(null);
  const [toggle, setToggle] = useState(
    () => sessionStorage.getItem("adminDashboardToggle") || "Complaint",
  );

  const [selectedState, setSelectedState] = useState({ month: "overall", startDate: "" });
  const [selectedClient, setSelectedClient] = useState(null);
  const assignRef = useRef(null);
  const navigate = useNavigate();

  const { user, isModalOpen } = useSelector((store) => store.helper);
  const { data: clientsData = [] } = useAllClientsQuery();
  const clients = clientsData?.clients;

  const { data: adminDash, isLoading: admindashLoading } =
    useAdminDashboardQuery({
      id: selectedClient?._id || "select",
      filter: selectedState.month,
      startDate: selectedState.month !== "overall" ? selectedState.startDate : ""
    }, {
      skip: !["TeamLeader", "BranchAdmin", "Admin"].includes(user?.role),
    });

  const { data: monthlyTrend } = useDashboardMonthlyTrendQuery(selectedClient?.id ? selectedClient?.id : null);

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

  const clientReq = useMemo(() => {
    if (toggle === "Complaint") return adminDash?.latestComplaints ?? [];
    if (isRegular) return adminDash?.latestServices ?? [];
  }, [adminDash, toggle, isRegular]);

  const { products, services, complaints, pestCounts, casualCounts, unscheduledCounts } =
    adminDash?.summary || {};

  const { open, inProgress, closed, total, closeReq, reopenCount } = complaints || {};

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

  const pieChartComplaints = {
    "Open": complaints?.open || 0,
    "In Progress": complaints?.inProgress || 0,
    "Close Req": complaints?.closeReq || 0,
    "Closed": complaints?.closed || 0,
  };

  return (
    <section className="p-2 md:p-3 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">
            System Overview
          </p>
          <h3 className="h3 font-black text-gray-800 mt-1">
            {selectedClient?.name || `All Clients Data (${clients?.length || 0})`}
          </h3>
        </div>

        {user.role === "Admin" && (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-xs self-end sm:self-auto">
            <div className="flex items-center gap-2.5">
              <select
                id="client-select"
                onChange={(e) => {
                  const client = clients.find((d) => d._id === e.target.value);
                  setSelectedClient(client || null);
                }}
                className="outline-none text-xs sm:text-sm font-semibold bg-transparent cursor-pointer text-gray-700">
                <option value="">Choose Clients</option>
                {clients?.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Date Toggle */}
      <div className="ml-auto bg-white outline outline-gray-600 rounded w-fit px-2 my-2 flex gap-2">
        <select
          className="px-2 py-1 focus:outline-0 text-sm font-semibold"
          value={selectedState.month}
          onChange={(e) => setSelectedState(prev => ({ ...prev, month: e.target.value }))}>
          <option value="overall">Overall</option>
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="custom">Custom</option>
        </select>
        {selectedState?.month !== "overall" && (
          <div className="flex flex-col">
            <label className="text-xs">Choose Start Date</label>
            <input type="date" onChange={(e) => setSelectedState(prev => ({ ...prev, startDate: e.target.value }))} />
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="space-y-4">
        <div className={`flex flex-col gap-3 ${admindashLoading ? "animate-pulse" : ""}`}>
          {/* Complaints Section */}
          <div className="flex flex-wrap gap-y-1 gap-x-2">
            <StatCard title="Open Complaints" value={open || 0} color="border-l-red-500" textColor="text-red-500" />
            <StatCard title="In Progress" value={inProgress || 0} color="border-l-amber-500" textColor="text-amber-500 animate-pulse" />
            <StatCard title="Closed Complaints" value={closed || 0} color="border-l-emerald-500" textColor="text-emerald-500" />
            <StatCard title="Total Complaints" value={total || 0} color="border-l-blue-500" textColor="text-blue-500" />
            <StatCard title="Re Opened" value={reopenCount || 0} color="border-l-purple-500" textColor="text-purple-500" />
            <StatCard title="Close Req" value={closeReq || 0} color="border-l-yellow-500" textColor="text-yellow-500" />
            <StatCard title="Casual Services" value={casualCounts || 0} color="border-l-slate-500" textColor="text-slate-600" />
            <StatCard title="Unscheduled Services" value={unscheduledCounts || 0} color="border-l-slate-500" textColor="text-slate-600" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Products Section */}
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

            {/* Services Section */}
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
                        color={colors?.border || "default-border-color"}
                        textColor={colors?.text || "default-text-color"}
                      />
                    );
                  })}

                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="my-2">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-6 rounded-2xl shadow-md p-2 bg-white min-w-0">
            <div className={`w-full overflow-x-auto ${admindashLoading ? "animate-pulse" : ""}`}>
              <MultiLineChart values={monthlyTrend} toggle="values" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-2 mt-4">
          <div className={`rounded-2xl shadow-md p-4 bg-white flex items-center justify-center min-w-0 ${admindashLoading ? "animate-pulse" : ""}`}>
            <PieChart values={prObj} modelKey="Product Service" />
          </div>
          <div className={`rounded-2xl shadow-md p-4 bg-white flex items-center justify-center min-w-0 ${admindashLoading ? "animate-pulse" : ""}`}>
            <PieChart values={pieChartComplaints} modelKey="Complaints" />
          </div>
          <div className={`rounded-2xl shadow-md p-4 bg-white flex items-center justify-center min-w-0 ${admindashLoading ? "animate-pulse" : ""}`}>
            <PieChart values={regObj} modelKey="Regular Service" />
          </div>
        </div>
      </div>

      {/* Pest Counts */}
      <div className="my-5 w-full outline outline-neutral-500 rounded-lg p-2">
        <h3 className="text-lg font-semibold mb-2">Pest Activity</h3>
        <div className="flex gap-2 flex-wrap">
          {pestCounts && Object.keys(pestCounts).length > 0 ? Object.entries(pestCounts)?.map(([name, count]) => (
            <StatCard key={name} title={PEST_MAP[name] || name} value={count} color='text-rose-500 bg-green-200 border-rose-700' />
          )) : <div className="text-center content-center w-full"><p>No Pest Activity Recorded {selectedState?.month}</p></div>}
        </div>
      </div>

      {/* Table Tabs */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="bg-gray-300 px-4 py-3 flex gap-2">
          {["Complaint", "Regular", "Casuals", "Unschedules"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleToggle(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${toggle === tab
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:text-white hover:bg-blue-700"
                }`}>
              {tab}
            </button>
          ))}
        </div>

        {toggle === "Unschedules" && <UnScheduledList type={"Unschedule"} work={adminDash?.latestUnschedules} />}
        {toggle === "Casuals" && <UnScheduledList type={"casual"} work={adminDash?.latestCasuals} />}
        {toggle === "Complaint" && (
          <ComplaintTable
            rows={clientReq}
            loading={admindashLoading}
            assignId={assignId}
            assignRef={assignRef}
            setAssignId={setAssignId}
            navigate={navigate}
          />
        )}
        {toggle === "Regular" && (
          <RegularServiceTable
            rows={clientReq}
            loading={admindashLoading}
            navigate={navigate}
            isModalOpen={isModalOpen}
          />
        )}
      </div>
    </section>
  );
}

export default AdminDashboard;

// Subcomponents
function ComplaintTable({ rows, loading, assignId, assignRef, setAssignId, navigate }) {
  const complaintStatusStyle = {
    Open: "bg-red-50 text-red-700 ring-red-600/10",
    "In Progress": "bg-amber-50 text-amber-800 ring-amber-600/10",
    Close: "bg-green-50 text-green-700 ring-green-600/10",
  };

  return (
    <div className="w-full overflow-x-auto border border-gray-200">
      <table className="w-full min-w-[900px] border-collapse bg-white text-left text-sm text-gray-500">
        <thead className="bg-gray-400 border-b border-gray-200 text-xs font-bold uppercase text-gray-600 tracking-wider">
          <tr>
            <th scope="col" className="px-2 py-3 text-center">Complaint No</th>
            <th scope="col" className="px-4 py-3">Assigned to</th>
            <th scope="col" className="px-4 py-3">Date</th>
            <th scope="col" className="px-4 py-3">Updated by</th>
            <th scope="col" className="px-4 py-3">Client</th>
            <th scope="col" className="px-4 py-3 max-w-16">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {loading ? (
            <tr><td colSpan={6} className="p-8 text-center text-gray-400 text-sm">Loading records...</td></tr>
          ) : rows?.length ? (
            rows.map((item) => (
              <ComplaintRow
                key={item._id}
                item={item}
                assignId={assignId}
                assignRef={assignRef}
                setAssignId={setAssignId}
                navigate={navigate}
                complaintStatusStyle={complaintStatusStyle}
              />
            ))
          ) : (
            <tr><td colSpan={6} className="p-8 text-center text-gray-400 text-sm">No complaints found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ComplaintRow({ item, assignId, assignRef, setAssignId, navigate, complaintStatusStyle }) {
  const latestUpdate = item?.complaintUpdate?.at(-1);
  const cd = item?.complaintDetails;

  return (
    <tr onClick={() => navigate(`/complaint/${item?._id}`)} className="hover:bg-gray-50/80 transition-colors cursor-pointer text-xs">
      <td className="px-2 text-center py-4 font-bold text-blue-600 whitespace-nowrap">{cd?.number || "—"}</td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div
          ref={assignId === item._id ? assignRef : null}
          className="relative inline-block"
          onClick={(e) => {
            e.stopPropagation();
            setAssignId((prev) => (prev === item._id ? null : item._id));
          }}>
          <p className="text-sm font-semibold">{cd?.assignedTo?.userName || <span>Assign</span>}</p>
          {cd?.assignedBy?.userName && (
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[.6rem] md:text-xs font-bold capitalize outline">
              {cd?.assignedBy?.userName}
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
      <td className="px-4 py-4 text-gray-600 text-sm whitespace-nowrap">{dateFormat(item.createdAt)}</td>
      <td className="px-4 py-4 font-medium text-gray-700 truncate">{cd?.status === "Open" ? cd?.userName : latestUpdate?.userName || "—"}</td>
      <td className="px-4 py-4 text-sm font-normal text-gray-900 truncate">{item?.client?.name || cd?.clientName || "—"}</td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset uppercase tracking-wide ${complaintStatusStyle[cd?.status] ?? ""}`}>
          {cd?.status || "—"}
        </span>
      </td>
    </tr>
  );
}

function RegularServiceTable({ rows, loading, navigate, isModalOpen }) {
  return (
    <div className="w-full overflow-x-auto border border-gray-200">
      <table className="w-full min-w-[900px] border-collapse bg-white text-left text-sm text-gray-500">
        <thead className="bg-gray-400 border-b border-gray-200 text-xs font-bold uppercase text-gray-600 tracking-wider">
          <tr>
            <th scope="col" className="px-2 py-3 text-center">Number</th>
            <th scope="col" className="px-4 py-3">Date</th>
            <th scope="col" className="px-4 py-3 whitespace-nowrap">Pest Count</th>
            <th scope="col" className="px-4 py-3">Serviced by</th>
            <th scope="col" className="px-4 py-3">Client</th>
            <th scope="col" className="px-4 py-3">Service Name</th>
            <th scope="col" className="px-4 py-3">Images</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {loading ? (
            <tr><td colSpan={7} className="p-8 text-center text-gray-400 text-sm">Loading records...</td></tr>
          ) : rows?.length ? (
            rows.map((item, i) => (
              <RegularServiceRow key={item._id} item={item} index={i} navigate={navigate} isModalOpen={isModalOpen} />
            ))
          ) : (
            <tr><td colSpan={7} className="p-8 text-center text-gray-400 text-sm">No regular services found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RegularServiceRow({ item, index, navigate, isModalOpen }) {
  const regs = item?.regularService?.[0];
  const dispatch = useDispatch();

  return (
    <tr onClick={() => navigate(`/location/${item?.location?._id}`)} className="hover:bg-gray-50/80 transition-colors cursor-pointer text-xs">
      <td className="px-2 text-center py-4 font-bold text-blue-600 whitespace-nowrap">{index + 1}</td>
      <td className="px-4 py-4 text-gray-600 text-sm whitespace-nowrap"><div className="font-semibold">{dateFormat(regs?.completedAt)}</div></td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10">
          {regs?.pestCount ?? 0}
        </span>
      </td>
      <td className="px-4 py-4 font-medium text-gray-700 truncate">{regs?.userName || "—"}</td>
      <td className="px-4 py-4 text-sm font-normal text-gray-900 truncate">{item?.client?.name || "—"}</td>
      <td className="px-4 py-4 text-sm font-normal text-gray-900 truncate">{regs?.serviceName || "—"}</td>
      <td className="px-4 py-4 text-sm font-normal text-gray-900 truncate">
        <div className="flex items-center gap-1">
          {regs?.image?.map((img, i) => {
            const modalKey = `img_${item._id}_${i}`;
            return (
              <div key={modalKey}>
                <img
                  src={img}
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(toggleModal({ name: modalKey, status: true }));
                  }}
                  className="max-h-16"
                  alt=""
                />
                {isModalOpen?.[modalKey] && <ImagesModal image={img} name={modalKey} />}
              </div>
            );
          })}
        </div>
      </td>
    </tr>
  );
}

export function StatCard({ active, title = "", value, color, textColor, arrkey = "", pestCount, onClick = () => { } }) {
  const isActive = active === arrkey || active === title;

  return (
    <div
      title={title}
      className={`bg-gray-50 shadow flex-1 px-3 py-2 md:px-5 md:py-3 rounded-l-xl border border-gray-100 whitespace-nowrap border-l-4 transition-all duration-200 ease-in-out ${color} ${isActive ? "translate-y-1 shadow-md bg-white" : "translate-y-0 cursor-pointer"}`}
      onClick={() => onClick(arrkey || title)}>
      <p className="text-[9px] md:text-xs uppercase tracking-wide text-gray-400 font-semibold">{title}</p>
      <p className={`text-lg flex justify-between md:text-2xl font-bold leading-tight ${textColor}`}>
        <span>{value}</span> {pestCount && <span>{pestCount}</span>}
      </p>
    </div>
  );
}