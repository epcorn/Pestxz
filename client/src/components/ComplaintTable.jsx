import { Link, useNavigate } from "react-router-dom";
import { dateFormat } from "../utils/helperFunctions";
import { useGetSingleUserQuery } from "../redux/userSlice";
import { useState, useEffect, useRef } from "react";
import { AssignWork } from "../pages/Complaints";

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
  const navigate = useNavigate();

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
    <div className="w-full mt-2 overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
      <table className="min-w-[1024px] w-full table-auto border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-neutral-600 text-white text-sm font-bold uppercase tracking-wider">
            <th className="px-2 py-3 text-center">Number</th>
            {!isRegular && <th className="px-2 py-3 text-left">Assigned To</th>}
            <th className="px-2 py-3 text-left">Date</th>
            <th className="px-2 py-3 text-left">
              {isRegular ? "Location" : user?.type === "PestEmployee" ? "Client" : "Raised By"}
            </th>
            <th className="px-2 py-3 text-center">Service</th>
            <th className="px-2 py-3 text-center">
              {isRegular ? "Serviced By" : "Status"}
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {data?.map((complaint, i) => {
            const assignedto = complaint?.complaintDetails?.assignedTo;
            const assignedby = complaint?.complaintDetails?.assignedBy;
            const rowLink = isRegular ? `/location/${complaint?.location?._id}` : `/complaint/${complaint._id}`;

            return (
              <tr
                onClick={() => navigate(rowLink)}
                key={complaint?._id}
                className="hover:bg-neutral-50 transition-colors cursor-pointer text-xs md:text-sm"
              >
                {/* Complaint Number */}
                <td className="px-2 py-4 text-center">
                  <div className="font-bold text-blue-600 hover:text-blue-800 transition-colors">
                    {complaint.complaintDetails?.number || (i + 2)}
                  </div>
                </td>

                {/* Assigned To */}
                {!isRegular && (
                  <td
                    className="px-2 py-4 relative cursor-pointer select-none"
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
                          className="absolute top-0 left-0 mt-2 z-10 bg-white shadow-xl rounded-xl border border-gray-100 p-2"
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
                <td className="px-2 py-4">
                  <div className="text-sm text-gray-600 hover:text-gray-900">
                    {dateFormat(complaint.createdAt)}
                  </div>
                </td>

                {/* Location / Client / Raised By */}
                <td className="px-2 py-4">
                  <div className="text-sm font-medium hover:opacity-85">
                    {!isRegular ? (
                      user?.type === "PestEmployee" ? (
                        <span className="text-blue-900 whitespace-pre-wrap">{complaint?.complaintDetails.clientName || "cle"}</span>
                      ) : (
                        <span className="text-blue-900 whitespace-pre-wrap">{complaint.complaintDetails?.userName}</span>
                      )
                    ) : (
                      <span className="text-gray-600 whitespace-pre-wrap truncate block">
                        {`${complaint.location?.floor || ""}, ${complaint.location?.location || ""}`}
                      </span>
                    )}
                  </div>
                </td>

                {/* Service */}
                <td className="px-2 py-4 text-sm text-gray-800 text-center">
                  {isRegular ? (
                    <span>{complaint.regularService?.[0]?.serviceName}</span>
                  ) : (
                    <span>{complaint.complaintDetails?.service?.join(", ")}</span>
                  )}
                </td>

                {/* Status / Serviced By */}
                <td className="px-2 py-4 text-center">
                  {isRegular ? (
                    <div className="inline-block whitespace-nowrap text-xs font-semibold border border-gray-300 px-2 py-1 rounded-lg text-gray-600 bg-gray-50">
                      {complaint.regularService?.[0]?.userName}
                    </div>
                  ) : (
                    <div className={`inline-block px-2 py-1 text-xs font-bold rounded-lg uppercase tracking-wide ${statusStyle[complaint.complaintDetails.status]}`}>
                      {complaint?.complaintDetails?.status}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {data?.length === 0 && (
            <tr>
              <td colSpan={isRegular ? 5 : 6} className="p-10 text-center text-lg text-red-500 font-bold italic">
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