import React from 'react'
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { useGetAuditReportQuery } from '@/redux/auditorSlice';
import { Card, CardAction, CardContent, CardTitle } from '../ui/card';
import { dateFormat } from '@/utils/helperFunctions';

function AuditorDashboard() {
  const navigate = useNavigate();
  const { data } = useGetAuditReportQuery();
  console.log(data)
  return (
    <div>
      <header>
        <h1 className='text-3xl font-semibold tracking-wider py-3 uppercase '>Audit Dashboard</h1>
      </header>
      <div>
        <div className='flex items-center justify-between border-b border-b-gray-600 py-2'>
          <h4 className='font-semibold'>
            Recent Audit Logs
          </h4>
          <Button type='button' size='sm' onClick={(e) => { e.preventDefault(); navigate(`/auditor/form`) }}>New Inspection</Button>
        </div>
        <div>
          {data?.map((d) => (
            <Card key={d?._id} className="bg-black text-white mt-1">
              <CardContent className="grid grid-cols-4 items-center">
                <CardTitle>{dateFormat(d?.inspectionDate) || ""}</CardTitle>
                <CardTitle><p>{d?.client?.name || ""}</p><p className='text-sm text-neutral-400 font-normal'>{d.site}</p><p className='text-sm text-neutral-400 font-normal'>{d.siteType}</p></CardTitle>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AuditorDashboard;