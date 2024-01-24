import { FaBug } from "react-icons/fa";
import { IoLockClosed, IoLockOpen } from "react-icons/io5";
import { TbProgressAlert } from "react-icons/tb";

import { useSelector } from "react-redux";
import { AlertMessage, ComplaintTable, Loading } from "../components";
import { useClientAdminDashboardQuery } from "../redux/adminSlice";

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

const Dashboard = () => {
  const { user } = useSelector((store) => store.helper);

  const { data, isLoading, error } = useClientAdminDashboardQuery();

  return (
    <div>
      {isLoading ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}
      {!error && data && (
        <>
          <h1 className="text-2xl md:text-4xl font-semibold text-center ">
            Welcome {user.name}
          </h1>
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
                    {data?.complaintData[index]}
                  </p>
                </dd>
              </div>
            ))}
          </div>
          <p className="mb-2 text-lg text-gray-600 font-medium mt-3">
            Latest Complaints Update
          </p>
          <ComplaintTable data={data.latestComplaints} user={user} />
        </>
      )}
    </div>
  );
};
export default Dashboard;
