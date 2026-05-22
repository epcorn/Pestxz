import React, { useState } from "react";

function SingleServiceForm({ serviceData = [] }) {
  const [selectedService, setSelectedService] = useState(0);
  const currentService = serviceData[selectedService];

  const handleChange = (field, value) => {
    console.log(field, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const form = Object.fromEntries(formData)
    form.serviceId = serviceData[selectedService].serviceId
    form.serviceName = serviceData[selectedService].serviceName
    form.scopeId = serviceData[selectedService].scopeId
    form.scopeName = serviceData[selectedService].scopeName
    form.consumableId = serviceData[selectedService].consumableId
    form.consumableName = serviceData[selectedService].consumableName
    console.log(form)
  };

  return (
    <div className="max-w-lg bg-white border border-gray-300 rounded-lg p-3 shadow-sm mx-auto">
      {/* Service Selector Top Bar */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-2.5 mb-2.5">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
          Service:
        </label>
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(Number(e.target.value))}
          className="w-full border border-gray-300 bg-gray-50 rounded-md px-2 py-1.5 text-base font-medium outline-none focus:border-green-500 focus:bg-white transition text-gray-800"
        >
          {serviceData.map((service, index) => (
            <option key={index} value={index}>
              {service.serviceName || `Service ${index + 1}`}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Service Form Workspace */}
      {currentService && (
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>

          {/* Configuration Metadata Overview Badges */}
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1.5 text-sm bg-gray-50 p-2 rounded-md border border-gray-200">
            <span className="text-gray-600">
              Scope: <strong className="text-gray-900 text-base font-semibold">{currentService?.scopeName || "N/A"}</strong>
            </span>
            <span className="text-gray-600">
              Consumable: <strong className="text-gray-900 text-base font-semibold">{currentService?.consumableName || "N/A"}</strong>
            </span>
          </div>

          {/* Calibration Metrics Container */}
          <div className="flex items-center justify-between border border-gray-200 bg-gray-50/50 px-3 py-2 rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Calibration</span>
              <span className="text-sm text-gray-700 font-semibold bg-white px-2 py-0.5 border border-gray-300 rounded-md shadow-inner">
                Max: {currentService?.calibration || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="usedCal" className="text-xs font-medium text-gray-600">Used:</label>
              <input
                id="usedCal"
                type="text"
                name="used"
                defaultValue={currentService?.usedCalibration || ""}
                onChange={(e) => handleChange("usedCalibration", e.target.value)}
                placeholder="0ml"
                className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm text-center outline-none focus:border-green-500 bg-white"
              />
            </div>
          </div>

          {/* Action Selector and Comment Field Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-start">
            <div className="flex flex-col gap-1 sm:col-span-1">
              <label htmlFor="actionSelect" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Action</label>
              <select
                id="actionSelect"
                name="action"
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs outline-none bg-white text-gray-800 font-medium focus:border-green-500"
              >
                <option value="Service Done">Done</option>
                <option value="Service not Done">Not Done</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label htmlFor="commentText" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Comment</label>
              <textarea
                id="commentText"
                rows={1}
                name="comment"
                defaultValue={currentService?.comment || ""}
                onChange={(e) => handleChange("comment", e.target.value)}
                placeholder="Add service notes..."
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm outline-none focus:border-green-500 resize-none h-8 focus:h-16 transition-all duration-200"
              />
            </div>
          </div>

          {/* Form Action Footer Row */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200 mt-1">
            <div className="flex items-center max-w-[60%]">
              <label className="text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md px-2.5 py-1 cursor-pointer transition select-none flex items-center gap-1">
                Attach File
                <input
                  type="file"
                  name="image"
                  className="hidden"
                  onChange={(e) => handleChange("file", e.target.files[0])}
                />
              </label>
            </div>

            <button
              type="submit"
              className="px-5 py-1.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 active:scale-95 rounded-md shadow-sm transition-all uppercase tracking-wider"
            >
              Submit
            </button>
          </div>

        </form>
      )}
    </div>
  );
}

export default SingleServiceForm;
