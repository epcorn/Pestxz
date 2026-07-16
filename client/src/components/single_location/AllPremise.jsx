import React from 'react';
import { useParams } from 'react-router-dom';
import { useAllLocationsQuery } from '../../redux/locationSlice';

function AllPremise({ today }) {
  // 1. FIXED: Destructure the string 'id' out of the useParams object wrapper
  const { id } = useParams();

  // 2. FIXED: Pass parameters inside an object layout to match your RTK slice
  const { data: locations = {}, isLoading } = useAllLocationsQuery({ id }, { skip: !id });

  const day = (val) => {
    return val !== null && val !== undefined ? new Date(val).toISOString().split("T")[0] : "";
  };

  const targetToday = day(today);

  // 3. Filter locations that have at least one service scheduled for today
  const allPremiseSchedules = locations.locations?.filter(l => 
    l?.service?.some(ser => 
      ser?.schedule?.some(sc => day(sc?.date) === targetToday)
    )
  ) || [];

  if (isLoading) {
    return <div className="py-10 text-center text-sm text-slate-500">Loading schedules...</div>;
  }

  return (
    <section className="bg-white rounded-md overflow-hidden select-none">
      <table className="w-full border-collapse text-left text-sm text-slate-700">
        <thead>
          <tr className="border-b bg-gray-200 font-semibold text-slate-900 *:not-last:border-r">
            <th className="py-3 px-2 text-center">No.</th>
            <th className="py-3 px-2">Location</th>
            <th className="py-3 px-2">Service name</th>
            <th className="py-3 px-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          {allPremiseSchedules.length === 0 ? (
            <tr>
              <td colSpan="4" className="py-10 text-center text-slate-500 font-medium">
                No Service Due for today
              </td>
            </tr>
          ) : (
            allPremiseSchedules.map((p, index) => {
              // =================================================================
              // FIXED LOGIC: Extract schedules strictly bound to TODAY
              // =================================================================
              // Filter out services that actually have a slot due for today
              const servicesToday = p.service?.filter(ser => 
                ser.schedule?.some(sc => day(sc.date) === targetToday)
              ) || [];

              // Gather all schedule entries meant only for today across those services
              const todaySchedules = p.service?.flatMap(ser => 
                ser.schedule?.filter(sc => day(sc.date) === targetToday) || []
              ) || [];

              const totalCount = todaySchedules.length;
              const completedCount = todaySchedules.filter(sc => sc.completed).length;

              // Clear Status Calculations
              const allDone = totalCount > 0 && completedCount === totalCount;
              const partialDone = completedCount > 0 && completedCount < totalCount;

              // Row Background Colour Assignments
              let rowBg = "";
              if (allDone) rowBg = "bg-green-100 text-green-800";
              else if (partialDone) rowBg = "bg-yellow-100 text-yellow-800";

              return (
                <tr key={p._id || index} className={`${rowBg} *:not-last:border-r hover:bg-slate-50/80 transition-colors`}>
                  <td className="py-3 px-2 text-center font-medium">
                    {index + 1}
                  </td>
                  <td className="py-3 px-2">
                    {p.floor && `${p.floor}, `}{p.location}{p.sublocation && `, ${p.sublocation}`}
                  </td>
                  <td className="py-3 px-2 font-medium">
                    {servicesToday.map(s => s.serviceName).join(", ")}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${allDone ? "text-green-600" : partialDone ? "text-yellow-600" : "text-red-500"}`}>
                        {allDone ? "Completed" : partialDone ? "Partially Done" : "Pending"}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {completedCount} / {totalCount} tasks
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </section>
  );
}

export default AllPremise;
