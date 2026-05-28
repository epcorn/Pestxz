import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useAllClientsQuery } from "../../redux/clientSlice";
import { useAdminDashboardQuery } from "../../redux/adminSlice";
import { Link } from "react-router-dom";

function AdminDashboard() {
  const [toggle, setToggle] = useState("Complaint");
  const [selectedClient, setSelectedClient] = useState(null);

  const { user } = useSelector((store) => store.helper);

  const { data: clients = [] } = useAllClientsQuery();


  const {
    data: adminDash,
    isLoading,
  } = useAdminDashboardQuery(
    selectedClient?._id || "select",
    {
      skip: user?.role !== "Admin",
    }
  );
  console.log(adminDash)

  const handleChange = (e) => {
    const { value } = e.target;

    if (value === "select") {
      setSelectedClient(null);
      return;
    }

    const client = clients.find((d) => d._id === value);

    setSelectedClient(client || null);
  };

  // FILTER DATA
  const clientReq = useMemo(() => {
    if (!adminDash?.latestComplaints) return [];

    if (toggle === "Complaint") {
      return adminDash.latestComplaints.filter(
        (item) => item.type === "Complaint"
      );
    }

    return adminDash.latestComplaints.filter(
      (item) => item.type === "Regular"
    );
  }, [adminDash, toggle]);

  const isRegular = toggle === "Regular";

  return (
    <section className="p-2 md:p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-2 md:mb-6">
        <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800">
          Express Pesticides Private Limited
        </h2>

        <p className="text-center text-sm font-medium text-gray-500 mt-1">
          Pest Management Division
        </p>
      </div>

      {/* TOP SECTION */}
      <div className="flex flex-col md:flex-row lg:items-center justify-between gap-2 md:gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500 font-medium">
            System Overview
          </p>

          <h3 className="text-2xl font-bold text-gray-800 mt-1">
            {selectedClient?.name ||
              `All Clients Data (${clients.length})`}
          </h3>
        </div>

        {/* CLIENT SELECT */}
        {user.role === "Admin" && (
          <div className="bg-white h-fit border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <label
                htmlFor="select"
                className="text-xs font-bold uppercase text-gray-400"
              >
                Client
              </label>

              <select
                id="select"
                onChange={handleChange}
                className="outline-none text-sm font-semibold bg-transparent cursor-pointer"
              >
                <option value="select">
                  Total Statistics
                </option>

                {clients.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {adminDash?.complaintData?.map((d, i) => (
          <React.Fragment key={i}>
            <StatCard
              title="Open"
              value={d.open}
              color="text-red-500"
            />

            <StatCard
              title="In Progress"
              value={d.inProgress}
              color="text-amber-500"
            />

            <StatCard
              title="Closed"
              value={d.closed}
              color="text-green-500"
            />

            <StatCard
              title="Total"
              value={d.total}
              color="text-blue-500"
            />
          </React.Fragment>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* TOP BAR */}
        <div className="bg-gray-700 text-white px-4 py-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setToggle("Complaint")}
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${toggle === "Complaint"
              ? "bg-blue-300 text-black"
              : "bg-gray-600"
              }`}
          >
            Complaints
          </button>

          <button
            type="button"
            onClick={() => setToggle("Regular")}
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${toggle === "Regular"
              ? "bg-blue-300 text-black"
              : "bg-gray-600"
              }`}
          >
            Services
          </button>
        </div>

        {/* TABLE WRAPPER */}
        <div className="overflow-x-auto">
          {/* TABLE HEADER */}
          <div className="min-w-[900px] grid grid-cols-6 gap-4 px-4 py-3 bg-gray-100 border-b text-xs font-bold uppercase text-gray-500">
            <p>Number</p>
            <p>Date</p>
            <p>Type</p>
            <p>{isRegular ? "Serviced By" : "Raised By"}</p>
            <p>Client</p>
            <p className="text-center">Status</p>
          </div>

          {/* TABLE BODY */}
          <div className="min-w-[900px]">
            {isLoading ? (
              <div className="p-6 text-center text-gray-400">
                Loading...
              </div>
            ) : clientReq?.length > 0 ? (
              clientReq.map((latest, i) => {
                const latestUpdate =
                  latest?.complaintUpdate?.at(-1);

                const regularUser =
                  latest?.regularService?.[0]?.userName;

                const regularAction =
                  latest?.regularService?.[0]?.action;


                return (
                  <div
                    key={latest._id}
                    className="grid grid-cols-6 gap-4 px-4 py-4 border-b text-sm items-center hover:bg-gray-50 transition"
                  >
                    {/* NUMBER */}
                    <div>
                      {isRegular ?
                        <Link to={`/location/${latest?.location._id}`} className="font-semibold text-blue-600 hover:text-blue-800">
                          #{i + 1}
                        </Link> : <Link
                          to={`/complaint/${latest._id}`}
                          className="font-semibold text-blue-600 hover:text-blue-800"
                        >
                          #
                          {latest?.complaintDetails?.number}
                        </Link>}
                    </div>

                    {/* DATE */}
                    <div className="text-gray-600">
                      <p>
                        {new Date(
                          latest.createdAt
                        ).toLocaleDateString()}
                      </p>

                      <p className="text-xs text-gray-400">
                        {new Date(
                          latest.createdAt
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* TYPE */}
                    <div>
                      <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">
                        {latest?.type}
                      </span>
                    </div>

                    {/* USER */}
                    <div className="font-medium text-gray-700">
                      {isRegular
                        ? regularUser || "-"
                        : latest?.complaintDetails
                          ?.status === "Open"
                          ? latest?.complaintDetails
                            ?.userName
                          : latestUpdate?.userName || "-"}
                    </div>

                    {/* CLIENT */}
                    <div>
                      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                        {latest?.clientName ||
                          latest?.complaintDetails
                            ?.clientName ||
                          "-"}
                      </span>
                    </div>

                    {/* STATUS */}
                    <div className="text-center">
                      {isRegular ? (
                        <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold">
                          {regularAction || "-"}
                        </span>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${latest?.complaintDetails
                            ?.status === "Open"
                            ? "bg-red-100 text-red-600"
                            : latest?.complaintDetails
                              ?.status ===
                              "In Progress"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                            }`}
                        >
                          {latest?.complaintDetails
                            ?.status || "-"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-gray-400">
                No data found
              </div>
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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-center">
      <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">
        {title}
      </p>

      <p className={`text-3xl font-bold ${color}`}>
        {value}
      </p>
    </div>
  );
}