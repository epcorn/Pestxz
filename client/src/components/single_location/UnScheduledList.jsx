import React from 'react';
import { useNavigate } from 'react-router-dom';

function UnScheduledList({ work = [] }) {
  const navigate = useNavigate();
  // Check if the array is empty
  if (work.length === 0) {
    return <div className="p-4 text-gray-500 text-center">No unscheduled work found.</div>;
  }

  return (
    <div className="text-xs md:text-sm overflow-x-auto w-full">
      <table className="min-w-full border-collapse text-left border border-gray-400">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-400 *:not-last:border-r">
            <th className="p-3 font-bold text-gray-700">Index</th>
            <th className="p-3 font-bold text-gray-700">Date</th>
            <th className="p-3 font-bold text-gray-700">Raised By</th>
            <th className="p-3 font-bold text-gray-700">Service</th>
            <th className="p-3 font-bold text-gray-700 max-w-3xs min-w-3xs">Comment</th>
            <th className="p-3 font-bold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {work.map((w, i) => (
            <tr key={w._id} className="border-b border-b-gray-400 hover:bg-gray-50 transition-all text-xs md:text-sm *:not-last:border-r" onClick={() => navigate(`/unschedule/${w._id}`)}>
              <td className="p-3 text-gray-900">{i + 1}</td>
              <td className="p-3 text-gray-900 whitespace-nowrap">
                {new Date(w.updatedAt).toLocaleString()}
              </td>
              <td className="p-3 text-gray-900">
                {w.raisedBy?.user || 'N/A'}
              </td>
              <td className="p-3 text-gray-900">{w.serviceName}</td>
              <td className="p-3 text-gray-900 ">{w.comment}</td>
              <td className="p-3 text-gray-900">{w?.approval?.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UnScheduledList;
