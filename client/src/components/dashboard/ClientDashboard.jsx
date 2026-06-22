import { RiErrorWarningLine } from "react-icons/ri";
import { IoMdTime } from "react-icons/io";
import { GrInProgress } from "react-icons/gr";
import { GoIssueReopened } from "react-icons/go";
import { AiOutlineFileDone } from "react-icons/ai";
import { motion } from 'motion/react'


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
import { StatCard } from "./AdminDashboard";
import UnScheduledList from "../single_location/UnScheduledList";

const ClientDashboard = () => {
  const [toggle, setToggle] = useState(sessionStorage.getItem("ClientDashboardToggle") || "Complaint");
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState("");
  const { user } = useSelector((store) => store.helper);

  const { data: adminDash = { latestComplaints: [], complaintData: [] }, isLoading, error } =
    useClientAdminDashboardQuery(user?.client, {
      skip: !user?.client, refetchOnMountOrArgChange: true, // ✅
      pollingInterval: 30000,
    });

  const { data: clientDash, isLoading: clgLoading } = useAdminDashboardQuery(user.client, {
    skip: !user.client
  });

  const { data: unschedule, isLoading: unscLoading } = useGetUnscheduledReportsQuery({
    refetchOnMountOrArgChange: true, // ✅
    pollingInterval: 30000,
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
      window.scrollTo({ top: 600, behavior: "smooth" })
    }
    if (["Done"].includes(value)) {
      setStatusFilter(value)
      setToggle("Regular")
      window.scrollTo({ top: 600, behavior: "smooth" })
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

              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="flex flex-wrap gap-3">
            <StatCard
              title={'Open Complaints'}
              value={dashData?.Open || 0}
              textColor={'text-green-600'}
              color={'border-l-red-500'}
              onClick={handleCards}
              arrkey={'Open'}
              active={statusFilter}
            />
            <StatCard
              title={'In Progress'}
              value={dashData?.['In Progress'] || 0}
              textColor={'text-amber-600'}
              color={'border-l-amber-500'}
              onClick={handleCards}
              arrkey={'In Progress'}
              active={statusFilter}
            />
            <StatCard
              title={'Closed Complaints'}
              value={dashData?.Close || 0}
              textColor={'text-green-600'}
              color={'border-l-green-500'}
              onClick={handleCards}
              arrkey={'Close'}
              active={statusFilter}
            />
            <StatCard
              title={'Total Complaints'}
              value={dashData?.allcomplaints || 0}
              textColor={'text-blue-600'}
              color={'border-l-blue-500'}
            />
            {dashData?.statusCounts?.map(st => st?._id !== "Invalid" && (
              <StatCard
                key={st?._id}
                title={st?._id}
                value={st?.count || 0}
                textColor={'text-fuchsia-600'}
                color={'border-l-fuchsia-500'}
                onClick={handleCards}
                arrkey={st?._id}
                active={statusFilter}
              />
            ))}
          </div>


          <div className="flex my-2 gap-5 items-stretch w-full p-4 overflow-x-auto snap-x snap-mandatory *:snap-center">

            {/* Line Chart Container (Takes up remaining space) */}
            <div className="relative flex-1 min-w-[600px] bg-neutral-200 border border-gray-200 p-4 h-full rounded-2xl shadow">
              <h3 className="h4 text-center">Multiline chart</h3>
              <MultiLineChart values={adminDash?.monthlyData} weekly={adminDash.weekly} toggle={"values"} />
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

