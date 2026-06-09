import { Link } from "react-router-dom";
import { dateFormat } from "../utils/helperFunctions";
import { useGetSingleUserQuery } from "../redux/userSlice";
import { useState, useEffect, useRef } from "react";
import { AssignWork } from "../pages/Complaints";

const ComplaintTable = ({ data, user, toggle }) => {
  const [toggler, setToggler] = useState({ id: "", status: false });
  const { data: DBUser } = useGetSingleUserQuery(user?._id, { skip: !user?._id });
  const isRegular = toggle === "Regular";
  const portalRef = useRef(null);

  // Close assignment dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (portalRef.current && !portalRef.current.contains(event.target)) {
        setToggler({ id: "", status: false });
      }
    };
    if (toggler.status) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [toggler.status]);

  return (
    <div className="w-full min-h-96 overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
      <div className="min-w-[1024px]">

        {/* Table Header */}
        <div className={`grid ${isRegular ? "grid-cols-10" : "grid-cols-12"} gap-2 px-4 md:px-6 py-3 bg-neutral-600 border-b border-gray-100 text-white text-[11px] font-bold uppercase tracking-wider items-center"`}>
          <p className="col-span-2">Number</p>
          {!isRegular && <p className="col-span-2">Assigned to</p>}
          <p className="col-span-2">Date</p>
          <p className="col-span-2">{isRegular ? "Location" : user?.role === "Admin" ? "Client" : "Raised by"}</p>
          <p className="col-span-2 text-center">Service</p>
          <p className="col-span-2 text-center">{isRegular ? "Serviced By" : "Status"}</p>
        </div>

        {/* Data Rows */}
        <div className="divide-y divide-gray-200">
          {data?.map((complaint, i) => {
            const assignedto = complaint?.complaintDetails?.assignedTo;
            const assignedby = complaint?.complaintDetails?.assignedBy;
            const rowLink = isRegular ? `/location/${complaint.location?._id}` : `/complaint/${complaint._id}`;

            return (
              <div
                key={complaint._id}
                className={`grid ${isRegular ? "grid-cols-10" : "grid-cols-12"} gap-2 px-4 md:px-6 py-4 items-center bg-white hover:bg-neutral-50 transition-colors`}
              >
                {/* Complaint Number */}
                <div className="col-span-2">
                  <Link to={rowLink} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors block w-fit">
                    {complaint.complaintDetails?.number || (i + 2)}
                  </Link>
                </div>

                {/* Assigned To (Portal Control) */}
                {!isRegular && <div
                  className="col-span-2 relative cursor-pointer group select-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    setToggler({ id: complaint._id, status: !toggler.status });
                  }}
                >
                  {assignedto?.status ? (
                    <div className="flex flex-col gap-1 items-start">
                      <span className="text-sm text-gray-700 font-semibold tracking-wide">
                        {assignedto?.userName}
                      </span>
                      {user?.type !== "ClientEmployee" && assignedby?.userName && (
                        <span className="text-[10px] text-gray-500 font-medium bg-gray-50 ring-1 ring-gray-200 px-2 py-0.5 rounded-md">
                          by {assignedby?.userName}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic font-medium block pt-0.5">
                      Not assigned
                    </span>
                  )}

                  {/* Assignment Portal Dropdown Wrapper */}
                  {["Admin", "TeamLeader", "BranchAdmin"].includes(user?.role) &&
                    toggler.status &&
                    toggler.id === complaint._id && (
                      <div
                        ref={portalRef}
                        className="absolute top-full left-0 mt-2 z-30 w-64 bg-white shadow-xl rounded-xl border border-gray-100 p-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AssignWork
                          complaintId={complaint._id}
                          currentAssgndVal={assignedto?.userName || null}
                          show={(val) => setToggler({ id: "", status: val })}
                        />
                      </div>
                    )}
                </div>}

                {/* Date */}
                <div className="col-span-2">
                  <Link to={rowLink} className="text-sm text-gray-600 block hover:text-gray-900">
                    {dateFormat(complaint.createdAt)}
                  </Link>
                </div>

                {/* Location / Client */}
                <div className="col-span-2">
                  <Link to={rowLink} className="text-sm font-medium block hover:opacity-85">
                    {!isRegular ? (
                      user?.role === "Admin" ? (
                        <span className="text-blue-900 whitespace-break-spaces">{complaint.client?.name}</span>
                      ) : (
                        <span className="text-blue-900 whitespace-break-spaces">{complaint.complaintDetails?.userName}</span>
                      )
                    ) : ( 
                      <span className="text-gray-600 block whitespace-break-spaces truncate">
                        {`${complaint.location?.floor || ""}, ${complaint.location?.location || ""}`}
                      </span>
                    )}
                  </Link>
                </div>

                {/* Pest Service */}
                <div className="col-span-2 text-center text-sm text-gray-800">
                  {isRegular ? (
                    <span>{complaint.regularService?.[0]?.serviceName}</span>
                  ) : (
                    <span>{complaint.complaintDetails?.service?.join(", ")}</span>
                  )}
                </div>

                {/* Status Column */}
                <div className="col-span-2 flex justify-center text-center">
                  {isRegular ? (
                    <span className="whitespace-nowrap text-xs font-semibold border border-gray-300 px-2 py-1 rounded-lg text-gray-600 bg-gray-50">
                      {complaint.regularService?.[0]?.userName}
                    </span>
                  ) : (
                    <span className={`px-2 py-1 text-xs font-bold rounded-lg uppercase tracking-wide status-pill ${complaint?.complaintDetails?.status?.toLowerCase().replace(/\s+/g, "")}`}>
                      {complaint?.complaintDetails?.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {data?.length === 0 && (
            <div className="p-10 text-center text-gray-400 text-sm italic bg-white">
              No complaints available to display.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ComplaintTable;