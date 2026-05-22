import { FaBug } from "react-icons/fa";
import { IoLockClosed, IoLockOpen } from "react-icons/io5";
import { TbProgressAlert } from "react-icons/tb";
import { useSelector } from "react-redux";
import { useAdminDashboardQuery, useClientAdminDashboardQuery } from "../../redux/adminSlice";
import Loading from "../Loading";
import AlertMessage from "../AlertMessage";
import ComplaintTable from "../ComplaintTable";
import { useAllComplaintsQuery } from "../../redux/serviceSlice";

// Safety extraction of stats
const stats = [
  {
    id: 1,
    name: "Total Complaints",
    icon: <FaBug className="w-6 h-6" />,
    bg: "bg-gray-400",
  },
  {
    id: 2,
    name: "Open",
    icon: <IoLockOpen className="w-6 h-6" />,
    bg: "bg-blue-500",
  },
  {
    id: 3,
    name: "In Progress",
    icon: <TbProgressAlert className="h-6 w-6" />,
    bg: "bg-yellow-500",
  },
  {
    id: 4,
    name: "Closed",
    icon: <IoLockClosed className="w-6 h-6" />,
    bg: "bg-green-600",
  },
];

const ClientDashboard = () => {
  const { user } = useSelector((store) => store.helper);
  const {
    data: adminDash = { latestComplaints: [], complaintData: [] },
    isLoading,
    error
  } = useClientAdminDashboardQuery(user?.client, { skip: !user?.client });

  const { data: clientDash, isLoading: clgLoading } = useAdminDashboardQuery(user.client, {
    skip: !user.client
  });
  const { data, isFetching } = useAllComplaintsQuery({
    location: "All",
  });

  console.log(data)

  return (
    <section className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans">
      {isLoading ? (
        <Loading />
      ) : error ? (
        <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <p className="text-gray-500 text-sm font-medium">Dashboard Overview</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Welcome, {user?.name}
            </h1>
          </div>

          {/* Stat Cards */}
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item, index) => (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 shadow-lg sm:px-6"
              >
                <dt>
                  <div className={`absolute rounded-md ${item.bg} p-3`}>
                    {item.icon}
                  </div>
                  <p className="ml-16 truncate font-medium text-gray-600">
                    {item.name}
                  </p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6">
                  <p className="text-xl font-semibold text-gray-900">
                    {adminDash?.complaintData[index]}
                  </p>
                </dd>
              </div>
            ))}
          </div>

          {/* Table Section */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-700">Latest Complaints Update</h4>
              <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-md uppercase">
                Recent Activity
              </span>
            </div>
            

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-1">
              <ComplaintTable data={adminDash.latestComplaints} user={user} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ClientDashboard;
