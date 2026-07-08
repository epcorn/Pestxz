import React, { useState } from "react";
import { compareDates, formatShortDate } from "../../utils/helperFunctions";

function ServiceShow({ services }) {
  const [expandedServiceId, setExpandedServiceId] = useState(null);

  return (
    <section className="">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left m-0.5 rounded-md table-auto outline-1 outline-black min-w-[900px]">
          <thead className="bg-gray-300 text-sm">
            <tr className="border-b border-black whitespace-nowrap *:px-4 *:py-2">
              <th className="border-r border-black">Services</th>
              <th className="border-r border-black">Upcoming Dates</th>
              <th className="border-r border-black">Frequency</th>
              <th className="border-r border-black">Last Serviced</th>
              <th>Last Missed</th>
            </tr>
          </thead>
          <tbody className="whitespace-nowrap bg-white text-sm">
            {services?.map((s, index) => {
              const schedules = s.schedule || [];
              const completedService = schedules.filter((sc) => sc.completed).at(-1);
              const missedSchedules = schedules.filter((sc) => sc.status === "Missed");

              const nextServices = schedules.filter((sc) => {
                if (sc.completed) return false;
                const d = new Date(sc.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return d >= today;
              });

              const isExpanded = expandedServiceId === index;
              const visibleSchedules = isExpanded ? schedules : nextServices.slice(0, 5);
              const { nextDate, todaysDate, todaysStatus } = compareDates(schedules)

              return (
                <tr key={index} className="border-b border-black last:border-b-0 *:px-2 py-2">
                  {/* SERVICE NAME */}
                  <td className="border-r border-black font-medium">{s.serviceName || "-"}</td>

                  {/* UPCOMING DATES */}
                  <td className="border-r border-black">
                    <div className="flex flex-wrap gap-2 min-w-[200px] p-1 max-h-20 text-xs font-semibold overflow-auto items-center">
                      {schedules.length > 0 ? (
                        <>
                          {visibleSchedules.map((n, i) => {

                            const isToday = n?.date === todaysDate?.date;
                            const isMissed = n?.status === "Missed";
                            const isDone = n?.completed;
                            const isInvalid = n?.status === "Invalid";

                            return (
                              <span
                                key={i}
                                className={`outline-1 rounded px-1.5 py-0.5 
                                  ${isToday ? "bg-green-200 text-green-700 animate-pulse" : ""} 
                                  ${isInvalid ? "bg-gray-200 text-gray-500 opacity-60" : ""}
                                  ${isMissed ? "bg-red-200 text-red-700" : ""}
                                  ${isDone ? "bg-blue-200 text-blue-700" : ""}
                                  ${!isToday && !isInvalid && !isMissed && !isDone ? "outline-gray-300" : ""}
                                  ${nextDate?.date === n?.date ? "bg-yellow-200 outline-yellow-600 text-yellow-600" : ""}
                                `}
                              >
                                {formatShortDate(n?.date)}
                              </span>
                            );
                          })}

                          {nextServices.length > 5 && (
                            <span
                              onClick={() => setExpandedServiceId(isExpanded ? null : index)}
                              className="underline text-cyan-700 cursor-pointer select-none ml-1"
                            >
                              {isExpanded ? "Show less" : "Show All"}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>

                  {/* FREQUENCY */}
                  <td className="border-r border-black capitalize">{s.frequency || "-"}</td>

                  {/* LAST COMPLETED */}
                  <td className="border-r border-black">
                    {completedService?.date ? (
                      <span className="text-green-500 font-semibold">
                        {formatShortDate(completedService.date)} ✓
                      </span>
                    ) : (
                      <span className="text-gray-400">Not yet</span>
                    )}
                  </td>

                  {/* MISSED */}
                  <td>
                    {missedSchedules.length > 0 ? (
                      <div className="flex flex-col text-sm font-semibold text-red-500">
                        <span>{missedSchedules.length} missed</span>
                        <span className="text-[13px] text-blue-600 font-normal">
                          Last: {formatShortDate(missedSchedules.at(-1).date)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-green-500 font-semibold">✓ None</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ServiceShow;