import { Link } from "react-router-dom";
import { dateFormat } from "../utils/helperFunctions";
import { useGetSingleUserQuery } from "../redux/userSlice";
import { useState, useEffect, useRef } from "react";
import { AssignWork } from "../pages/Complaints";

const bgStyle = {
  Open: "bg-red-100",
  "In Progress": "bg-amber-100",
  Close: "bg-green-100",
  "Close Req": "bg-gray-100",
  "Reopen": "bg-blue-100"
};
const statusStyle = {
  Open: "bg-red-50 text-red-700 ring-red-600/10",
  "In Progress": "bg-amber-50 text-amber-800 ring-amber-600/10",
  Close: "bg-green-50 text-green-700 ring-green-600/10",
  "Close Req": "bg-gray-100",
};

const ComplaintTable = ({ data, user, toggle }) => {
  const [toggler, setToggler] = useState({ id: "", status: false });
  const { data: DBUser } = useGetSingleUserQuery(user?._id, { skip: !user?._id });
  const isRegular = toggle === "Regular";
  const portalRef = useRef(null);

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
    <div className="w-full mt-2 overflow-x-auto scrollbar-hide border border-gray-200 rounded-lg shadow-sm bg-white">
      {/* 1. Added flex flex-col to table layout */}
      <table className="min-w-[1024px] w-full flex flex-col table-auto border-collapse">

        {/* 2. Added flex flex-col to thead */}
        <thead className="flex flex-col w-full sticky top-0 z-10">
          
          <tr className="bg-neutral-600 text-white text-sm font-bold uppercase tracking-wider flex w-full">
                        
            <th className="pl-2 py-3 text-center flex-1">Number</th>
            {!isRegular && <th className="pl-2 py-3 text-left flex-1">Assigned To</th>}
            <th className="pl-2 py-3 text-left flex-1">Date</th>
            <th className="pl-2 py-3 text-left flex-1">
              {isRegular ? "Location" : user?.type === "PestEmployee" ? "Client" : "Raised By"}
            </th>
            <th className="pl-2 py-3 flex-1 text-center">Service</th>
            <th className="pl-2 py-3 text-center flex-1">
              {isRegular ? "Serviced By" : "Status"}
            </th>
          </tr>
        </thead>

        {/* 5. Added max-h and overflow-y-auto to tbody along with flex utilities */}
        <tbody className="flex flex-col w-full max-h-[450px] overflow-y-auto scrollbar-hide divide-y outline">
          {data?.map((complaint, i) => {
            const assignedto = complaint?.complaintDetails?.assignedTo;
            const assignedby = complaint?.complaintDetails?.assignedBy;
            const rowLink = isRegular ? `/location/${complaint?.location?._id}` : `/complaint/${complaint._id}`;

            return (
              /* 6. Changed tr to use flex layout matching the thead dimensions */
              <tr key={complaint?._id} className={`flex w-full hover:bg-neutral-50 transition-colors divide-x divide-gray-400 items-center text-xs md:text-sm`}>

                {/* Complaint Number */}
                <td className="pl-2 py-4 text-center flex-1">
                  <Link to={rowLink} className="font-bold text-blue-600 hover:text-blue-800 transition-colors">
                    {complaint.complaintDetails?.number || (i + 2)}
                  </Link>
                </td>

                {/* Assigned To */}
                {!isRegular && (
                  <td
                    className="pl-2 py-4 relative cursor-pointer select-none flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setToggler({ id: complaint._id, status: !toggler.status });
                    }}
                  >
                    {assignedto?.status ? (
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-gray-700 font-semibold tracking-wide">
                          {assignedto?.userName}
                        </span>
                        {user?.type !== "ClientEmployee" && assignedby?.userName && (
                          <span className="text-[.7rem] text-gray-500 font-medium bg-gray-50 ring-1 ring-gray-200 px-2 py-0.5 rounded-md">
                            by {assignedby?.userName}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic font-medium">Not assigned</span>
                    )}

                    {["TeamLeader", "Admin", "BranchAdmin"].includes(user.role) &&
                      toggler.status &&
                      toggler.id === complaint._id && (
                        <div
                          ref={portalRef}
                          className="absolute top-0 left-0 mt-2 z-30 w-64 bg-white shadow-xl rounded-xl border border-gray-100 p-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AssignWork
                            complaintId={complaint._id}
                            currentAssgndVal={assignedto?.userName || null}
                            show={(val) => setToggler({ id: "", status: val })}
                          />
                        </div>
                      )}
                  </td>
                )}

                {/* Date */}
                <td className="pl-2 py-4 flex-1">
                  <Link to={rowLink} className="text-sm text-gray-600 hover:text-gray-900">
                    {dateFormat(complaint.createdAt)}
                  </Link>
                </td>

                {/* Location / Client / Raised By */}
                <td className="pl-2 py-4 flex-1">
                  <Link to={rowLink} className="text-sm font-medium hover:opacity-85">
                    {!isRegular ? (
                      user?.type === "PestEmployee" ? (
                        <span className="text-blue-900 whitespace-break-spaces">{complaint?.complaintDetails.clientName || "cle"}</span>
                      ) : (
                        <span className="text-blue-900 whitespace-break-spaces">{complaint.complaintDetails?.userName}</span>
                      )
                    ) : (
                      <span className="text-gray-600 whitespace-break-spaces truncate block">
                        {`${complaint.location?.floor || ""}, ${complaint.location?.location || ""}`}
                      </span>
                    )}
                  </Link>
                </td>

                {/* Service */}
                <td className="pl-2 py-4 text-sm text-gray-800 text-center flex-1">
                  {isRegular ? (
                    <span>{complaint.regularService?.[0]?.serviceName}</span>
                  ) : (
                    <span>{complaint.complaintDetails?.service?.join(", ")}</span>
                  )}
                </td>

                {/* Status / Serviced By */}
                <td className="pl-2 py-4 text-center flex-1">
                  {isRegular ? (
                    <Link to={rowLink} className="whitespace-nowrap text-xs font-semibold border border-gray-300 px-2 py-1 rounded-lg text-gray-600 bg-gray-50">
                      {complaint.regularService?.[0]?.userName}
                    </Link>
                  ) : (
                    <Link to={rowLink} className={`px-2 py-1 text-xs font-bold rounded-lg uppercase tracking-wide status-pill ${statusStyle[complaint.complaintDetails.status]} `}>
                      {complaint?.complaintDetails?.status}
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
          {data?.length === 0 && (
            <tr className="flex w-full">
              <td className="p-10 text-center text-lg text-red-500 font-bold italic w-full">
                Its Lonely here.
              </td>
            </tr>
          )}
        </tbody>

      </table>
    </div>
  );
};

export default ComplaintTable;