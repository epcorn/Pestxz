import React from 'react'
import { useParams } from 'react-router-dom'
import { useAllLocationsQuery } from '../../redux/locationSlice'

function AllPremise() {
  const id = useParams()

  const { data: locations = [] } = useAllLocationsQuery(id, { skip: !id });

  const today = new Date().toISOString().split("T")[0]
  const allPremiseSchedules = locations.locations?.filter(l => l?.service?.some(ser => ser.schedule?.some(sc => sc.date === today)))

  const dates = locations?.locations?.flatMap(loc => loc.service)

  // console.log(dates)
  return (
    <section className="bg-white rounded-md overflow-hidden">
      <table className="w-full  border-collapse text-left text-sm text-slate-700">
        <thead>
          <tr className="border-b bg-gray-200 font-semibold text-slate-900 *:not-last:border-r ">
            <th className="py-3 px-2 text-center">No.</th>
            <th className="py-3 px-2">Location</th>
            <th className="py-3 px-2">Service name</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300 ">
          {allPremiseSchedules?.map((p, index) => (
            <tr key={index} className='*:not-last:border-r'>

              <td className="py-3 px-2 text-center">
                {index + 1}
              </td>
              <td className="py-3 px-2">
                {p.floor}, {p.location}, {p.sublocation}
              </td>
              <td className="py-3 px-2">
                {p.service.map(s => s.serviceName).join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default AllPremise;