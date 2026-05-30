import React from "react";

function InputCheck({ value, onChange, required, selectedType }) {
  // Always normalize rights safely
  const rights = {
    raise: false,
    close: false,
    scan_Scheduled: false,
    scan_Unscheduled: false,
    delete: false,
    addData: false,
    ...value,
  };

  const handleCheckboxChange = (key) => {
    const updated = {
      ...rights,
      [key]: !rights[key],
    };

    onChange(updated); // IMPORTANT: always send fresh object
  };

  return (
    <div className="grid grid-cols-2 gap-2 font-semibold text-sm">
      <h2 className="col-span-2 my-1">
        User Rights
        {required && <span className="text-red-500 ml-1">*</span>}
      </h2>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="raise"
          checked={rights.raise}
          onChange={() => handleCheckboxChange("raise")}
        />
        <label htmlFor="raise">Raise Complaint</label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="close"
          checked={rights.close}
          onChange={() => handleCheckboxChange("close")}
        />
        <label htmlFor="close">Close Complaint</label>
      </div>

      {selectedType === "PestEmployee" &&
        <>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="scan_Scheduled"
              checked={rights.scan_Scheduled}
              onChange={() => handleCheckboxChange("scan_Scheduled")}
            />
            <label htmlFor="scan_Scheduled">Scan Scheduled</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="scan_Unscheduled"
              checked={rights.scan_Unscheduled}
              onChange={() => handleCheckboxChange("scan_Unscheduled")}
            />
            <label htmlFor="scan_Unscheduled">Scan Unscheduled</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="delete"
              checked={rights.delete}
              onChange={() => handleCheckboxChange("delete")}
            />
            <label htmlFor="delete">Delete</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="addData"
              checked={rights.addData}
              onChange={() => handleCheckboxChange("addData")}
            />
            <label htmlFor="addData">Add Data</label>
          </div>
        </>
      }
    </div>
  );
}

export default InputCheck;