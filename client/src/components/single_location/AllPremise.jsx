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
    <section className="bg-white rounded-md">
      <table className="w-full  border-collapse text-left text-sm text-slate-700">
        <thead>
          <tr className="border-b-2 bg-gray-200 border-slate-200 font-semibold text-slate-900">
            <th className="py-3 px-2">Date</th>
            <th className="py-3 px-2">Location</th>
            <th className="py-3 px-2">Service name</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {allPremiseSchedules?.map((p, index) => (
            <tr key={index}>
              <td className="py-3 px-2 whitespace-nowrap">
                {new Date(p.createdAt).toISOString().split("T")[0]}
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

export default AllPremise