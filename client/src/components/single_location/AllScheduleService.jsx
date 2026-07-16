import React, { useEffect, useState } from "react";
import { toggleModal } from "../../redux/helperSlice";
import { useDispatch, useSelector } from "react-redux";
import Button from "../Button";
import { dateFormat } from "../../utils/helperFunctions";
import ImagesModal from "../modals/ImagesModal";

function AllScheduleService({ data, children }) {
  const { user } = useSelector(store => store.helper)
  const [showDetail, setShowDetail] = useState(null);
  const dispatch = useDispatch();
  const { isModalOpen } = useSelector((store) => store.helper);

  return (
      <div className="mx-auto">
        {data?.length > 0 ? (
          <div className="mb-1">
            <div className="overflow-auto max-h-96 rounded-lg border border-neutral-300 bg-white shadow-sm">
              <table className="w-full border-collapse text-left">
                {/* DESKTOP HEADER */}
                <thead className="hidden h-12 md:table-header-group bg-neutral-300 border-b border-neutral-300 text-xs font-bold uppercase tracking-wider sticky top-0 z-5 text-neutral-800">
                  <tr>
                    <th className="p-3 border-r border-neutral-300 font-bold">Type</th>
                    <th className="p-3 border-r border-neutral-300 font-bold">Images</th>
                    <th className="p-3 border-r border-neutral-300 font-bold">Date</th>
                    <th colSpan="2" className="p-3 border-r border-neutral-300 font-bold">Service</th>
                    <th className="p-3 font-bold">Attend By</th>
                  </tr>
                </thead>

                {/* BODY */}
                <tbody className="divide-y max-h-[500px] block md:table-row-group">
                  {data?.map((service, index) => (
                    <React.Fragment key={service._id}>
                      {/* MAIN ROW */}
                      <tr
                        onClick={() =>
                          setShowDetail(showDetail === service._id ? null : service._id)
                        }
                        className="cursor-pointer bg-white hover:bg-neutral-50 transition flex flex-col md:table-row p-4 md:p-0 items-stretch md:items-center gap-2.5 md:gap-0"
                      >
                        {/* TYPE */}
                        <td className="md:border-r md:border-neutral-300 md:p-3 flex justify-between items-center md:table-cell">
                          <span className="text-xs font-bold uppercase md:hidden text-neutral-700">Type</span>
                          <span className="font-bold text-sm text-neutral-900">{service.type}</span>
                        </td>

                        {/* IMAGE */}
                        <td
                          className="md:border-r md:border-neutral-300 md:p-3 flex justify-between items-center md:table-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-xs font-bold uppercase md:hidden text-neutral-700">Images</span>
                          {service.regularService[0].image ? (
                            <div className="relative inline-block">
                              <Button
                                label="Show"
                                small
                                height="h-7"
                                color={service?.regularService[0].image.length > 0 ? "bg-green-700 text-xs px-3 rounded hover:bg-green-800 transition text-white font-semibold" : "bg-neutral-200 cursor-not-allowed border border-neutral-300 text-neutral-700 text-xs px-3 rounded font-medium"}
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
                            <span className="text-xs font-semibold text-neutral-700">No Image</span>
                          )}
                        </td>

                        {/* DATE */}
                        <td className="md:border-r md:border-neutral-300 md:p-3 flex justify-between items-center md:table-cell text-right md:text-left">
                          <span className="text-xs font-bold uppercase md:hidden text-neutral-700">Date</span>
                          <div className="flex flex-col items-end md:items-start">
                            <span className="text-sm text-neutral-900 font-bold md:font-semibold">{dateFormat(service?.regularService?.[0]?.serviceDate)}</span>
                          </div>
                        </td>

                        {/* SERVICE */}
                        <td colSpan="2" className="md:border-r md:border-neutral-300 md:p-3 flex justify-between items-center md:table-cell text-right md:text-left">
                          <span className="text-xs font-bold uppercase md:hidden text-neutral-700">Service</span>
                          <div className="flex flex-col min-w-0 text-right md:text-left max-w-[65%] md:max-w-full inline-block">
                            <span className="font-bold text-sm text-neutral-900 truncate block">
                              {service.regularService[0].serviceName}
                            </span>
                            <span className="text-xs font-bold text-neutral-700 truncate block mt-0.5">
                              {service.regularService[0].frequency}
                            </span>
                          </div>
                        </td>

                        {/* USER */}
                        <td className="md:p-3 flex justify-between items-center md:table-cell">
                          <span className="text-xs font-bold uppercase md:hidden text-neutral-700">Attend By</span>
                          <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-900 border border-neutral-400 whitespace-nowrap">
                            {service.regularService[0].userName}
                          </span>
                        </td>
                      </tr>

                      {/* DETAILS SECTION ROW */}
                      {user.type === "PestEmployee" && showDetail === service._id && (
                        <tr className="bg-neutral-300 block md:table-row">
                          <td colSpan="6" className="p-3 md:p-5 border-t border-neutral-300 block md:table-cell">
                            <div className="space-y-3 md:space-y-4">
                              {service.regularService[0].scopes?.map((sc, i) => (
                                <div
                                  key={i}
                                  className="border border-neutral-300 rounded-lg bg-white p-3 md:p-4 shadow-xs"
                                >
                                  <h2 className="font-bold text-sm text-neutral-900 mb-3 border-b border-neutral-200 pb-2">
                                    {sc.scopeName}
                                  </h2>

                                  <div className="space-y-3">
                                    {sc.consumables?.map((con, j) => (
                                      <div
                                        key={j}
                                        className="grid grid-cols-2 md:grid-cols-4 gap-3 border border-neutral-200 rounded-lg p-3 bg-neutral-50 whitespace-pre-wrap"
                                      >
                                        <div className="col-span-full flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-2">
                                          <span className="text-xs uppercase tracking-wider font-extrabold text-neutral-800">
                                            Consumable:
                                          </span>
                                          <span className="font-bold text-xs text-neutral-900 bg-neutral-200 rounded px-2 py-0.5">
                                            {con.consumableName}
                                          </span>
                                        </div>

                                        <div>
                                          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-0.5">
                                            Calibration Limit
                                          </p>
                                          <p className="text-sm font-bold text-neutral-900">{con.calibration || "0"}</p>
                                        </div>

                                        <div>
                                          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-0.5">
                                            Value Used
                                          </p>
                                          <p className="text-sm font-bold text-neutral-900">{con.usedCalibration || "-"}</p>
                                        </div>

                                        <div>
                                          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-0.5">
                                            Action
                                          </p>
                                          <p className="text-sm font-bold text-neutral-900">{con.action || "-"}</p>
                                        </div>

                                        <div>
                                          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-0.5">
                                            Comment
                                          </p>
                                          <p className="text-sm font-bold text-neutral-900 truncate max-w-[150px]" title={con.comment}>
                                            {con.comment || "-"}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}

                              {/* SCHEDULE */}
                              {service?.regularService?.[0].schedule?.length > 0 && (
                                <div className="border border-neutral-300 rounded-lg bg-white p-4 shadow-xs">
                                  <h2 className="font-bold text-xs uppercase tracking-wider text-neutral-700 mb-3">
                                    Schedule Dates
                                  </h2>
                                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-0.5">
                                    {service?.regularService?.[0]?.schedule?.map((sch, idx) => {
                                      console.log(sch); return (
                                        <span
                                          key={idx}
                                          className={`px-2 py-0.5 rounded text-xs font-bold border ${sch.completed
                                            ? "bg-green-100 text-green-900 border-green-400"
                                            : sch.status === "Missed"
                                              ? "bg-red-100 text-red-900 border-red-400"
                                              : "bg-neutral-200 text-neutral-900 border-neutral-400"
                                            }`}
                                        >
                                          {new Date(sch.date).toISOString().split("T")[0]}
                                        </span>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="m-4 text-center text-sm font-bold text-neutral-700">No schedule works found.</p>
        )}
      </div>
  );
}

export default AllScheduleService;