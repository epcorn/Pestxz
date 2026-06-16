import { RiErrorWarningLine } from "react-icons/ri";
import { IoMdTime } from "react-icons/io";
import { GrInProgress } from "react-icons/gr";
import { GoIssueReopened } from "react-icons/go";
import { AiOutlineFileDone } from "react-icons/ai";


import { IoLockClosed, IoLockOpen } from "react-icons/io5";
import { TbProgressAlert } from "react-icons/tb";

import { useSelector } from "react-redux";
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

const stats = [
  // { id: 1, name: "Total Complaints", value: "allcomplaints", icon: <RiErrorWarningLine className="w-3 h-3 md:w-5 md:h-5" />, bg: "bg-slate-400", bd: "border-l-slate-600", type: "com" },
  { id: 2, name: "Open Complaints", value: "Open", icon: <IoMdTime className="w-3 h-3 md:w-5 md:h-5" />, bg: "bg-blue-600", bd: "border-l-blue-600", type: "com", text: "text-blue-700" },
  { id: 3, name: "In Progress", value: "In Progress", icon: <GrInProgress className="w-3 h-3 md:w-5 md:h-5" />, bg: "bg-amber-500", bd: "border-l-amber-600", type: "com", text: "text-amber-700" },
  { id: 4, name: "Closed Complaints", value: "Close", icon: <IoLockClosed className="w-3 h-3 md:w-5 md:h-5" />, bg: "bg-emerald-600", bd: "border-l-emerald-600", type: "com", text: "text-emerald-700" },
  // { id: 5, name: "Reopened Complaints", value: "reopenCount", icon: <GoIssueReopened className="w-3 h-3 md:w-5 md:h-5" />, bg: "bg-red-600", bd: "border-l-red-600", type: "com", text: "text-red-700" },
  { id: 6, name: "Services Completed", value: "completedServices", icon: <AiOutlineFileDone className="w-3 h-3 md:w-5 md:h-5" />, bg: "bg-blue-600", bd: "border-l-blue-600", type: "reg", text: "text-green-700" },
];

const ClientDashboard = () => {
  const [toggle, setToggle] = useState(sessionStorage.getItem("ClientDashboardToggle") || "Complaint");
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState("")


  const { user } = useSelector((store) => store.helper);

  const { data: adminDash = { latestComplaints: [], complaintData: [] }, isLoading, error } =
    useClientAdminDashboardQuery(user?.client, { skip: !user?.client });

  const { data: clientDash, isLoading: clgLoading } = useAdminDashboardQuery(user.client, {
    skip: !user.client
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
    if (["Close", "In Progress", "Open"].includes(value)) {
      setStatusFilter(value)
      setToggle("Complaint")
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

  console.log(adminDash)

  return (
    <section className="p-4 md:px-8 bg-slate-50/50 min-h-screen font-sans">
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
                <UnscheduledNotification />
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="flex flex-wrap gap-3">
            {stats.map((item, index) => (
              <div key={item.id} className={`${item.type === "com" ? "bg-red-100" : "bg-blue-100"} ${statusFilter === item.value ? "outline-2 shadow-2xl -translate-y-1" : ""} flex-1 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-l-4 ${item?.bd}`} onClick={() => handleCards(item.value)}>
                <div className="w-full py-3 px-3">
                  <div className="text-[.6rem] md:text-sm font-semibold text-slate-500 truncate text-center mb-3 flex items-center gap-2">
                    <div className={`${item.bg} p-1 rounded-lg text-white`}> {item.icon} </div>
                    <span>{item.name} </span>
                  </div>
                  <div className="text-center">
                    <h3 className={`text-3xl font-bold tracking-tight ${item.text}`}>
                      {adminDash?.dashBoardData?.[item.value]}
                    </h3>
                  </div>
                </div>

              </div>
            ))}
          </div>

          <div className="flex my-2 gap-5 items-stretch w-full p-4 overflow-x-auto snap-x snap-mandatory *:snap-center">

            {/* Line Chart Container (Takes up remaining space) */}
            <div className="relative flex-1 min-w-[600px] bg-neutral-200 border border-gray-200 p-4 h-full rounded-2xl shadow">
              <h3 className="h4 text-center">Multiline chart</h3>
              <MultiLineChart values={adminDash?.monthlyData} weekly={adminDash.weekly} toggle={"values"}/>
              {/* <select name="" id=""></select> */}
            </div>

            {/* Pie Chart Container (Fixed, tight fit) */}
            <div className="relative w-full md:w-[350px] flex items-center justify-center border border-gray-300 p-4 rounded-2xl bg-neutral-200 shadow">
              <PieChart values={{ ...allData, ...statusCount }} />
            </div>

          </div>


          {/* Table Section */}
          <div className="mt-12">
            <div className="flex flex-col md:flex-row md:items-center  md:justify-between mb-5">
              <div className="order-2 md:order-1">
                <h4 className="text-lg font-bold text-slate-800"> Latest {toggle === "Regular" ? "Regular service" : "Complaints"} Update</h4>
                <div>
                  {/* <p className="text-xs text-slate-400 mt-0.5">Real-time ticket logging status</p> */}
                  {statusFilter && <div className="text-sm text-gray-700">
                    Filtered By: <span className="font-semibold">{statusFilter}</span> <span className="underline text-cyan-600 text-sm" onClick={() => setStatusFilter("")}>Clear</span>
                  </div>}
                </div>
              </div>
              <div className="ml-auto order-1 md:order-2 flex items-center gap-2">
                {["Complaint", "Regular"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setToggle(type);
                      setStatusFilter('')
                      sessionStorage.setItem("ClientDashboardToggle", type);
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded tracking-wider uppercase transition-colors duration-150 ${toggle === type
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
