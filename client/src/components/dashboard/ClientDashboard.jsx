import { FaBug } from "react-icons/fa";
import { IoLockClosed, IoLockOpen } from "react-icons/io5";
import { TbProgressAlert } from "react-icons/tb";
import { useSelector } from "react-redux";
import { useAdminDashboardQuery, useClientAdminDashboardQuery } from "../../redux/adminSlice";
import Loading from "../Loading";
import AlertMessage from "../AlertMessage";
import ComplaintTable from "../ComplaintTable";
import { useGetSingleClientQuery } from "../../redux/clientSlice";
import { useEffect, useMemo, useState } from "react";

const stats = [
  { id: 1, name: "Total Complaints", icon: <FaBug className="w-6 h-6" />, bg: "bg-slate-400" },
  { id: 2, name: "Open", icon: <IoLockOpen className="w-6 h-6" />, bg: "bg-blue-600" },
  { id: 3, name: "In Progress", icon: <TbProgressAlert className="h-6 w-6" />, bg: "bg-amber-500" },
  { id: 4, name: "Closed", icon: <IoLockClosed className="w-6 h-6" />, bg: "bg-emerald-600" },
];

const ClientDashboard = () => {
  const [toggle, setToggle] = useState(sessionStorage.getItem("ClientDashboardToggle") || "Complaint")
  const { user } = useSelector((store) => store.helper);

  const { data: adminDash = { latestComplaints: [], complaintData: [] }, isLoading, error } =
    useClientAdminDashboardQuery(user?.client, { skip: !user?.client });

  const { data: clientDash, isLoading: clgLoading } = useAdminDashboardQuery(user.client, {
    skip: !user.client
  });

  const { data: client } = useGetSingleClientQuery(user?.client, { skip: !user?.client });

  // Filter data efficiently using useMemo
  const complaints = useMemo(() => {
    if (!clientDash?.latestComplaints) return [];
    return clientDash.latestComplaints.filter(lat => lat.type === toggle);
  }, [toggle, clientDash]);

  const handleChange = (e) => {
    if (e.target.value) {
      setToggle(e.target.value)
      sessionStorage.setItem("ClientDashboardToggle", e.target.value)
    }
  }
  console.log(clientDash)
  return (
    <section className="p-4 md:px-8 bg-slate-50/50 min-h-screen font-sans">
      {isLoading ? (
        <Loading />
      ) : error ? (
        <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      ) : (
        <div className="max-w-7xl mx-auto">

          {/* Design 2: Symmetrical Split Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Welcome back, {user?.name}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Here is your dashboard overview for today.
              </p>
            </div>

            {/* Clean Right-Aligned Client Name (No Box) */}
            {client?.name && (
              <div className="md:text-right border-l-4 md:border-l-0 md:border-r-4 border-cyan-600 pl-4 md:pl-0 md:pr-4 py-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Enterprise Account
                </p>
                <h2 className="text-xl font-extrabold text-cyan-900 tracking-wide">
                  {client.name}
                </h2>
              </div>
            )}
          </div>

          {/* Stat Cards */}
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item, index) => (
              <div key={item.id} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500 truncate">
                    {item.name}
                  </p>
                  <div className={`${item.bg} p-2.5 rounded-lg text-white`}>
                    {item.icon}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                    {adminDash?.complaintData?.[index] ?? 0}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* Table Section */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h4 className="text-lg font-bold text-slate-800">Latest {toggle === "Regular" ? "Regular service" : toggle} Update</h4>
                <p className="text-xs text-slate-400 mt-0.5">Real-time ticket logging status</p>
              </div>
              <div className="flex items-center gap-2">
                {["Complaint", "Regular"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setToggle(type);
                      sessionStorage.setItem("ClientDashboardToggle", type);
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded tracking-wider uppercase transition-colors duration-150
        ${toggle === type
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                  >
                    {type === "Regular" ? "Regular Service" : type}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <ComplaintTable data={complaints} user={user} toggle={toggle} />
            </div>
          </div>

        </div>
      )}
    </section>
  );
};

export default ClientDashboard;
