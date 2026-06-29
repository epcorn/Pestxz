import React, { useState } from 'react'

function ProductShow({ products }) {
  const [show, setShow] = useState(false)

  return (
    <section className="">
      <div className="mt-3 ">
        <h3 className='text-lg font-semibold '>Products Overview</h3>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left m-0.5 rounded-md table-auto outline outline-1 outline-black min-w-[900px]">
          <thead className='bg-gray-300 text-sm'>
            <tr className="border-b border-black whitespace-nowrap *:px-4 *:py-2">
              <th className="border-r border-black">Product Name</th>
              <th className="border-r border-black">Version</th>
              <th className="border-r border-black">Code</th>
              <th className="border-r border-black">Serial No</th>
              <th className="border-r border-black">Frequency</th>
              <th>Scheduled Dates</th>
            </tr>
          </thead>
          <tbody className="whitespace-nowrap bg-white text-sm">
            {products?.map(pr => {
              const schedules = pr?.schedule
              const slicedSchedules = show ? schedules : pr.schedule.slice(0, 5)
              return (
                <tr key={pr.productId} className="border-b border-black last:border-b-0 *:px-2">
                  <td className="border-r border-black">{pr.productName}</td>
                  <td className="border-r border-black">{pr.versionName}</td>
                  <td className="border-r border-black">{pr.code}</td>
                  <td className="border-r border-black">{pr.code}</td>
                  <td className="border-r border-black">{pr.frequency}</td>
                  <td className=''>
                    <div className="flex flex-wrap *:flex-1 gap-2 min-w-[200px] p-1 max-h-20 text-xs font-semibold overflow-auto">
                      {slicedSchedules?.map(sc => (
                        <span key={sc.date} className="outline-1 rounded outline-black px-1.5 py-0.5">
                          {sc.date}
                        </span>
                      ))}

                      <span className='underline text-cyan-700' onClick={() => setShow(!show)}>{show ? "Show less" : "Show All"}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default ProductShow
