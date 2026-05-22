import React from 'react'

function InputCheck({ value, onChange, required }) {
  const rights = value || {
    raise: false,
    close: false,
    scan_Scheduled: false,
    scan_Unscheduled: false,
  }

  const handleCheckboxChange = (key) => {
    onChange({
      ...rights,
      [key]: !rights[key],
    });
  };
  return (
    <div className="grid grid-cols-2 *:space-x-2 font-semibold">
      <h2 className="col-span-2 my-1">User Rights{required && (
        <span className="text-red-500 required-dot ml-0.5">*</span>
      )}</h2>
      <div>
        <input type="checkbox" name="raise" id="raise" checked={!!rights.raise} onChange={() => handleCheckboxChange("raise")} />
        <label htmlFor="raise" className='whitespace-break-spaces'>Raise Complaint</label>
      </div>
      <div>
        <input type="checkbox" name="close" id="close" checked={!!rights.close} onChange={() => handleCheckboxChange("close")} />
        <label htmlFor="close" className='whitespace-break-spaces'>Close Complaint</label>
      </div>
      <div>
        <input type="checkbox" name="scan_Scheduled" id="scan_Scheduled" checked={!!rights.scan_Scheduled} onChange={() => handleCheckboxChange("scan_Scheduled")} />
        <label htmlFor="scan_Scheduled" className='whitespace-break-spaces'>Scan Scheduled</label>
      </div>
      <div>
        <input type="checkbox" name="scan_Unscheduled" id="scan_Unscheduled" checked={!!rights.scan_Unscheduled} onChange={() => handleCheckboxChange("scan_Unscheduled")} />
        <label htmlFor="scan_Unscheduled" className='whitespace-break-spaces'>Scan Unscheduled</label>
      </div>

    </div>

  )
}

export default InputCheck