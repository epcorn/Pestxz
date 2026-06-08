import React from 'react'
import { useParams } from 'react-router-dom'
import { useAllLocationsQuery } from '../../redux/locationSlice'

function AllPremise() {
  const id = useParams()

  const { data: locations = [] } = useAllLocationsQuery(id, { skip: !id });

  const today = new Date().toISOString().split("T")[0]
  const allPremiseSchedules = locations.locations?.filter(l => l?.service?.map(ser => ser.schedule?.map(sc => sc.date === today)))
  console.log(allPremiseSchedules)

  return (
    <section>
      <div className='flex justify-between'>
        <p>date</p>
        <p>freqency</p>
        <p>service name</p>
        <p>location</p>
        <p>date</p>
      </div>
      {allPremiseSchedules?.map(p => (
        <div key={p._id} className='flex justify-between'>
          <div>
            <p>{new Date(p.createdAt).toISOString().split("T")[0]}</p>
          </div>
          <div>
            <p>{p.frequency}</p>
          </div>
          <div>
            <p>{p.floor},{p.location},{p.sublocation}</p>
          </div>
        </div>
      ))}

    </section>
  )
}

export default AllPremise