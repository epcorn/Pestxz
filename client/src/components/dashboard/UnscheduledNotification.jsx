import { FaBell } from "react-icons/fa";
import { useGetUnscheduledReportsQuery } from "../../redux/locationSlice";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function UnscheduledNotification({ id, user }) {
  const [showNotif, setShowNotif] = useState(false);
  const navigate = useNavigate();
  const { data: unscheduled = [], isLoading: unscLoading } = useGetUnscheduledReportsQuery(id || undefined);

  const sliced = unscheduled
  console.log(sliced)
  return (
    <div className="relative p-1 outline outline-gray-200 rounded-full w-fit ml-auto z-30">
      {/* Bell Icon Trigger */}
      <div
        className="cursor-pointer hover:rotate-12 transition-all w-fit p-2 text-gray-600 hover:text-gray-900"
        onClick={() => setShowNotif(!showNotif)}
      >
        <FaBell size={20} />
      </div>

      {/* Dropdown Panel */}
      {showNotif && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-50">
          <h3 className="font-bold p-3 border-b border-gray-100 text-sm text-gray-800">
            Unscheduled Service Notification
          </h3>

          <div className="max-h-80 overflow-y-auto p-2">
            {unscLoading ? (
              <p className="text-center py-6 text-sm font-medium text-gray-500">Loading...</p>
            ) : sliced.length === 0 ? (
              <p className="text-center py-6 text-sm text-gray-400">No new notifications</p>
            ) : (
              <ul className="space-y-1">
                {sliced.map((un, i) => (
                  <li
                    key={un._id}
                    className="text-sm bg-gray-50 hover:bg-gray-100 p-2 rounded-md cursor-pointer transition-colors block"
                    onClick={() => {
                      navigate(`/unschedule/${un._id}`);
                      setShowNotif(false);
                    }}
                  >
                    <p className="text-gray-700 break-words leading-snug">
                      <span className="text-gray-400 mr-1">{i + 1}.</span>
                      <strong>{un.userName}</strong> has placed a request for service <strong>{un.raisedBy?.user}</strong> with a comment <span className="italic text-gray-500">({un.comment})</span>
                    </p>
                    <p className="text-[10px] text-right text-gray-400 mt-1">
                      {new Date(un.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UnscheduledNotification;
