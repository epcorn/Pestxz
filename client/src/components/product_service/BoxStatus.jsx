import React, { useId } from 'react'

const productsMap = [
  { rodent: "Quality of Box", status: "Ok", status1: "Need Repair" },
  { Snapper: "Quality of Machine", status: "Ok", status1: "Need Repair" },
  { "Anti Crawler": "Quality of Machine" },
]

function BoxStatus({ handleStatusChange, id, currentStatus, currentQuality }) {
  const qualityId = useId()
  const statusId = useId()
  
  return (
    <div className='flex justify-between flex-wrap gap-2'>
      {/* Status Fieldset Group */}
      <div className={`flex gap-2 items-center outline p-2 ${currentStatus === "missing" ? "bg-red-100" : "bg-green-100"}`}>
        <strong>Product Status: </strong>
        <div className='flex items-center gap-1 rounded outline px-2 py-0.5'>
          <input
            value='found'
            type="radio"
            id={`${statusId}-found`}
            name={`status-${id}`} // Unique per product item row
            checked={currentStatus === 'found'}
            onChange={(e) => handleStatusChange(id, 'status', e.target.value)}
          />
          <label htmlFor={`${statusId}-found`}>Found</label>
        </div>
        <div className='flex items-center gap-1 rounded outline px-2 py-0.5'>
          <input
            value='missing'
            type="radio"
            id={`${statusId}-missing`}
            name={`status-${id}`}
            checked={currentStatus === 'missing'}
            onChange={(e) => handleStatusChange(id, 'status', e.target.value)}
          />
          <label htmlFor={`${statusId}-missing`}>Missing</label>
        </div>
      </div>
      {/* Box Quality Fieldset Group */}
      {currentStatus === "found" &&
        <div className={`flex gap-5 items-center outline p-2 rounded ${currentQuality === "ok" ? "bg-blue-100" : "bg-cyan-100"}`}>
          <strong>Box Quality: </strong>
          <div className='flex items-center gap-1 rounded outline px-2 py-0.5'>
            <input
              type="radio"
              value='ok'
              name={`quality-${id}`} // Fixed: Scoped per product ID
              checked={currentQuality === 'ok'}
              id={`${qualityId}-ok`}
              onChange={(e) => handleStatusChange(id, 'quality', e.target.value)}
            />
            <label htmlFor={`${qualityId}-ok`}>Ok</label>
          </div>
          <div className='flex items-center gap-1 rounded outline px-2 py-0.5'>
            <input
              type="radio"
              value='notok'
              name={`quality-${id}`} // Fixed: Scoped per product ID
              checked={currentQuality === 'notok'}
              id={`${qualityId}-notok`}
              onChange={(e) => handleStatusChange(id, 'quality', e.target.value)}
            />
            <label htmlFor={`${qualityId}-notok`}>Needs Repair</label>
          </div>
        </div>
      }
    </div>
  )
}

export default BoxStatus
