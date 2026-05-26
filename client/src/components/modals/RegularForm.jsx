import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useRegularServiceMutation } from "../../redux/serviceSlice";

const STORAGE_KEY = "pestxz_saved_services";

function RegularForm({ serviceData, id }) {
  const [regularService, { isLoading }] = useRegularServiceMutation();

  const { register, handleSubmit, reset, getValues, setValue } = useForm();

  // LOAD LOCAL DATA
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        Object.keys(parsed).forEach((key) => {
          setValue(key, parsed[key]);
        });
      } catch (e) {
        console.error("Error parsing saved form data", e);
      }
    }
  }, [setValue]);

  // SAVE SINGLE SERVICE LOCALLY
  const handleSaveToLocal = (serviceId) => {
    const currentValues = getValues();
    const savedData = localStorage.getItem(STORAGE_KEY);
    let masterPayload = savedData ? JSON.parse(savedData) : {};

    masterPayload.usedCalibration = {
      ...masterPayload.usedCalibration,
      [serviceId]: currentValues.usedCalibration?.[serviceId] || {},
    };

    masterPayload.action = {
      ...masterPayload.action,
      [serviceId]: currentValues.action?.[serviceId] || {},
    };

    masterPayload.comment = {
      ...masterPayload.comment,
      [serviceId]: currentValues.comment?.[serviceId] || {},
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(masterPayload));
    toast.info("Progress saved locally for this service.");
  };

  // FINAL SUBMIT
  const handleFinalSubmit = async (data) => {
    try {
      const form = new FormData();

      const usedCalibration = flattenByRemovingServiceId(data.usedCalibration);
      const action = flattenByRemovingServiceId(data.action);
      const comment = flattenByRemovingServiceId(data.comment);

      form.append(
        "service",
        JSON.stringify({
          ...serviceData,
          locationId: id,
        })
      );

      form.append("usedCalibration", JSON.stringify(usedCalibration));
      form.append("action", JSON.stringify(action));
      form.append("comment", JSON.stringify(comment));

      serviceData.forEach((ser) => {
        const file = data.image?.[ser.serviceId]?.[0];
        if (file) form.append("image", file);
      });

      const res = await regularService({ id, form }).unwrap();

      toast.success(res.msg || "Submitted successfully");

      localStorage.removeItem(STORAGE_KEY);
      reset();
    } catch (err) {
      console.error(err);
      toast.error("Submission failed");
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-6xl p-4">
        <div className="flex justify-around items-center mb-6">
          <h3 className="text-center text-2xl font-semibold my-3">
            Regular Service Form
          </h3>
          <button
            type="button"
            className="bg-red-600 outline px-3 py-1 text-white rounded-lg"
          >
            close
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFinalSubmit)} className="grid gap-6">
          {serviceData.map((ser) => (
            <div
              key={ser.serviceId}
              className="flex flex-col md:flex-row gap-4 border border-gray-300 rounded-md p-3 bg-white odd:bg-gray-50 even:bg-gray-100"
            >
              {/* LEFT */}
              <div className="min-w-52 flex flex-col justify-between">
                <div className="grid gap-1">
                  <strong className="text-sm">Service Name</strong>
                  <span className="border px-2 py-2 rounded bg-gray-200 text-sm font-medium">
                    {ser.serviceName}
                  </span>

                  <div className="mt-2">
                    <strong className="text-xs block mb-1">Frequency</strong>
                    <input
                      type="text"
                      value={ser.frequency}
                      disabled
                      className="border rounded px-2 py-1 w-full bg-gray-200 text-sm"
                    />
                  </div>

                  <div className="mt-3">
                    <strong className="text-xs block mb-1">Upload Image</strong>
                    <input
                      type="file"
                      {...register(`image.${ser.serviceId}`)}
                      className="text-sm w-full outline py-2 px-1 rounded bg-white outline-gray-300"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveToLocal(ser.serviceId)}
                  className="w-full mt-4 border border-blue-400 px-4 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-semibold"
                >
                  Save Progress Locally
                </button>
              </div>

              {/* RIGHT */}
              <div className="flex-1 grid gap-3">
                {ser.scopes.map((sc) => (
                  <div
                    key={sc.scopeId}
                    className="border rounded-md p-2 md:p-3 bg-white shadow-sm"
                  >
                    <div className="mb-3">
                      <strong className="block text-sm mb-1">Scope</strong>
                      <input
                        type="text"
                        value={sc.scopeName}
                        disabled
                        className="border rounded px-2 py-1 w-full bg-gray-50"
                      />
                    </div>

                    <div className="grid gap-2">
                      {sc.consumables.map((con) => (
                        <div
                          key={con.consumableId}
                          className="grid grid-cols-1 sm:grid-cols-5 gap-2 border rounded p-2 bg-gray-50"
                        >
                          <div>
                            <strong className="text-xs">Consumable</strong>
                            <input
                              value={con.consumableName}
                              disabled
                              className="border px-2 py-1 w-full bg-gray-100 text-sm"
                            />
                          </div>

                          <div>
                            <strong className="text-xs">Calibration</strong>
                            <input
                              value={con.calibration}
                              disabled
                              className="border px-2 py-1 w-full bg-gray-100 text-sm"
                            />
                          </div>

                          <div>
                            <strong className="text-xs">Used</strong>
                            <input
                              {...register(
                                `usedCalibration.${ser.serviceId}.${sc.scopeId}.${con.consumableId}`
                              )}
                              className="border px-2 py-1 w-full text-sm"
                            />
                          </div>

                          <div>
                            <strong className="text-xs">Status</strong>
                            <select
                              {...register(
                                `action.${ser.serviceId}.${sc.scopeId}.${con.consumableId}`
                              )}
                              className="border px-2 py-1 w-full text-sm"
                            >
                              <option value="Done">Done</option>
                              <option value="Not Done">Not Done</option>
                              <option value="Partial Done">Partial Done</option>
                            </select>
                          </div>

                          <div>
                            <strong className="text-xs">Comment</strong>
                            <textarea
                              rows={1}
                              {...register(
                                `comment.${ser.serviceId}.${sc.scopeId}.${con.consumableId}`
                              )}
                              className="border px-2 py-1 w-full text-sm resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50"
            >
              {isLoading ? "Submitting Form..." : "Submit Form"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegularForm;