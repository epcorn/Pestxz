import React, { Fragment } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { useGetUnscheduledReportsQuery, useStatusUnscheduleMutation } from '../redux/locationSlice';
import { Button } from '../components';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useState } from 'react';
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
    await updateStatus({ id, status: "Approved", req: "approval" }).unwrap();
    setGetStatus(true);
    toast.success("Approved successfully");
    socket.emit("unscheduled-approved", {
      location: `${unscheduled.location.floor}-${unscheduled.location.location}`
    });
  };

  const handleDeny = async () => {
    await updateStatus({ id, status: "Rejected", req: "approval" }).unwrap();
    setGetStatus(true);
    toast.success("Rejected successfully");
    socket.emit("unscheduled-approved", { location: unscheduled.location.floor });
  };

  const status = unscheduled?.approval?.status;
  const services = unscheduled?.service?.filter(ser => ser.completed);

  console.log(services)

  return (
    <section className="space-y-4">
      <Headers header="Unscheduled Work Report" user={user} />

      {/* ── Details card ── */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm text-sm divide-y divide-gray-100">
        {[
          {
            label: "Location",
            value: [unscheduled?.location?.floor, unscheduled?.location?.location].filter(Boolean).join(", ") || "—",
          },
          {
            label: "Requested Services",
            value: (
              <span className="font-semibold text-blue-600">
                {unscheduled?.service?.map(s => s?.serviceName).join(", ") || "None"}
              </span>
            ),
          },
          {
            label: "Reporter / Date",
            value: (
              <span className="text-right">
                <span className="block">{unscheduled?.raisedBy?.user || "N/A"}</span>
                <span className="block text-gray-400 text-xs">
                  {unscheduled?.createdAt ? new Date(unscheduled.createdAt).toLocaleString() : ""}
                </span>
              </span>
            ),
          },
          {
            label: "Comment",
            value: (
              <span className="text-gray-500 italic text-right max-w-[60%] truncate" title={unscheduled?.comment}>
                {unscheduled?.comment || "None"}
              </span>
            ),
          },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center gap-4 px-4 py-2">
            <span className="font-bold text-gray-700 shrink-0">{label}</span>
            <span className="text-gray-800 text-right">{value}</span>
          </div>
        ))}

        {/* Pest images row */}
        <div className="flex justify-between items-center gap-4 px-4 py-2">
          <span className="font-bold text-gray-700 shrink-0">
            Pest Images ({unscheduled?.image?.length || 0})
          </span>
          <Button
            small
            label="View"
            disabled={!unscheduled?.image?.length}
            onClick={() => dispatch(toggleModal({ name: "unscimage", status: true }))}
          />
          {isModalOpen.unscimage && (
            <ImagesModal name="unscimage" image={unscheduled?.image || ""} />
          )}
        </div>
      </div>

      {/* ── Approve / Deny ── */}
      {status === "Pending" && (user.role === "Admin" || user.role === "ClientAdmin") && (
        <div className="flex justify-center gap-3">
          <Button color="bg-red-600" label="Deny" onClick={handleDeny} />
          <Button color="bg-green-600" label="Approve" onClick={handleApprove} />
        </div>
      )}

      {/* ── Approval status ── */}
      <p className="text-center text-sm capitalize">
        <strong>Status: </strong>
        {status === "Approved" ? (
          <span className="text-green-600 font-bold">
            Approved by {unscheduled?.approval?.name}
          </span>
        ) : status === "Rejected" ? (
          <span className="text-red-600 font-bold">
            Rejected by {unscheduled?.approval?.name}
          </span>
        ) : (
          "Waiting for approval"
        )}
      </p>

      {/* ── Unscheduled Work button ── */}
      {status === "Approved" && !services?.length && (DBUser?.rights.scan_Unscheduled || user.role === "Operator") && (
        <>
          <div className="flex justify-center">
            <Button
              label="Unscheduled Work"
              onClick={() => dispatch(toggleModal({ name: "unscheduled", status: true }))}
            />
          </div>
          {isModalOpen.unscheduled && (
            <RegularForm type="unscheduled" id={unscheduled?._id} serviceData={unscheduled?.service} />
          )}
        </>
      )}

      <hr className="border-gray-200" />

      {/* ── Update history table ── */}
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[480px] border-collapse text-left border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="p-3 font-bold text-gray-700 border-r border-gray-300 whitespace-nowrap">Date</th>
              <th className="p-3 font-bold text-gray-700 border-r border-gray-300">Service Update By</th>
              <th className="p-3 font-bold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
              <td className="p-3 text-gray-700 whitespace-nowrap align-top border-r border-gray-300">
                {unscheduled?.updatedAt ? new Date(unscheduled.updatedAt).toLocaleString() : "—"}
              </td>
              <td className="p-3 text-gray-700 align-top border-r border-gray-300">
                {status === "Approved" ? (
                  <div className="space-y-0.5">
                    <p><strong>Approved by:</strong> {unscheduled?.approval?.name}</p>
                    {services?.map(ser => (
                      <p key={ser._id}>
                        <strong>Completed</strong>{" "}
                        <span className="underline">{ser.serviceName}</span>{" "}
                        <strong>by</strong>{" "}
                        <span>{ser?.completedBy?.user}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p><strong>Rejected by:</strong> {unscheduled?.approval?.name}</p>
                )}
              </td>
              <td className="p-3 text-gray-700 align-top">
                {services?.map(ser => (
                  <p key={ser._id}>{ser.completed ? "Done" : "—"}</p>
                ))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Completed services breakdown ── */}
      {services?.length > 0 && (
        <div className="space-y-3">
          {services.map((ser, i) => (
            <div key={ser.serviceId} className="bg-white border border-gray-200 rounded-lg p-4 text-sm shadow-sm">
              <p className="font-bold text-gray-800 mb-2">
                ({i + 1}) {ser.serviceName}
              </p>

              {ser?.scopes?.map(sc => (
                <div key={sc.scopeId} className="ml-4 mb-2">
                  <p className="font-semibold text-gray-700 mb-1">
                    Scope: <span className="font-normal">{sc.scopeName}</span>
                  </p>

                  {sc.consumables?.map(con => (
                    <div key={con.consumableId} className="ml-4 grid grid-cols-2 gap-x-4 gap-y-0.5 text-gray-600 border-l-2 border-gray-200 pl-3 mb-2">
                      <span><strong>Consumable:</strong> {con.consumableName}</span>
                      <span><strong>Action:</strong> {con.action}</span>
                      <span><strong>Calibration:</strong> {con.calibration}</span>
                      <span><strong>Comment:</strong> {con.comment}</span>
                    </div>
                  ))}
                </div>
              ))}

              <p className="ml-4 text-gray-500 text-xs mt-1">
                <strong>Completed by:</strong> {ser?.completedBy?.user || "—"}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default SingleUnschedule;