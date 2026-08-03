import React from 'react';
import { useNavigate } from 'react-router-dom';
import { dateFormat } from '../../utils/helperFunctions';


const rowStyle = (approval, update) => {
  if (approval?.status === "Approved") {
    return update?.status
      ? "outline-l-4 outline-l-green-500 bg-green-950/30"
      : "outline-l-4 outline-l-yellow-500 bg-yellow-950/30"
  }
  if (approval?.status === "Rejected") {
    return "outline-l-4 outline-l-red-500 bg-red-950/30"
  }
  return "outline-l-4 outline-l-cyan-500 bg-cyan-950/30"
}

function UnScheduledList({ work = [], type = "unschedule" }) {
  const navigate = useNavigate();

  // Check if the array is empty
  if (work?.length === 0) {
    return <div className="p-4 text-gray-500 text-center">No unscheduled work found.</div>;
  }

  return (
    <div className="text-xs md:text-sm overflow-x-auto w-full">

      <table className="min-w-full text-left border border-gray-400">
        <thead>
          {type.toString().toLowerCase() === "unschedule" ?
            <tr className="bg-gray-700 text-white border-b border-gray-400 *:not-last:border-r">
              <th className="p-3 font-bold">Index</th>
              <th className="p-3 font-bold">Date</th>
              <th className="p-3 font-bold whitespace-nowrap">Pest Count</th>
              <th className="p-3 font-bold whitespace-nowrap">Raised By</th>
              <th className="p-3 font-bold">Service</th>
              <th className="p-3 font-bold max-w-3xs min-w-3xs">Comment</th>
              <th className="p-3 font-bold">Status</th>
            </tr>
            :
            <tr className="bg-gray-700 text-white border-b border-gray-400 *:not-last:border-r ">
              {/* <th className="p-3 font-bold">Index</th> */}
              <th className="p-3 font-bold">Date</th>
              <th className="p-3 font-bold">Serviced By</th>
              <th className="p-3 font-bold whitespace-nowrap">Pest Count</th>
              <th className="p-3 font-bold">Client Name</th>
              <th className="p-3 font-bold">Service</th>
              <th className="p-3 font-bold">Image</th>
            </tr>
          }
        </thead>
        <tbody>
          {type?.toString().toLowerCase() === "unschedule" ? work?.map((w, i) => (
            <tr key={w._id} className={`border-b border-b-gray-400 hover:opacity-90 transition-all text-xs md:text-sm *:not-last:border-r  ${rowStyle(w.approval, w.update)}`}
              onClick={() => navigate(`/unschedule/${w._id}`)}>
              <td className="p-3">{i + 1}</td>
              <td className="p-3 whitespace-nowrap">
                {dateFormat(w?.updatedAt)}
              </td>
              <td className="p-3">
                {w?.pestCount}
              </td>
              <td className="p-3">
                {w.raisedBy?.user || 'N/A'}
              </td>
              <td className="p-3">{w?.service?.map(s => (s?.serviceName)).join(", ")}</td>
              <td className="p-3 ">{w?.comment}</td>
              <td className="p-3">{w?.status}</td>
            </tr>
          )) :
            work?.map((w, i) => (
              <tr key={w._id} className={`border-b border-gray-400 hover:opacity-90 transition-all text-xs md:text-sm *:not-last:border-r *:not-last:border-r-gray-300`}
              // onClick={() => navigate(`/unschedule/${w._id}`)}
              >
                {/* <td className="p-3">{"i + 1"}</td> */}
                <td className="p-3 whitespace-nowrap">
                  {dateFormat(w?.createdAt)}
                </td>
                <td className="p-3">
                  {w?.user?.name}
                </td>
                <td className="p-3">{w?.pestCount}</td>
                <td className="p-3">{w?.client?.name}</td>
                <td className="p-3 ">{w?.service?.map(s => s.serviceName).join(", ")}</td>
                <td className="p-3 w-30 flex gap-2">{w?.image?.map(i => (<img key={i} style={{ maxHeight: "60px" }} src={i} alt="" />))}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

export default UnScheduledList;
