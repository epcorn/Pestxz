import React, { useState } from "react";
import { toast } from "react-toastify";
import { useRegularServiceMutation } from "../redux/serviceSlice";

function SingleServiceForm({ serviceData = [], id, setRegular }) {
  const [selectedService, setSelectedService] = useState(0);

  const [form, setForm] = useState({
    usedCalibration: "",
    action: "Service Done",
    comment: "",
    image: null,
  });
  console.log(id)
  const [regularService, { isLoading }] =
    useRegularServiceMutation();

  const currentService = serviceData[selectedService];

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      formData.append(
        "serviceName",
        currentService?.serviceName
      );

      formData.append(
        "scopeName",
        currentService?.scopeName
      );

      formData.append(
        "consumableName",
        currentService?.consumableName
      );

      formData.append(
        "calibration",
        currentService?.calibration
      );

      formData.append(
        "usedCalibration",
        form.usedCalibration
      );

      formData.append(
        "action",
        form.action
      );

      formData.append(
        "comment",
        form.comment
      );

      if (form.image) {
        formData.append("image", form.image);
      }

      const res = await regularService({
        id,
        form: formData,
      }).unwrap();

      toast.success(res.msg);

      setForm({
        usedCalibration: "",
        action: "Done",
        comment: "",
        image: null,
      });

    } catch (error) {
      console.log(error);

      toast.error(
        error?.data?.msg || error.error
      );
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm mx-auto">
      {/* Service Selector */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-2.5 mb-2.5">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
          Service:
        </label>

        <select
          value={selectedService}
          onChange={(e) => {
            setSelectedService(Number(e.target.value));

            // reset form on service change
            setForm({
              usedCalibration: "",
              action: "Service Done",
              comment: "",
              image: null,
            });
          }}
          className="w-full border border-gray-300 bg-gray-50 rounded-md px-2 py-1.5 text-base font-medium outline-none focus:border-green-500"
        >
          {serviceData.map((service, index) => (
            <option key={index} value={index}>
              {service.serviceName ||
                `Service ${index + 1}`}
            </option>
          ))}
        </select>
      </div>

      {/* Form */}
      {currentService && (
        <form
          className="flex flex-col gap-3"
          onSubmit={handleSubmit}
        >
          {/* Service Info */}
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1.5 text-sm bg-gray-50 p-2 rounded-md border border-gray-200">
            <span className="text-gray-600">
              Scope:
              <strong className="text-gray-900 text-base font-semibold ml-1">
                {currentService?.scopeName || "N/A"}
              </strong>
            </span>

            <span className="text-gray-600">
              Consumable:
              <strong className="text-gray-900 text-base font-semibold ml-1">
                {currentService?.consumableName ||
                  "N/A"}
              </strong>
            </span>
          </div>

          {/* Calibration */}
          <div className="flex items-center justify-between border border-gray-200 bg-gray-50/50 px-3 py-2 rounded-md">
            <div className="flex items-center flex-col md:flex-row gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Calibration
              </span>

              <span className="text-sm text-gray-700 font-semibold bg-white px-2 py-0.5 border border-gray-300 rounded-md shadow-inner">
                Max:
                {" "}
                {currentService?.calibration ||
                  "N/A"}
              </span>
            </div>

            <div className="flex items-center flex-col md:flex-row gap-2">
              <label className="text-xs font-medium text-gray-600">
                Used:
              </label>

              <input
                type="text"
                value={form.usedCalibration}
                onChange={(e) =>
                  handleChange(
                    "usedCalibration",
                    e.target.value
                  )
                }
                placeholder="0ml"
                className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm text-center outline-none focus:border-green-500 bg-white"
              />
            </div>
          </div>

          {/* Action + Comment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-start">
            {/* Action */}
            <div className="flex flex-col gap-1 sm:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Action
              </label>

              <select
                value={form.action}
                onChange={(e) =>
                  handleChange("action", e.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs outline-none bg-white text-gray-800 font-medium focus:border-green-500"
              >
                <option value="Done">
                  Done
                </option>

                <option value="not Done">
                  Not Done
                </option>
                <option value="Partial Done">
                  Partial Done
                </option>
              </select>
            </div>

            {/* Comment */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Comment
              </label>

              <textarea
                rows={2}
                value={form.comment}
                onChange={(e) =>
                  handleChange("comment", e.target.value)
                }
                placeholder="Add service notes..."
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm outline-none focus:border-green-500 resize-none"
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200 mt-1">
            <label className="text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md px-2.5 py-1 cursor-pointer transition select-none flex items-center gap-1">
              Attach File
              <input
                type="file"
                className="hidden"
                onChange={(e) =>
                  handleChange(
                    "image",
                    e.target.files[0]
                  )
                }
              />
            </label>
            <div className="space-x-2">
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-1.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 active:scale-95 rounded-md shadow-sm transition-all uppercase tracking-wider disabled:opacity-50"
              >
                {isLoading
                  ? "Submitting..."
                  : "Submit"}
              </button>
              <button
                type="button"
                onClick={() => setRegular(false)}
                className="px-5 py-1.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-md shadow-sm transition-all uppercase tracking-wider disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default SingleServiceForm;