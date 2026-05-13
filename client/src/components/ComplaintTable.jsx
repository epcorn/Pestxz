import { Link } from "react-router-dom";
import { dateFormat, progress } from "../utils/helperFunctions";

const ComplaintTable = ({ data, user }) => {

  return (
    <div className="w-full">
      {/* Header Row - Hidden on Mobile */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
        <p className="col-span-1 font-bold text-[11px] text-gray-400 uppercase tracking-wider">Sr no.</p>
        <p className="col-span-2 font-bold text-[11px] text-gray-400 uppercase tracking-wider">Number</p>
        <p className="col-span-2 font-bold text-[11px] text-gray-400 uppercase tracking-wider">Date</p>
        <p className="col-span-3 font-bold text-[11px] text-gray-400 uppercase tracking-wider">Location</p>
        <p className="col-span-2 font-bold text-[11px] text-gray-400 uppercase tracking-wider text-center">Service</p>
        <p className="col-span-2 font-bold text-[11px] text-gray-400 uppercase tracking-wider text-center">Status</p>
      </div>

      {/* Data Rows */}
      <div className="divide-y divide-gray-100">
        {data?.map((complaint, i) => (
          <div
            key={complaint._id}
            className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors"
          >
            {/* serial number  */}
            <p className="col-span-1">{i + 1}</p>
            {/* Complaint Number */}
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-gray-400 md:hidden uppercase mb-1">Number</p>
              <Link
                to={`/complaint/${complaint._id}`}
                className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                #{complaint.complaintDetails.number}
              </Link>
            </div>

            {/* Date */}
            <div className="col-span-2 text-sm text-gray-600">
              <p className="text-[10px] font-bold text-gray-400 md:hidden uppercase mb-1">Date</p>
              {dateFormat(complaint.createdAt)}
            </div>

            {/* Location / Client */}
            <div className="col-span-3 text-sm text-gray-700 font-medium">
              <p className="text-[10px] font-bold text-gray-400 md:hidden uppercase mb-1">Location</p>
              {user.role === "Admin" ? (
                <span className="text-blue-900">{complaint.client?.name}</span>
              ) : (
                <span className="text-gray-600 truncate block">
                  {`${complaint.location.floor}, ${complaint.location.location}`}
                </span>
              )}
            </div>

            {/* Pest Service */}
            <div className="col-span-2 md:text-center text-xs text-gray-500 italic">
              <p className="text-[10px] font-bold text-gray-400 md:hidden uppercase mb-1">Service</p>
              {complaint.complaintDetails.service?.join(", ")}
            </div>

            {/* Status */}
            <div className="col-span-2 flex md:justify-center">
              <span className={`status-pill px-2 py-1 text-sm font-semibold rounded-lg ${complaint.complaintDetails.status.toLowerCase().replace(" ", "")}`}>
                {complaint.complaintDetails.status}
              </span>
            </div>
          </div>
        ))}

        {data?.length === 0 && (
          <div className="p-10 text-center text-gray-400 text-sm italic">
            No complaints available to display.
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintTable;
