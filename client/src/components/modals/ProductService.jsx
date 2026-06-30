import React from 'react'
import { dateFormat, formatShortDate } from '../../utils/helperFunctions'

function ProductService({ products }) {
  const today = new Date().toISOString().split("T")[0].toString()
  const schedules = products?.filter(p => p.schedule?.find(sc => sc.date === today)) || []
  const todaySchedulesDates = products?.flatMap(p => p?.schedule?.find(sc => sc.date === today && !sc.completed)) || []

  // const index = todaySchedulesDates

  console.log(schedules)
  return (
    <div>
      <div>
        <h3 className='font-semibold text-lg'>Product Service form</h3>
      </div>
      <div>
        {todaySchedulesDates?.map((d, i) => (
          <p key={i}>{formatShortDate(d?.date)}</p>
        ))}
      </div>
    </div>
  )
}

export default ProductService