import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useAllClientsQuery } from '../../redux/clientSlice'
import { useAdminDashboardQuery } from '../../redux/adminSlice';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  const [toggel, setToggel] = useState('latest')
  const [clientReq, setClientReq] = useState([])
  const [selectedClient, setSelectedClient] = useState(null);
  const { user } = useSelector(store => store.helper)

  const { data: clients = [] } = useAllClientsQuery();

  const { data: adminDash, isLoading } = useAdminDashboardQuery(selectedClient?._id, {
    // skip: user?.role !== "Admin"
  });
  const handleChange = (e) => {
    const { value } = e.target;
    setSelectedClient(value === "select" ? null : clients.find(d => d._id === value))
  }
  console.log(adminDash)
  useEffect(() => {
    if (!adminDash) return;
    const dataSource = toggel === "all" ? adminDash.all : adminDash.latestComplaints
    if (selectedClient && selectedClient !== null)
      setClientReq(dataSource.filter(data => data?.client === selectedClient?._id) || [])
    else
      setClientReq(toggel === "all" ? adminDash?.all : adminDash?.latestComplaints)
  }, [toggel, selectedClient, adminDash])
  
  

  return (
    <section className="p-2 md:p-8 bg-gray-50 min-h-screen font-sans">
      {/* Header Section */}
      <h2 className='text-center text-2xl font-bold '>Express Pesticides Private Limited</h2>
      <p className='text-center text-xs font-semibold text-gray-600 '>Pest management division</p>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <p className="text-gray-500 text-sm font-medium">System Overview</p>
          <h3 className="text-2xl font-bold text-gray-800">
            {selectedClient?.name || `All Clients Data (${clients.length})`}
          </h3>
        </div>

        {user.role === "Admin" && (
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
            <label htmlFor="select" className="text-xs font-bold text-gray-400 uppercase ml-2">Client</label>
            <select id="select" onChange={handleChange} className="border-none focus:ring-0 outline-0 text-sm font-semibold text-gray-700 cursor-pointer bg-transparent" >
              <option value="select">Total Statistics</option>
              {clients.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Stat Cards Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {adminDash?.complaintData?.map((d, i) => (
          <React.Fragment key={i}>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Open</p>
              <p className="text-3xl font-bold text-red-500">{d.open}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">In Progress</p>
              <p className="text-3xl font-bold text-amber-500">{d.inProgress}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Closed</p>
              <p className="text-3xl font-bold text-emerald-500">{d.closed}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total</p>
              <p className="text-3xl font-bold text-blue-500">{d.total}</p>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Complaints Grid Section */}
      <div className="bg-gray-200 rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-500 text-white font-semibold px-6 py-4 border-b border-gray-100 flex gap-3">
          <button type='button' className={`font-bold px-2 py-1 rounded-lg cursor-pointer transition-all ${toggel !== "all" && "bg-blue-300 shadow-2xs text-black"}`} onClick={() => setToggel("latest")}>Latest Complaints</button>
          <button type='button' className={`"font-bold px-2 py-1 rounded-lg cursor-pointer transition-all ${toggel === "all" && "bg-blue-300 shadow-2xs text-black"}`} onClick={() => setToggel("all")}>All Complaints</button>
        </div>

        {/* Header Row - Fixed to 12 columns */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
          <p className="font-bold col-span-1 text-[11px] text-gray-400 uppercase">Sr.</p>
          <p className="font-bold col-span-2 text-[11px] text-gray-400 uppercase">Number</p>
          <p className="font-bold col-span-2 text-[11px] text-gray-400 uppercase">Date & Time</p>
          <p className="font-bold col-span-2 text-[11px] text-gray-400 uppercase">Type</p>
          <p className="font-bold col-span-3 text-[11px] text-gray-400 uppercase">Raised/Closed By</p>
          <p className="font-bold col-span-2 text-[11px] text-gray-400 uppercase text-center">Status</p>
        </div>

        {/* Data Rows */}
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-10 text-center text-gray-400">Loading complaints...</div>
          ) : clientReq?.length > 0 ? (
            clientReq?.map((latest, i) => (
              <div key={latest._id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                {/* Desktop Sr No */}
                <div className="hidden md:block col-span-1 text-sm text-gray-400">{i + 1}</div>

                {/* Number */}
                <div className="col-span-1 md:col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 md:hidden uppercase mb-1">Number</p>
                  <Link to={`/complaint/${latest._id}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                    #{latest?.complaintDetails.number}
                  </Link>
                </div>

                {/* Date */}
                <div className="col-span-1 md:col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 md:hidden uppercase mb-1">Date</p>
                  <p className="text-sm text-gray-600">
                    {latest?.createdAt.split("T")[0]} <span className="hidden md:inline text-gray-300">|</span> {latest?.createdAt.split("T")[1].slice(0, 5)}
                  </p>
                </div>

                {/* Type */}
                <div className="col-span-1 md:col-span-2 text-sm text-gray-600 md:italic">{latest?.type}</div>

                {/* Raised/Closed By */}
                <div className="col-span-1 md:col-span-3 text-sm text-gray-700 font-medium">
                  <p className="text-[10px] font-bold text-gray-400 md:hidden uppercase mb-1">Raised/Closed By</p>
                  {latest.complaintDetails.status === "Open"
                    ? latest.complaintDetails.userName
                    : latest.complaintUpdate?.at(-1)?.userName || latest.complaintDetails.userName}
                </div>

                {/* Status */}
                <div className="col-span-1 md:col-span-2 flex md:justify-center">
                  <span className={`status-pill whitespace-nowrap px-3 py-1 font-semibold rounded-lg text-sm ${latest.complaintDetails.status.toLowerCase().replace(" ", "")}`}>
                    {latest.complaintDetails.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="p-10 text-center text-gray-500">No complaints found</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default AdminDashboard;
