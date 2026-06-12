import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import UnscheduledNotification from '../components/dashboard/UnscheduledNotification';
import { useGetAllAssignedWorkQuery } from '../redux/serviceSlice';
import { ComplaintTable } from '../components';

function OperatorDashboard() {
  const [toggle, setToggle] = useState({ name: "", status: false })
  const { user } = useSelector(store => store.helper);
  const { data: assignedWork } = useGetAllAssignedWorkQuery()

  return (
    <div className='mx-auto'>
      <div>
        <p className='text-center font-semibold text-2xl mt-5 '>
          Hi, {user?.name || 'Guest'}
        </p>
        <div>
          <UnscheduledNotification user={user} id={'Operator'} />
        </div>
      </div>
      <div className='w-full'>
        <div className='flex gap-3 *:outline *:px-2 *:py-1.5 *:rounded-2xl *:text-sm *:leading-none *:transition-all'>
          <strong
            className={`${toggle.name === "comp" ? "bg-blue-600 text-white" : "cursor-pointer"}`}
            onClick={() => setToggle(prev => ({
              name: prev.name === "comp" ? "" : "comp",
              status: prev.name !== "comp"
            }))}
          >
            Complaint
          </strong>

          <strong
            className={`${toggle.name === "UnSC" ? "bg-blue-600 text-white" : "cursor-pointer"}`}
            onClick={() => setToggle(prev => ({
              name: prev.name === "UnSC" ? "" : "UnSC",
              status: prev.name !== "UnSC"
            }))}
          >
            Un-Scheduled Work
          </strong>
        </div>

        <h3 className='text-lg font-bold m-2 '>You have total {assignedWork?.length} Complaints</h3>
        <ComplaintTable toggle={'Complaint'} data={assignedWork} user={user} />
      </div>
    </div>
  );
}

export default OperatorDashboard;
