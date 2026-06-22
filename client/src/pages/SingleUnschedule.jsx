import React from 'react'
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
  const dispatch = useDispatch()
  const navigate = useNavigate();
  const [getStatus, setGetStatus] = useState(false)

  const { user, isModalOpen } = useSelector(store => store.helper);
  const { data: unscheduled = {}, isLoading: unscLoading } = useGetUnscheduledReportsQuery(id, { skip: !id });

  const [updateStatus] = useStatusUnscheduleMutation();
  const { data: DBUser } = useGetSingleUserQuery(user._id, { skip: !user?._id })


  const handleApprove = async () => {
    const data = { id, status: "Approved", req: "approval" }
    const res = await updateStatus(data).unwrap()
    setGetStatus(true)
    toast.success("Approved successfully")
    socket.emit("unscheduled-approved", { location: `${unscheduled.location.floor}-${unscheduled.location.location}` })
  }
  const handleDeny = async () => {
    const data = { id, status: "Rejected", req: "approval" }
    const res = await updateStatus(data).unwrap()
    setGetStatus(true)
    toast.success("Rejected successfully")
    socket.emit("unscheduled-approved", { location: unscheduled.location.floor })
  }
  const status = unscheduled?.approval?.status


  console.log(unscheduled)
  return (
    <section>
      <Headers header={'Unscheduled Work Report'} user={user} />

      <div className='grid grid-cols-2 gap-x-5 bg-white py-5 px-3 rounded-2xl text-sm md:text-base *:block'>
        <p>
          <strong className='underline'>Location: </strong>
          <span className='font-bold text-gray-600'>
            {unscheduled?.location?.floor || ""}, {unscheduled?.location?.location || ""}, {unscheduled?.location?.subLocation || ""}
          </span>
        </p>
        <p>
          <strong className='underline'>Reqsted services:  </strong>
          <span className='font-bold text-gray-600'>
            {unscheduled?.service?.map(s => s?.serviceName).join(", ") || ""}
          </span>
        </p>
        <p>
          <strong className='underline'>Date: </strong>
          <span className='font-bold text-gray-600'>
            {new Date(unscheduled?.createdAt).toLocaleString() || ""}
          </span>
        </p>
        <p>
          <strong className='underline'>Comment: </strong>
          <span className='font-bold text-gray-600'>
            {unscheduled?.comment || ""}
          </span>
        </p>
        <p>
          <strong className='underline'>Raised by: </strong>
          <span className='font-bold text-gray-600'>
            {unscheduled?.raisedBy?.user || ""}
          </span>
        </p>
        <p>
          <strong className='underline'>Images: </strong>
          <Button disabled={unscheduled?.image?.length === 0} small={true} label={'Show'}
            onClick={() => dispatch(toggleModal({ name: "unscimage", status: true }))}
          />
          {isModalOpen.unscimage && <ImagesModal name={'unscimage'} image={unscheduled?.image || ""} />}
        </p>
      </div>

      {status === "Pending" && (user.role === "Admin" || user.role === "ClientAdmin") &&
        <div className='mt-5 text-center '>
          <Button color="bg-red-600" label={'Deny'}
            onClick={handleDeny} />
          <Button color="bg-green-600" label={'Approve'}
            onClick={handleApprove} />
        </div>
      }

      <div className='mt-3 text-center capitalize'>
        <strong>Status: </strong> {status === "Approved" ? <span className='text-green-600 font-bold'>{`Approved by ${unscheduled?.approval.name}`}</span> : status === "Rejected" ? <span className='text-red-600 font-bold'>{"Rejected" + unscheduled?.approval.name}</span> : "Waiting for approval"}
      </div>

      {status === "Approved" && unscheduled?.update?.user === "" &&
        (DBUser?.rights.scan_Unscheduled || user.role === "Operator") && (
          <>
            <Button
              label="Unscheduled Work"
              onClick={() => dispatch(toggleModal({
                name: "unscheduled",
                status: true,
              }))} />

            {isModalOpen.unscheduled && <RegularForm type={'unscheduled'} id={unscheduled?._id} serviceData={unscheduled?.service} />}
          </>
        )}

      <hr className='mt-5 ' />


      {/* list */}
      <div className="overflow-x-auto w-full">
        <table className="min-w-3xl w-full border-collapse text-left border border-gray-400">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-400 *:not-last:border-r">

              <th className="pl-3 font-bold text-gray-700">Date</th>
              <th className="p-3 font-bold text-gray-700">Service Update By</th>
              <th className="p-3 font-bold text-gray-700">Comment</th>
              <th className="p-3 font-bold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-b-gray-400 hover:bg-gray-50 transition-all text-sm *:not-last:border-r">

              <td className="pl-3 text-gray-900 whitespace-nowrap">
                {new Date(unscheduled?.updatedAt).toLocaleString()}
              </td>
              <td className="p-3 text-gray-900">
                {status === "Approved" ? 
                <p><strong>Approved by:</strong> {unscheduled?.approval?.name}</p> : <p><strong>Rejected by:</strong> {unscheduled?.approval?.name}</p>}
                <br />{unscheduled?.update?.user}
              </td>
              <td className="p-3 text-gray-900">
                {unscheduled?.update?.comment}
              </td>
              <td className="p-3 text-gray-900">{unscheduled?.update?.status}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default SingleUnschedule;