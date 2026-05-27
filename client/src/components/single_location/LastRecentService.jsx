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
            {/* HEADER */}
            <div className="hidden md:grid grid-cols-[120px_120px_150px_1fr_150px] bg-neutral-50 border-b border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-500">
              <div className="p-3 border-r">Type</div>
              <div className="p-3 border-r">Images</div>
              <div className="p-3 border-r">Date</div>
              <div className="p-3 border-r">Service</div>
              <div className="p-3">Attend By</div>
            </div>

            {/* BODY */}
            <div className="divide-y divide-neutral-200">
              {data.map((service, index) => (
                <div key={service.id}>
                  {/* MAIN ROW */}
                  <div
                    onClick={() =>
                      setShowDetail(
                        showDetail === service.id ? null : service.id,
                      )
                    }
                    className="grid md:grid-cols-[120px_120px_150px_1fr_150px] gap-3 md:gap-0 p-4 cursor-pointer hover:bg-neutral-50 transition"
                  >
                    {/* TYPE */}
                    <div className="md:border-r md:px-3 flex items-center">
                      <span className="font-medium">{service.type}</span>
                    </div>

                    {/* IMAGE */}
                    <div
                      className="md:border-r md:px-3 flex items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {service.image ? (
                        <>
                          <Button
                            label="Show"
                            small
                            height="h-7"
                            color="bg-green-600 text-xs text-white px-3 rounded"
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
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">No Image</span>
                      )}
                    </div>

                    {/* DATE */}
                    <div className="md:border-r md:px-3 flex flex-col justify-center">
                      <span>{dateFormat(service.date)}</span>

                      {service.serviceDate && (
                        <span className="text-xs text-gray-500">
                          {service.serviceDate}
                        </span>
                      )}
                    </div>

                    {/* SERVICE */}
                    <div className="md:border-r md:px-3 flex flex-col justify-center">
                      <span className="font-medium">
                        {service.serviceName}
                      </span>

                      <span className="text-xs text-gray-500">
                        {service.frequency}
                      </span>
                    </div>

                    {/* USER */}
                    <div className="md:px-3 flex items-center">
                      <span className="inline-flex items-center rounded-full bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-600 border border-neutral-200">
                        {service.userName}
                      </span>
                    </div>
                  </div>

                  {/* DETAILS */}
                  {showDetail === service.id && (
                    <div className="border-t bg-gray-50 px-2 py-2">
                      <div className="space-y-2">
                        {service.scopes?.map((sc, i) => (
                          <div
                            key={i}
                            className="border border-gray-600 rounded bg-white p-4"
                          >
                            <h2 className="font-semibold text-base mb-3">
                              {sc.scopeName}
                            </h2>

                            <div className="space-y-3">
                              {sc.consumables?.map((con, j) => (
                                <div
                                  key={j}
                                  className="grid md:grid-cols-4 gap-3 border border-gray-400 rounded p-3"
                                >
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                      Consumable
                                    </p>

                                    <p className="font-medium">
                                      {con.consumableName}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                      Used Calibration
                                    </p>

                                    <p>{con.usedCalibration || "-"}</p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                      Action
                                    </p>

                                    <p>{con.action || "-"}</p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                      Comment
                                    </p>

                                    <p>{con.comment || "-"}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* SCHEDULE */}
                        {service.schedule?.length > 0 && (
                          <div className="border border-gray-600 rounded bg-white p-4">
                            <h2 className="font-semibold mb-3">
                              Schedule Status
                            </h2>

                            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                              {service.schedule.map((sch, idx) => (
                                <span
                                  key={idx}
                                  className={`px-3 py-1 rounded text-xs border ${sch.completed
                                    ? "bg-green-100 text-green-700 border-green-300"
                                    : "bg-gray-100 text-gray-700 border-gray-300"
                                    }`}
                                >
                                  {sch.date}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
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