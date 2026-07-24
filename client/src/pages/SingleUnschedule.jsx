import React, { Fragment, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetUnscheduledReportsQuery, useStatusUnscheduleMutation } from '../redux/locationSlice';
import { Button } from '../components';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useGetSingleUserQuery } from '../redux/userSlice';
import { toggleModal } from '../redux/helperSlice';
import UnscheduledForm from '../components/single_location/UnscheduledForm';
import { socket } from '../socket';
import ImagesModal from '../components/modals/ImagesModal';
import Headers from '../components/Headers';
import RegularForm from '../components/modals/RegularForm';

function SingleUnschedule() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [getStatus, setGetStatus] = useState(false);

  const { user, isModalOpen } = useSelector(store => store.helper);
  const { data: unscheduled = {}, isLoading: unscLoading } = useGetUnscheduledReportsQuery(id, { skip: !id });
  const [updateStatus] = useStatusUnscheduleMutation();
  const { data: DBUser } = useGetSingleUserQuery(user._id, { skip: !user?._id });

  const handleApprove = async () => {
    const res = await updateStatus({ id, status: "Approved", req: "approval" }).unwrap();
    setGetStatus(true);
    toast.success("Approved successfully");
    socket.emit("unscheduled-approved", {
      ...res,
      location: `${unscheduled.location.floor}-${unscheduled.location.location}`
    });
  };

  const handleDeny = async () => {
    const res = await updateStatus({ id, status: "Rejected", req: "approval" }).unwrap();
    setGetStatus(true);
    toast.success("Rejected successfully");
    socket.emit("unscheduled-approved", { ...res, location: unscheduled.location.floor });
  };

  const status = unscheduled?.approval?.status;
  const services = unscheduled?.service?.filter(ser => ser.completed);

  if (unscLoading) {
    return <div className="p-4 text-center text-sm font-bold text-neutral-800">Loading Report...</div>;
  }

  return (
    <section className="space-y-4 md:space-y-6 max-w-6xl mx-auto p-3 md:p-4">
      <Headers header="Unscheduled Work Report" user={user} />

      {/* ── MAIN DETAILS CARD ── */}
      <div className="bg-white rounded-xl border border-neutral-300 shadow-sm overflow-hidden">
        <div className="p-3.5 md:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">

          {/* LOCATION */}
          <div className="space-y-0.5">
            <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-neutral-700 block">Location</span>
            <span className="text-sm font-bold text-neutral-950 block">
              {[unscheduled?.location?.floor, unscheduled?.location?.location].filter(Boolean).join(", ") || "—"}
            </span>
          </div>

          {/* REQUESTED SERVICES */}
          <div className="space-y-0.5">
            <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-neutral-700 block">Requested Services</span>
            <span className="text-sm font-bold text-blue-700 block">
              {unscheduled?.service?.map(s => s?.serviceName).join(", ") || "None"}
            </span>
          </div>

          {/* REPORTER / DATE */}
          <div className="space-y-0.5">
            <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-neutral-700 block">Reporter / Date</span>
            <div className="text-sm font-bold text-neutral-950">
              <span>{unscheduled?.raisedBy?.user || "N/A"}</span>
              <span className="block text-xs font-medium text-neutral-600 mt-0.5">
                {unscheduled?.createdAt ? new Date(unscheduled.createdAt).toLocaleString() : ""}
              </span>
            </div>
          </div>

          {/* COMMENT */}
          <div className="sm:col-span-2 md:col-span-2 space-y-0.5">
            <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-neutral-700 block">Comment</span>
            <p className="text-sm font-medium text-neutral-800 italic bg-neutral-50 border border-neutral-200 rounded-lg p-2 md:p-2.5 whitespace-pre-wrap">
              {unscheduled?.comment || "No comment provided."}
            </p>
          </div>

          {/* PEST IMAGES */}
          <div className="space-y-1 flex flex-row sm:flex-col justify-between items-center sm:items-start gap-2">
            <div>
              <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-0.5">Pest Attachments</span>
              <span className="text-xs font-bold text-neutral-950 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300 inline-block">
                Images Total: {unscheduled?.image?.length || 0}
              </span>
            </div>
            <div className="sm:mt-2">
              <Button
                small
                label="View Images"
                disabled={!unscheduled?.image?.length}
                color={unscheduled?.image?.length ? "bg-blue-900 text-white hover:bg-blue-800 transition font-bold text-xs px-3 py-1 rounded" : "bg-neutral-600 text-neutral-700 border border-neutral-200 cursor-not-allowed text-xs px-3 py-1 rounded"}
                onClick={() => dispatch(toggleModal({ name: "unscimage", status: true }))}
              />
            </div>
            {isModalOpen.unscimage && (
              <ImagesModal name="unscimage" image={unscheduled?.image || ""} />
            )}
          </div>
        </div>

        {/* CARD FOOTER: ACTION & STATUS STATE */}
        <div className="bg-neutral-50 border-t border-neutral-300 px-3.5 py-3 md:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Status Display Badge */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-neutral-700">Status:</span>
            {status === "Approved" ? (
              <span className="inline-flex items-center rounded-md bg-green-100 border border-green-400 px-2.5 py-0.5 text-xs font-bold text-green-900">
                Approved by {unscheduled?.approval?.name}
              </span>
            ) : status === "Rejected" ? (
              <span className="inline-flex items-center rounded-md bg-red-100 border border-red-400 px-2.5 py-0.5 text-xs font-bold text-red-900">
                Rejected by {unscheduled?.approval?.name}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-amber-100 border border-amber-400 px-2.5 py-0.5 text-xs font-bold text-amber-900 animate-pulse">
                Awaiting Approval
              </span>
            )}
          </div>

          {/* Action Management Buttons */}
          {status === "Pending" && (user.role === "Admin" || user.role === "ClientAdmin") && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button color="bg-red-700 hover:bg-red-800 text-white font-bold px-3 py-1 rounded transition shadow-sm text-xs" label="Deny" onClick={handleDeny} />
              <Button color="bg-green-700 hover:bg-green-800 text-white font-bold px-3 py-1 rounded transition shadow-sm text-xs" label="Approve" onClick={handleApprove} />
            </div>
          )}

          {/* Initiation Trigger button */}
          {status === "Approved" && !services?.length && (DBUser?.rights.scan_Unscheduled || user.role === "Operator") && (
            <div className="w-full sm:w-auto">
              <Button
                label="Execute Unscheduled Work"
                color="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-1.5 rounded transition text-xs shadow-sm w-full sm:w-auto"
                onClick={() => dispatch(toggleModal({ name: "unscheduled", status: true }))}
              />
              {isModalOpen.unscheduled && (
                <RegularForm type="unscheduled" id={unscheduled?._id} serviceData={unscheduled?.service} today={new Date()} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── UPDATE MANAGEMENT TRACK HISTORY ── */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">Service Log</h3>
        <div className="overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[600px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-700">
                  <th className="p-3 border-r border-neutral-300 w-1/4">Timestamp</th>
                  <th className="p-3 border-r border-neutral-300 w-2/4">Service Operation Updates</th>
                  <th className="p-3 w-1/4">Execution Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr className="hover:bg-neutral-50/50 transition-colors">
                  <td className="p-3 text-neutral-900 font-semibold align-top border-r border-neutral-300">
                    {unscheduled?.updatedAt ? new Date(unscheduled.updatedAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-3 text-neutral-900 align-top border-r border-neutral-300">
                    {status === "Approved" ? (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-green-900">
                          ✓ Approved by: <span className="font-extrabold underline">{unscheduled?.approval?.name}</span>
                        </p>
                        {services?.map(ser => (
                          <div key={ser._id} className="text-xs bg-neutral-100 rounded-md p-2 border border-neutral-200 space-y-0.5">
                            <p className="font-bold text-neutral-900">
                              Service Finalized: <span className="text-blue-800">{ser.serviceName}</span>
                            </p>
                            <p className="text-neutral-700 font-medium">
                              Fulfilled By: <span className="font-bold">{ser?.completedBy?.user}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-red-900">
                        ✕ Rejected by: <span className="font-extrabold">{unscheduled?.approval?.name}</span>
                      </p>
                    )}
                  </td>
                  <td className="p-3 align-top">
                    {services?.length > 0 ? (
                      <div className="space-y-2">
                        {services.map(ser => (
                          <span key={ser._id} className="inline-flex items-center rounded bg-green-100 border border-green-300 px-2 py-0.5 text-xs font-bold text-green-900 block w-max">
                            COMPLETED
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded bg-neutral-200 border border-neutral-300 px-2 py-0.5 text-xs font-bold text-neutral-800">
                        NO EXECUTION
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── COMPLETE MATERIAL SUMMARIES & BREAKDOWN ── */}
      {services?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">Completed Specifications Breakdown</h3>
          <div className="grid grid-cols-1 gap-4">
            {services.map((ser, i) => (
              <div key={ser.serviceId} className="bg-white border border-neutral-300 rounded-xl p-4 shadow-sm space-y-3">
                <div className="border-b border-neutral-200 pb-2 flex justify-between items-center">
                  <h4 className="font-bold text-sm text-neutral-950">
                    ({i + 1}) {ser.serviceName}
                  </h4>
                  <span className="text-xs font-bold text-neutral-700 bg-neutral-100 border border-neutral-300 px-2.5 py-0.5 rounded">
                    Operator: {ser?.completedBy?.user || "—"}
                  </span>
                </div>

                {ser?.scopes?.map(sc => (
                  <div key={sc.scopeId} className="space-y-2">
                    <p className="font-bold text-xs uppercase tracking-wider text-neutral-700">
                      Scope Environment: <span className="text-neutral-950 font-extrabold normal-case">{sc.scopeName}</span>
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                      {sc.consumables?.map(con => (
                        <div key={con.consumableId} className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="col-span-2 border-b border-neutral-200 pb-1 mb-1">
                            <span className="font-bold text-neutral-700 block uppercase tracking-tight text-[10px]">Consumable Material</span>
                            <span className="font-bold text-sm text-neutral-950">{con.consumableName}</span>
                          </div>
                          <div>
                            <span className="font-bold text-neutral-700 block text-[10px] uppercase">Action Plan</span>
                            <span className="font-bold text-neutral-900">{con.action || "—"}</span>
                          </div>
                          <div>
                            <span className="font-bold text-neutral-700 block text-[10px] uppercase">Calibration</span>
                            <span className="font-bold text-neutral-900">{con.calibration || "0"}</span>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-neutral-100 mt-1">
                            <span className="font-bold text-neutral-700 block text-[10px] uppercase">Comments</span>
                            <p className="font-medium text-neutral-950 italic">{con.comment || "No logs."}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default SingleUnschedule;