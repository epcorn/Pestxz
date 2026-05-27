import React from "react";

function ServiceShow({ services }) {
  return (
    
    <div className="w-full overflow-x-auto border border-gray-800 rounded-lg bg-white">
      <div className="min-w-[768px]">
        <div>
          {/* HEADER */}
          <div
            className={`grid grid-cols-5 bg-gray-100 text-xs md:text-sm font-semibold text-gray-700 border-b *:not-last:border-r *:not-last:border-gray-300 border-gray-300`}
          >
            <div className="px-3 py-3 whitespace-nowrap">
              Service
            </div>

            <div className="px-3 py-3 whitespace-nowrap">
              Frequency
            </div>

            <div className="px-3 py-3 whitespace-nowrap">
              Last Serviced Date
            </div>

            <div className="col-span-2 px-3 py-3 whitespace-nowrap">
              Scheduled Next Dates
            </div>
          </div>

          {/* BODY */}
          {services?.map((s, index) => {
            const schedules = s.schedule || [];

            const completedService = schedules
              .filter((sc) => sc.completed === true)
              .at(-1);

            const nextServices = schedules
              .filter((sc) => sc.completed === false)
              .slice(0, 5);

            return (
              <div
                key={index}
                className={`grid grid-cols-5 text-xs md:text-sm border-b border-gray-200 hover:bg-gray-50 transition *:not-last:border-r *:not-last:border-gray-300`}
              >
                {/* SERVICE NAME */}
                <div className="px-3 py-3 break-words">
                  {s.serviceName || "-"}
                </div>

                {/* FREQUENCY */}
                <div className="px-3 py-3 capitalize whitespace-nowrap">
                  {s.frequency || "-"}
                </div>

                {/* LAST COMPLETED */}
                <div className="px-3 py-3 whitespace-nowrap">
                  {completedService?.date || "Not Serviced Yet"}
                </div>

                {/* NEXT DATES */}
                {/* Added flex-wrap so multiple date tags wrap gracefully instead of overflowing the cell */}
                <div className="col-span-2 px-3 py-3 flex flex-wrap gap-1">
                  {nextServices.length > 0 ? (
                    nextServices.map((n, i) => (
                      <span
                        key={i}
                        className="outline outline-gray-300 px-2 py-1 rounded text-[11px]"
                      >
                        {n.date}
                      </span>
                    ))
                  ) : (
                    <span>-</span>
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
