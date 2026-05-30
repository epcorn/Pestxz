import React, { useState } from "react";
import { formatShortDate, getWorkStatus } from "../../utils/helperFunctions";

function ServiceShow({ services }) {
  // Store the expanded service ID/index in state
  const [expandedServiceId, setExpandedServiceId] = useState(null);

  return (
    <div className="w-full overflow-x-auto border border-gray-800 rounded-lg bg-white">
      <div className="min-w-[768px]">
        <div>
          {/* HEADER */}
          <div className="grid grid-cols-7 bg-gray-300 text-xs md:text-sm font-semibold text-gray-700 border-b *:not-last:border-r *:not-last:border-gray-600 border-gray-300">
            <div className="px-3 py-3 whitespace-nowrap">Service</div>
            <div className="px-3 py-3 whitespace-nowrap">Frequency</div>
            <div className="px-3 py-3 whitespace-nowrap">Last Serviced</div>
            <div className="px-3 py-3 whitespace-nowrap">Missed</div>
            {/* FIX 1: Explicitly span 3 columns to match body layout */}
            <div className="px-3 py-3 whitespace-nowrap col-span-3">Upcoming Dates</div>
          </div>

          {/* BODY */}
          {services?.map((s, index) => {
            const schedules = s.schedule || [];
            const completedService = schedules
              .filter((sc) => sc.completed === true)
              .at(-1);
            
            const missedServices = getWorkStatus(schedules);
            
            const nextServices = schedules.filter((sc) => {
              if (sc.completed) return false;
              const d = new Date(sc.date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return d >= today;
            });

            // FIX 2: Check if this specific row index is expanded
            const isExpanded = expandedServiceId === index;
            const nextVisibleServices = isExpanded ? nextServices : nextServices.slice(0, 5);

            return (
              <div
                key={index}
                className="grid grid-cols-7 text-xs md:text-sm border-b border-gray-200 hover:bg-gray-50 transition *:not-last:border-r *:not-last:border-gray-600"
              >
                {/* SERVICE NAME */}
                <div className="px-3 py-3 wrap-break-word">
                  {s.serviceName || "-"}
                </div>

                {/* FREQUENCY */}
                <div className="px-3 py-3 capitalize whitespace-nowrap">
                  {s.frequency || "-"}
                </div>

                {/* LAST COMPLETED */}
                <div className="px-3 py-3 whitespace-nowrap">
                  {completedService?.date ? formatShortDate(completedService.date) : "Not yet"}
                </div>

                {/* MISSED */}
                <div className="px-3 py-3">
                  {missedServices.length > 0 ? (
                    <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {missedServices.length} missed
                    </span>
                  ) : (
                    <span className="text-green-600 text-[11px] font-medium">✓ None</span>
                  )}
                </div>

                {/* UPCOMING DATES */}
                <div className="col-span-3 max-h-20 overflow-y-auto px-3 py-3 flex flex-wrap gap-1 items-center">
                  {nextServices.length > 0 ? (
                    <>
                      {nextVisibleServices.map((n, i) => {
                        const today = new Date().toISOString().split("T")[0];
                        return (
                          <span
                            key={i}
                            className={`outline ${
                              n.date === today
                                ? "text-green-700 outline-green-700 bg-green-200 animate-pulse"
                                : "outline-gray-300"
                            } px-2 py-1 rounded text-[11px]`}
                          >
                            {formatShortDate(n.date)}
                          </span>
                        );
                      })}

                      {/* FIX 3: Fixed button context loop variable and conditional text */}
                      {nextServices.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setExpandedServiceId(isExpanded ? null : index)}
                          className="ml-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                        >
                          {isExpanded ? "Show Less" : `+${nextServices.length - 5} More`}
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ServiceShow;
