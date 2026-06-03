import { Link } from "react-router-dom";
import { dateFormat } from "../utils/helperFunctions";
import { useGetSingleUserQuery } from "../redux/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { toggleModal } from "../redux/helperSlice";
import { AssignWork } from "../pages/Complaints";
import { useState } from "react";

const ComplaintTable = ({ data, user, toggle }) => {
  const [toggler, setToggler] = useState({ id: "", status: false })
  const { data: DBUser } = useGetSingleUserQuery(user?._id, { skip: !user?._id })
  const isRegular = toggle === "Regular";
  console.log(isRegular, toggle)
  return (
    
    <div className="w-full h-full overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
      
      <div className="min-w-[1024px]">

        <div className="grid grid-cols-15 gap-2 px-4 md:px-6 *:py-3 bg-neutral-600 border-b border-gray-100 text-white">
          <p className="col-span-2 font-bold text-[11px] uppercase tracking-wider">Number</p>
          <p className="col-span-2 font-bold text-[11px] uppercase tracking-wider">Type</p>
          <p className="col-span-2 font-bold text-[11px] uppercase tracking-wider">Assigned to</p>
          <p className="col-span-2 font-bold text-[11px] uppercase tracking-wider">Date</p>
          <p className="col-span-3 font-bold text-[11px] uppercase tracking-wider">{isRegular ? "Location" : user.role === "Admin" ? "Client" : "Raised by"}</p>
          <p className="col-span-2 font-bold text-[11px] uppercase tracking-wider text-center">Service</p>
          {isRegular ? <p className="col-span-2 font-bold text-[11px]  uppercase tracking-wider text-center">Serviced By</p> : <p className="col-span-2 font-bold text-[11px] uppercase tracking-wider text-center">Status</p>}
        </div>

        {/* Data Rows */}
        <div className="divide-y divide-black">
          {data?.map((complaint, i) => {
            const assignedto = complaint?.complaintDetails?.assignedTo
            const assignedby = complaint.complaintDetails.assignedBy
            return (
              /* FIXED: Changed 'grid-cols-1 md:grid-cols-15' to 'grid-cols-15' to lock desktop style layout on mobile */
              <div
                key={complaint._id}
                className="grid grid-cols-15 gap-2 px-4 md:px-6 py-4 items-center bg-neutral-200 hover:bg-neutral-200/70 transition-colors"
              >
                {/* Complaint Number */}
                <div className="col-span-2 "
                >
                  {/* FIXED: Added 'hidden' to mobile-only column label badges */}
                  <p className="text-[10px] font-bold text-gray-400 hidden uppercase mb-1">Number</p>
                  {/* {user?.rights?.raise || user?.rights?.close ? ( */}
                  {complaint.complaintDetails?.number ?
                    <h2
                      className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors relative w-fit"
                      onClick={() => setToggler({ id: complaint._id, status: true })}
                    >
                      {complaint.complaintDetails?.number}
                      {toggler.id === complaint._id &&
                        <div onClick={(e) => e.stopPropagation()}>
                          <AssignWork complaintId={complaint._id} currentAssgndVal={assignedto?.userName || null} show={setToggler} />
                        </div>
                      }
                    </h2>
                    : <h2 className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors pl-3">{i + 2}</h2>}
                </div>

                {/* Complaint Type */}
                <Link to={isRegular ? `/location/${complaint.location?._id}` : `/complaint/${complaint._id}`} className="col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 hidden uppercase mb-1">Type</p>
                  <p className="text-sm text-gray-600 font-semibold"><span>{complaint.type}</span>
                  </p>
                </Link>
                {/* assigned  */}
                <Link to={isRegular ? `/location/${complaint.location?._id}` : `/complaint/${complaint._id}`} className="col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 hidden uppercase mb-1">Assigned to</p>
                  {assignedto?.status ? <p className="text-sm text-gray-600 font-semibold flex flex-col">
                    <span>{assignedto?.userName}</span>
                    <span className="text-[0.6rem] outline w-fit px-2 rounded-lg">{assignedby.userName}</span>
                  </p> : <p>Not assigned</p>}
                </Link>

                {/* Date */}
                <Link to={isRegular ? `/location/${complaint.location?._id}` : `/complaint/${complaint._id}`} className="col-span-2 text-sm text-gray-600">
                  <p className="text-[10px] font-bold text-gray-400 hidden uppercase mb-1">Date</p>
                  {dateFormat(complaint.createdAt)}
                </Link>

                {/* Location / Client */}
                <Link to={isRegular ? `/location/${complaint.location?._id}` : `/complaint/${complaint._id}`} className="col-span-3 text-sm text-gray-700 font-medium">
                  <p className="text-[10px] font-bold text-gray-400 hidden uppercase mb-1">{isRegular ? "Location" : user.role === "Admin" ? "Client" : "Raised by"}</p>
                  {!isRegular ? (user.role === "Admin" ? (
                    <span className="text-blue-900 whitespace-break-spaces">{complaint.client?.name}</span>
                  ) : <span className="text-blue-900 whitespace-break-spaces">{complaint.complaintDetails.userName}</span>) : (
                    <span className="text-gray-600 truncate block whitespace-break-spaces">
                      {`${complaint.location?.floor || ""}, ${complaint.location?.location || ""}`}
                    </span>
                  )}
                </Link>

                {/* Pest Service */}
                {/* FIXED: Changed 'col-span-2 md:text-center' to 'col-span-2 text-center' for consistent desktop alignment */}
                <div className="col-span-2 text-center text-sm text-gray-800">
                  <p className="text-[10px] font-bold text-gray-400 hidden uppercase mb-1">Service</p>
                  {isRegular ? <span>{complaint.regularService[0].serviceName}</span> : <span> {complaint.complaintDetails?.service?.join(", ")}</span>}
                </div>

                {/* Status */}
                {/* FIXED: Changed 'md:justify-center' to 'justify-center' and hidden label behaviors */}
                <div className="col-span-2 flex justify-center">
                  <p className="text-[10px] font-bold text-gray-400 hidden uppercase mb-1 mr-2 self-center">Status</p>

                  <span className={`status-pill px-2 py-1 text-sm font-semibold rounded-lg ${complaint?.complaintDetails?.status?.toLowerCase().replace(/\s+/g, "")}`}>
                    {isRegular ? <span className="whitespace-nowrap text-xs outline px-2 py-1 rounded-lg  text-gray-600">{complaint.regularService[0].userName}</span> : <span> {complaint?.complaintDetails?.status}</span>}
                  </span>
                </div>

              </div>
            )
          })}

          {data?.length === 0 && (
            <div className="p-10 text-center text-gray-400 text-sm italic">
              No complaints available to display.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ComplaintTable;
