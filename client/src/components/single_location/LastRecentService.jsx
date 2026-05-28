import React, { useState } from "react";
import { toggleModal } from "../../redux/helperSlice";
import { useDispatch, useSelector } from "react-redux";
import Button from "../Button";
import { dateFormat } from "../../utils/helperFunctions";
import ImagesModal from "../modals/ImagesModal";

function LastRecentService({ data }) {
  const [showDetail, setShowDetail] = useState(null);

  const dispatch = useDispatch();

  const { isModalOpen } = useSelector((store) => store.helper);

  return (
    <div>
      {data?.length > 0 && (
        <div className="my-6">
          <h6 className="text-base font-semibold text-neutral-900 mb-3">
            Last {data?.length} Recent Services
          </h6>

          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
            {/* DESKTOP HEADER */}
            <div className="hidden md:grid grid-cols-[120px_120px_150px_1fr_150px] bg-neutral-50 border-b border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-500">
              <div className="p-3 border-r border-neutral-200">Type</div>
              <div className="p-3 border-r border-neutral-200">Images</div>
              <div className="p-3 border-r border-neutral-200">Date</div>
              <div className="p-3 border-r border-neutral-200">Service</div>
              <div className="p-3">Attend By</div>
            </div>

            {/* BODY */}
            <div className="divide-y divide-neutral-200">
              {data.map((service, index) => (
                <div key={service.id} className="w-full">
                  {/* MAIN ROW */}
                  <div
                    onClick={() =>
                      setShowDetail(showDetail === service.id ? null : service.id)
                    }
                    className="grid grid-cols-1 md:grid-cols-[120px_120px_150px_1fr_150px] gap-3 md:gap-0 p-4 cursor-pointer hover:bg-neutral-50 transition items-center"
                  >
                    {/* TYPE */}
                    <div className="md:border-r md:border-neutral-200 md:px-3 flex items-center">
                      <span className="text-xs font-bold uppercase text-neutral-400 md:hidden mr-2">Type:</span>
                      <span className="font-medium text-sm text-neutral-900">{service.type}</span>
                    </div>

                    {/* IMAGE */}
                    <div
                      className="md:border-r md:border-neutral-200 md:px-3 flex items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs font-bold uppercase text-neutral-400 md:hidden mr-2">Images:</span>
                      {service.image ? (
                        <div className="relative">
                          <Button
                            label="Show"
                            small
                            height="h-7"
                            color="bg-green-600 text-xs text-white px-3 rounded hover:bg-green-700 transition"
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
                              image={service.image}
                              name={`ReImage-${index}`}
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">No Image</span>
                      )}
                    </div>

                    {/* DATE */}
                    <div className="md:border-r md:border-neutral-200 md:px-3 flex flex-row md:flex-col items-center md:items-start justify-start md:justify-center">
                      <span className="text-xs font-bold uppercase text-neutral-400 md:hidden mr-2">Date:</span>
                      <div className="flex flex-col">
                        <span className="text-sm text-neutral-900">{dateFormat(service.date)}</span>
                        {service.serviceDate && (
                          <span className="text-xs text-neutral-500 mt-0.5">
                            {service.serviceDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* SERVICE */}
                    {service.type === "Complaint" ? <div className="md:border-r md:border-neutral-200 md:px-3 flex flex-row md:flex-col items-center md:items-start justify-start md:justify-center">
                      <span className="text-xs font-bold uppercase text-neutral-400 md:hidden mr-2">Service:</span>
                      <span className="font-medium text-sm text-neutral-900 truncate">
                        {service.service.join(", ")}
                      </span>
                    </div> :
                      <div className="md:border-r md:border-neutral-200 md:px-3 flex flex-row md:flex-col items-center md:items-start justify-start md:justify-center">
                        <span className="text-xs font-bold uppercase text-neutral-400 md:hidden mr-2">Service:</span>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium text-sm text-neutral-900 truncate">
                            {service.serviceName}
                          </span>
                          <span className="text-xs text-neutral-500 truncate mt-0.5">
                            {service.frequency}
                          </span>
                        </div>
                      </div>}

                    {/* USER */}
                    <div className="md:px-3 flex items-center">
                      <span className="text-xs font-bold uppercase text-neutral-400 md:hidden mr-2">Attend By:</span>
                      <span className="inline-flex items-center rounded-full bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-600 border border-neutral-200">
                        {service.userName}
                      </span>
                    </div>
                  </div>

                  {/* DETAILS SECTION */}
                  {showDetail === service.id &&  (
                    <div className="border-t border-neutral-200 bg-neutral-50 p-4 space-y-4">
                      {service.scopes?.map((sc, i) => (
                        <div
                          key={i}
                          className="border border-neutral-200 rounded-lg bg-white p-4 shadow-sm"
                        >
                          <h2 className="font-semibold text-base text-neutral-900 mb-3 border-b border-neutral-100 pb-2">
                            {sc.scopeName}
                          </h2>

                          <div className="space-y-3">
                            {sc.consumables?.map((con, j) => (
                              <div
                                key={j}
                                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-4 border border-neutral-200 rounded-lg p-4 bg-neutral-50/50 whitespace-pre-wrap"
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
                                  <p className="text-sm text-neutral-700">{con.calibration || "-"}</p>
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
                      {service.schedule?.length > 0 && (
                        <div className="border border-neutral-200 rounded-lg bg-white p-4 shadow-sm">
                          <h2 className="font-semibold text-sm text-neutral-900 mb-3">
                            Schedule Status
                          </h2>
                          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                            {service.schedule.map((sch, idx) => (
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

export default LastRecentService;