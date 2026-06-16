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
    <div className="w-full min-h-96 mt-2 overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
      <table className="min-w-[1024px] w-full border-collapse" style={{ tableLayout: "fixed" }}>

        <thead>
          <tr className="bg-neutral-600 text-white text-sm font-bold uppercase tracking-wider">
            <th className="pl-2 py-3 text-center">Number</th>
            {!isRegular && <th className="pl-2 py-3 text-left">Assigned To</th>}
            <th className="pl-2 py-3 text-left">Date</th>
            <th className="pl-2 py-3 text-left">
              {isRegular ? "Location" : user?.type === "PestEmployee" ? "Client" : "Raised By"}
            </th>
            <th className="pl-2 py-3">Service</th>
            <th className="pl-2 py-3 text-center">
              {isRegular ? "Serviced By" : "Status"}
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {data?.map((complaint, i) => {
            const assignedto = complaint?.complaintDetails?.assignedTo;
            const assignedby = complaint?.complaintDetails?.assignedBy;
            const rowLink = isRegular ? `/location/${complaint.location?._id}` : `/complaint/${complaint._id}`;

            return (
              <tr key={complaint._id} className="bg-white hover:bg-neutral-50 transition-colors divide-y *:not-last:border-r *:border-gray-400 text-xs md:text-sm">

                {/* Complaint Number */}
                <td className="pl-2 py-4 text-center">
                  <Link to={rowLink} className="font-bold text-blue-600 hover:text-blue-800 transition-colors">
                    {complaint.complaintDetails?.number || (i + 2)}
                  </Link>
                </td>

                {/* Assigned To */}
                {!isRegular && (
                  <td
                    className="pl-2 py-4 relative cursor-pointer select-none"
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

                    {["Admin", "TeamLeader", "BranchAdmin"].includes(user?.role) &&
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
                <td className="pl-2 py-4">
                  <Link to={rowLink} className="text-sm text-gray-600 hover:text-gray-900">
                    {dateFormat(complaint.createdAt)}
                  </Link>
                </td>

                {/* Location / Client / Raised By */}
                <td className="pl-2 py-4">
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
                <td className="pl-2 py-4 text-sm text-gray-800">
                  {isRegular ? (
                    <span>{complaint.regularService?.[0]?.serviceName}</span>
                  ) : (
                    <span>{complaint.complaintDetails?.service?.join(", ")}</span>
                  )}
                </td>

                {/* Status / Serviced By */}
                <td className="pl-2 py-4 text-center outline outline-gray-300">
                  {isRegular ? (
                    <span className="whitespace-nowrap text-xs font-semibold border border-gray-300 px-2 py-1 rounded-lg text-gray-600 bg-gray-50">
                      {complaint.regularService?.[0]?.userName}
                    </span>
                  ) : (
                    <span className={`px-2 py-1 text-xs font-bold rounded-lg uppercase tracking-wide status-pill ${complaint?.complaintDetails?.status?.toLowerCase().replace(/\s+/g, "")}`}>
                      {complaint?.complaintDetails?.status}
                    </span>
                  )}
                </td>

              </tr>
            );
          })}

          {data?.length === 0 && (
            <tr>
              <td colSpan={isRegular ? 5 : 6} className="p-10 text-center text-gray-400 text-sm italic">
                No complaints available to display.
              </td>
            </tr>
          )}
        </tbody>

      </table>
    </div>
  );
};

export default ComplaintTable;