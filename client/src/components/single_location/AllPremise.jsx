import React from 'react'
import { useParams } from 'react-router-dom'
import { useAllLocationsQuery } from '../../redux/locationSlice'

function AllPremise() {
  const id = useParams()

  const { data: locations = [] } = useAllLocationsQuery(id, { skip: !id });

  const today = new Date().toISOString().split("T")[0]
  const allPremiseSchedules = locations.locations?.filter(l => l?.service?.some(ser => ser.schedule?.some(sc => sc.date === today)))

  const dates = locations?.locations?.flatMap(loc => loc.service)

  return (
    <section className="bg-white rounded-md overflow-hidden select-none">
      <table className="w-full  border-collapse text-left text-sm text-slate-700">
        <thead>
          <tr className="border-b bg-gray-200 font-semibold text-slate-900 *:not-last:border-r ">
            <th className="py-3 px-2 text-center">No.</th>
            <th className="py-3 px-2">Location</th>
            <th className="py-3 px-2">Service name</th>
            <th className="py-3 px-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300 ">
          {allPremiseSchedules?.length === 0 ? <tr>
            <td colSpan="4" className="py-10 text-center">
              No Service Due for today
            </td>
          </tr> : allPremiseSchedules?.map((p, index) => {
            const completed = p.service.some(ser => ser.schedule.some(sc => sc.date === today && sc.completed))
            const total = p.service.flatMap(ser => ser.schedule.filter(sc => sc.date === today))
            const totalCompleted = p.service.flatMap(ser => ser.schedule.filter(sc => sc.date === today && sc.completed))


            const alldone = totalCompleted.length - total.length === 0

            return (
              <tr key={index} className={`${alldone ? "bg-green-400/60" : alldone > 0 < totalCompleted.length ? "bg-yellow-400/50" : ""} *:not-last:border-r`}>

                <td className="py-3 px-2 text-center">
                  {index + 1}
                </td>
                <td className="py-3 px-2">
                  {p.floor}, {p.location}, {p.sublocation}
                </td>
                <td className="py-3 px-2">
                  {p.service.map(s => s.serviceName).join(", ")}
                </td>
                <td className="py-3 px-2">
                  <p>
                    {completed ? "Completed" : "Pending"}
                  </p>
                  <p>
                    {totalCompleted.length}/{total.length}
                  </p>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

export default AllPremise;