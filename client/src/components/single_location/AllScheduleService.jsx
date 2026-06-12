import React, { useEffect, useState } from "react";
import { toggleModal } from "../../redux/helperSlice";
import { useDispatch, useSelector } from "react-redux";
import Button from "../Button";
import { dateFormat } from "../../utils/helperFunctions";
import ImagesModal from "../modals/ImagesModal";

function AllScheduleService({ data }) {
  const { user } = useSelector(store => store.helper)
  const [showDetail, setShowDetail] = useState(null);
  const dispatch = useDispatch();
  const { isModalOpen } = useSelector((store) => store.helper);

  return (
    <div>
      {data?.length > 0 && (
        <div className="mb-1">
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
            {/* DESKTOP HEADER */}
            <div className="hidden md:grid grid-cols-[120px_120px_150px_1fr_150px] bg-zinc-300/40 border-b border-neutral-200 text-sm font-bold uppercase tracking-wider text-neutral-700">
              <div className="p-3 border-r border-neutral-200">Type</div>
              <div className="p-3 border-r border-neutral-200">Images</div>
              <div className="p-3 border-r border-neutral-200">Date</div>
              <div className="p-3 border-r border-neutral-200">Service</div>
              <div className="p-3">Attend By</div>
            </div>

            {/* BODY */}
            <div className="divide-y divide-neutral-800">
              {data?.map((service, index) => (
                <div key={service._id} className="w-full">
                  {/* MAIN ROW */}
                  <div
                    onClick={() =>
                      setShowDetail(showDetail === service._id ? null : service._id)
                    }
                    className="grid grid-cols-1 md:grid-cols-[120px_120px_150px_1fr_150px] gap-3 md:gap-0 p-4 cursor-pointer bg-white/40 hover:bg-white/30 transition items-center"
                  >
                    {/* TYPE */}
                    <div className="md:border-r md:border-neutral-200 md:px-3 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-neutral-400 md:hidden mr-2">Type:</span>
                      <span className="font-medium text-sm text-neutral-900">{service.type}</span>
                    </div>

                    {/* IMAGE */}
                    <div
                      className="md:border-r md:border-neutral-200 md:px-3 flex justify-between items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs font-bold uppercase text-neutral-400 md:hidden mr-2">Images:</span>
                      {service.regularService[0].image ? (
                        <div className="relative">
                          <Button
                            label="Show"
                            small
                            height="h-7"
                            color={service?.regularService[0].image.length > 0 ? "bg-green-600 text-xs text-white px-3 rounded hover:bg-green-700 transition" : "bg-green-600/40 hover:bg-green-600/40 cursor-not-allowed"}
                            onClick={() =>
                              dispatch(
                                toggleModal({
                                  name: `ReImage-${index}`,
                                  status: true,
                                }),
                              )
                            }
                          />
                          {isModalOpen[`ReImage-${index}`] && (
                            <ImagesModal
                              image={service?.regularService[0].image}
                              name={`ReImage-${index}`}
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">No Image</span>
                      )}
                    </div>

                    {/* DATE */}
                    <div className="md:border-r md:border-neutral-200 md:px-3 flex flex-row justify-between md:flex-col items-center md:items-start md:justify-center">
                      <span className="text-xs font-bold uppercase text-neutral-400 md:hidden mr-2">Date:</span>
                      <div className="flex flex-col">
                        <span className="text-sm text-neutral-900">{dateFormat(service?.regularService[0].date)}</span>
                        {service.regularService[0].serviceDate && (
                          <span className="text-xs text-neutral-500 mt-0.5">
                            {service.regularService[0].serviceDate}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* SERVICE */}

                    <div className="md:border-r md:border-neutral-200 md:px-3 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center">
                      <span className="text-xs font-bold uppercase text-neutral-400 md:hidden mr-2">Service:</span>
                      <div className="flex flex-col min-w-0 w-full text-right md:text-left">
                        <span className="font-medium text-sm text-neutral-900 truncate">
                          {service.regularService[0].serviceName}
                        </span>
                        <span className="text-xs text-neutral-500 truncate mt-0.5">
                          {service.regularService[0].frequency}
                        </span>
                      </div>
                    </div>

                    {/* USER */}
                    <div className="md:px-3 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-neutral-400 md:hidden mr-2">Attend By:</span>
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-900 border border-neutral-500">
                        {service.regularService[0].userName}
                      </span>
                    </div>
                  </div>

                  {/* DETAILS SECTION */}
                  {user.type === "PestEmployee" && showDetail === service._id && (
                    <div className="border-t border-neutral-200 bg-neutral-100 p-2 md:p-4 space-y-2 md:space-y-4">
                      {service.regularService[0].scopes?.map((sc, i) => (
                        <div
                          key={i}
                          className="border border-neutral-200 rounded-lg bg-white p-2 md:p-4 shadow-sm"
                        >
                          <h2 className="font-semibold text-base text-neutral-900 mb-3 border-b border-neutral-100 pb-2">
                            {sc.scopeName}
                          </h2>

                          <div className="space-y-2">
                            {sc.consumables?.map((con, j) => (
                              <div
                                key={j}
                                className="grid grid-cols-2 md:grid-cols-7 gap-2 md:gap-4 border border-neutral-200 rounded-lg p-2 md:p-4 bg-neutral-50/50 whitespace-pre-wrap"
                              >
                                <div className="sm:col-span-2 md:col-span-2">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                                    Consumable
                                  </p>
                                  <p className="font-medium text-sm text-neutral-900">
                                    {con.consumableName}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                                    Calibration
                                  </p>
                                  <p className="text-sm text-neutral-700">{con.calibration || "0"}</p>
                                </div>

                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                                    Used Cal.
                                  </p>
                                  <p className="text-sm text-neutral-700">{con.usedCalibration || "-"}</p>
                                </div>

                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                                    Action
                                  </p>
                                  <p className="text-sm text-neutral-700">{con.action || "-"}</p>
                                </div>

                                <div className="sm:col-span-2 md:col-span-2">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                                    Comment
                                  </p>
                                  <p className="text-sm text-neutral-700">{con.comment || "-"}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* SCHEDULE */}
                      {service.regularService[0].schedule?.length > 0 && (
                        <div className="border border-neutral-200 rounded-lg bg-white p-4 shadow-sm">
                          <h2 className="font-semibold text-sm text-neutral-900 mb-3">
                            Schedule Dates
                          </h2>
                          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                            {service.regularService[0].schedule.map((sch, idx) => (
                              <span
                                key={idx}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium border ${sch.completed
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-neutral-50 text-neutral-600 border-neutral-200"
                                  }`}
                              >
                                {sch.date}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

  );
}

export default AllScheduleService;