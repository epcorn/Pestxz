import { Link } from "react-router-dom";
import { dateFormat } from "../utils/helperFunctions";

const ComplaintTable = ({ data, user, toggle }) => {
  console.log(data)
  const isRegular = toggle === "Regular"
  return (
    <div className="w-full">
      {/* Header Row - Hidden on Mobile */}
      <div className="hidden md:grid grid-cols-13 gap-2 px-4 md:px-6 *:py-3 bg-gray-50 border-b border-gray-100">
        <p className="col-span-2 font-bold text-[11px] text-gray-400 uppercase tracking-wider">Number</p>
        <p className="col-span-2 font-bold text-[11px] text-gray-400 uppercase tracking-wider">Type</p>
        <p className="col-span-2 font-bold text-[11px] text-gray-400 uppercase tracking-wider">Date</p>
        <p className="col-span-3 font-bold text-[11px] text-gray-400 uppercase tracking-wider">Location</p>
        <p className="col-span-2 font-bold text-[11px] text-gray-400 uppercase tracking-wider text-center">Service</p>
        {isRegular ? <p className="col-span-2 font-bold text-[11px] text-gray-400 uppercase tracking-wider text-center">Serviced By</p> : <p className="col-span-2 font-bold text-[11px] text-gray-400 uppercase tracking-wider text-center">Status</p>}
      </div>

      {/* Data Rows */}
      <div className="divide-y divide-gray-100">
        {data?.map((complaint, i) => (
          <div
            key={complaint._id}
            className="grid grid-cols-1 md:grid-cols-13 gap-2 px-4 md:px-6 py-4 items-center hover:bg-gray-50 transition-colors"
          >
            {/* Complaint Number */}
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-gray-400 md:hidden uppercase mb-1">Number</p>
              {/* {user?.rights?.raise || user?.rights?.close ? ( */}
              {complaint.complaintDetails?.number ?
                <Link
                  to={`/complaint/${complaint._id}`}
                  className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  #{complaint.complaintDetails?.number}
                </Link>
                : <Link to={`/location/${complaint.location?._id}`} className="text-center">{i + 1}</Link>}

            </div>

            {/* Complaint Type */}
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-gray-400 md:hidden uppercase mb-1">Type</p>
              <p className="text-sm text-gray-600 font-semibold">{complaint.type}</p>
            </div>

            {/* Date */}
            <div className="col-span-2 text-sm text-gray-600">
              <p className="text-[10px] font-bold text-gray-400 md:hidden uppercase mb-1">Date</p>
              {dateFormat(complaint.createdAt)}
            </div>

            {/* Location / Client */}
            <div className="col-span-3 text-sm text-gray-700 font-medium">
              <p className="text-[10px] font-bold text-gray-400 md:hidden uppercase mb-1">Location</p>
              {user?.role === "Admin" ? (
                <span className="text-blue-900 whitespace-break-spaces">{complaint.client?.name}</span>
              ) : (
                <span className="text-gray-600 truncate block whitespace-break-spaces">
                  {`${complaint.location?.floor || ""}, ${complaint.location?.location || ""}`}
                </span>
              )}
            </div>

            {/* Pest Service */}
            <div className="col-span-2 md:text-center text-sm text-gray-800">
              <p className="text-[10px] font-bold text-gray-400 md:hidden uppercase mb-1">Service</p>
              {isRegular ? <span>{complaint.regularService[0].serviceName}</span> : <span> {complaint.complaintDetails?.service?.join(", ")}</span>}
            </div>

            {/* Status */}
            <div className="col-span-2 flex md:justify-center">
              {isRegular ? <p className="text-[10px] font-bold text-gray-400 md:hidden uppercase mb-1 mr-2 self-center">Serviced By</p> : <p className="text-[10px] font-bold text-gray-400 md:hidden uppercase mb-1 mr-2 self-center">Status</p>}

              <span className={`status-pill px-2 py-1 text-sm font-semibold rounded-lg ${complaint?.complaintDetails?.status?.toLowerCase().replace(/\s+/g, "")}`}>
                {isRegular ? <span className="whitespace-nowrap text-xs outline px-2 py-1 rounded-lg  text-gray-600">{complaint.regularService[0].userName}</span> : <span> {complaint?.complaintDetails?.status}</span>}
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
