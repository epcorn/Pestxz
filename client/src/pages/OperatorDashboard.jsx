import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import UnscheduledNotification from '../components/dashboard/UnscheduledNotification';
import { useGetAllAssignedWorkQuery, useGetCasualsQuery } from '../redux/serviceSlice';
import { ComplaintTable } from '../components';
import Headers from '../components/Headers';
import { useGetUnscheduledReportsQuery } from '../redux/locationSlice';
import UnScheduledList from '../components/single_location/UnScheduledList';
import CasualLists from '../components/single_location/casual/CasualLists';

function OperatorDashboard() {
  const [toggle, setToggle] = useState({ name: "Complaint", status: true })
  const { user } = useSelector(store => store.helper);
  const { data: assignedWork } = useGetAllAssignedWorkQuery();
  const { data: casuals } = useGetCasualsQuery();
  const { data: unschedule } = useGetUnscheduledReportsQuery("Operator", { refetchOnReconnect: true })

  console.log(casuals, unschedule);

  return (
    <div className='mx-auto'>
      <div>
        {/* Headers  */}
        <Headers header={'Operator Dashboard'} user={user} />
        {/* <div>
          <UnscheduledNotification user={user} id={'Operator'} />
        </div> */}
      </div>
      <div className='w-full'>
        <div className='flex gap-3 *:outline *:px-2 *:py-1.5 justify-center *:rounded-2xl *:text-sm *:leading-none *:transition-all'>
          {["Complaint", "Un-Scheduled Work", "Casual"].map(s => (
            <strong key={s}
              className={`${toggle.name === s ? "bg-blue-600 text-white" : "cursor-pointer"}`}
              onClick={() => setToggle(prev => ({
                name: prev.name === s ? "" : s,
                status: prev.name !== s
              }))}
            >
              {s}
            </strong>
          ))}
        </div>

        {toggle.name === "Complaint" &&
          <>
            <h3 className='text-lg text-center font-bold m-2 '>You have total {assignedWork?.length} Complaints</h3>
            <ComplaintTable toggle={'Complaint'} data={assignedWork} user={user} />
          </>
        }
        {toggle.name === "Un-Scheduled Work" &&
          <>
            <h3 className='text-lg text-center font-bold m-2 '>Total Unscheduled Reports {unschedule?.length} </h3>
            <UnScheduledList toggle={'Un-Scheduled Work'} work={unschedule} />
          </>
        }
        {toggle.name === "Casual" &&
          <>
            <h3 className='text-lg text-center font-bold m-2 '>Total Casuals Services ({casuals?.length})
            </h3>
            <CasualLists toggle={'Casual'} work={casuals} />
          </>
        }
      </div>
    </div>
  );
}

export default OperatorDashboard;
