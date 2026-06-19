import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useRegularServiceMutation } from "../../redux/serviceSlice";
import { formatShortDate } from "../../utils/helperFunctions";

const getStorageKey = (id, name) => `pestxz_saved_services_${id}_${name}`;

const todayShort = () => {
  const d = new Date();
  const day = d.getDate().toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day}-${months[d.getMonth()]}`;
};

function RegularForm({ serviceData, id, locationName, setRegular }) {
  const [rerender, setRerender] = useState([])
  const [regularService, { isLoading }] = useRegularServiceMutation();
  const { register, reset, setValue, getValues, watch } = useForm();
  const STORAGE_KEY = getStorageKey(id, locationName);
  const today = todayShort();

  const upComing = serviceData.map(s =>
    s.schedule.filter(sc => sc.status === "Pending")
  );

  console.log(upComing)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      Object.entries(parsed).forEach(([key, value]) => setValue(key, value));
    } catch (err) {
      console.log(err);
    }
  }, [setValue, STORAGE_KEY]);

  const watchAction = watch();

  useEffect(() => { }, [rerender])

  const saveLocally = (serviceName) => {
    const values = getValues();
    let existing = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    ["usedCalibration", "action", "comment"].forEach((field) => {
      existing[field] = {
        ...existing[field],
        [serviceName]: values?.[field]?.[serviceName] || {},
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    toast.success("Progress Saved 🚀");
  };

  const buildPayload = (field, ser, values) => {
    const result = {};
    ser.scopes?.forEach((sc) => {
      result[sc.scopeId] = {};
      sc.consumables?.forEach((con) => {
        result[sc.scopeId][con.consumableId] =
          values?.[field]?.[ser.serviceName]?.[sc.scopeName]?.[con.consumableName] || "";
      });
    });
    return result;
  };

  const submitSingleService = async (ser, todaySchedule) => {
    try {
      saveLocally(ser.serviceName);
      console.log(ser.serviceName)
      const values = getValues();
      const partialWithoutComment = [];
      ser.scopes?.forEach((sc) => {
        sc.consumables?.forEach((con) => {
          const action = values?.action?.[ser.serviceName]?.[sc.scopeName]?.[con.consumableName];
          const comment = values?.comment?.[ser.serviceName]?.[sc.scopeName]?.[con.consumableName];
          if (action === "Partial Done" && !comment?.trim()) {
            partialWithoutComment.push(`${sc.scopeName} → ${con.consumableName}`);
          }
        });
      });
      if (partialWithoutComment.length > 0) {
        toast.error(`Comment required for Partial Done:\n${partialWithoutComment.join(", ")}`);
        return;
      }
      const form = new FormData();

      form.append("service", JSON.stringify({ ...ser, locationId: id }));
      form.append("usedCalibration", JSON.stringify(buildPayload("usedCalibration", ser, values)));
      form.append("action", JSON.stringify(buildPayload("action", ser, values)));
      form.append("comment", JSON.stringify(buildPayload("comment", ser, values)));
      form.append("serviceDate", todaySchedule.date);

      const files = values?.image?.[ser.serviceName];

      if (files) {
        Array.from(files).slice(0, 2).forEach((file) => form.append("image", file));
      }

      const res = await regularService({ id, form }).unwrap();
      toast.success(res.msg || "Service Submitted 🎉");

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      ["usedCalibration", "action", "comment"].forEach((field) => {
        if (saved[field]?.[ser.serviceName]) delete saved[field][ser.serviceName];
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      setRegular(false);
      setRerender(prev => [...prev, res])
      reset();
    } catch (err) {
      console.log(err);
      toast.error("Submission failed");
    }
  };

  // only services that have today as a pending schedule date
  const servicesForToday = serviceData?.filter((ser) =>
    ser.schedule?.some((s) => formatShortDate(s.date) === today && !s.completed)
  );

  if (!servicesForToday?.length) {
    return (
      <div className="w-full p-6 outline outline-gray-400 rounded-2xl text-center text-xl text-gray-500">
        <p>
          {/* No services scheduled for today ({today}) */}
          Next Schedule Date is
          {upComing?.map(u => (
            <strong key={u[0].date}> ({formatShortDate(u[0].date)}) </strong>
          ))}
          .</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto outline outline-gray-400 rounded-2xl">
      <div className="">
        <div className="flex justify-between items-center p-3">
          <h2 className="text-lg md:text-xl font-bold">Regular Service Form</h2>
        </div>

        <form className="space-y-6">
          {servicesForToday?.map((ser) => {
            const todaySchedule = ser.schedule.find(
              (s) => formatShortDate(s.date) === today && !s.completed
            );
            return (
              <div
                key={ser.serviceName}
                className="outline outline-gray-400 rounded p-2 bg-white shadow text-xs md:textbase"

              >
                <div className="flex justify-between mb-4">
                  <div className="flex gap-x-4 gap-y-2 items-center flex-wrap">
                    <p className="text-sm md:text-lg font-semibold outline px-2 py-1 rounded outline-gray-400">
                      Service:{" "}
                      <span className="text-base text-gray-500">{ser.serviceName}</span>
                    </p>
                    <p className="text-sm md:text-lg font-semibold outline px-2 py-1 rounded outline-gray-400">
                      Frequency:{" "}
                      <span className="text-base text-gray-500">{ser.frequency}</span>
                    </p>
                    <p className="text-sm md:text-lg font-semibold outline px-2 py-1 rounded outline-gray-400">
                      Date:{" "}
                      <span className="text-base text-blue-600">{todaySchedule?.date}</span>
                    </p>
                  </div>
                </div>
                <label htmlFor="" className="text-sm font-semibold mr-2">Images:</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  {...register(`image.${ser.serviceName}`, {
                    validate: (files) =>
                      !files || files.length <= 2 || "Max 2 images allowed",
                  })}
                  className="outline file:bg-gray-700 file:p-2 file:text-white flex-1"
                />
                <div className="grid gap-2 text-lg">
                  {ser.scopes?.map((sc) => (
                    <div
                      key={sc.scopeName}
                      className="mt-2 outline outline-gray-400 p-3 rounded "
                    >
                      <h4 className="font-bold mb-3 ">Scope: {sc.scopeName}</h4>
                      {sc.consumables?.map((con) => {
                        const actionVal = watchAction?.action?.[ser.serviceName]?.[sc.scopeName]?.[con.consumableName];

                        return (
                          <div
                            key={con.consumableName}
                            className=" mb-2 flex flex-wrap gap-3"
                          >
                            <input
                              defaultValue={con.consumableName}
                              disabled
                              className="flex-1 outline outline-gray-400 p-2 bg-gray-100 col-span-2 font-bold"
                            />
                            <input
                              defaultValue={con.calibration || 0}
                              disabled
                              className="max-w-20 outline outline-gray-400 p-2 bg-gray-100"
                            />
                            <input
                              placeholder="Used"
                              {...register(`usedCalibration.${ser.serviceName}.${sc.scopeName}.${con.consumableName}`)}
                              className="max-w-20 outline outline-gray-400 p-2 focus:outline-2 focus:outline-gray-800"
                            />
                            <select
                              {...register(`action.${ser.serviceName}.${sc.scopeName}.${con.consumableName}`)}
                              className="outline outline-gray-400 p-2 focus:outline-2 focus:outline-gray-800"
                            >
                              <option>Done</option>
                              <option>Not Done</option>
                              <option>Partial Done</option>
                            </select>
                            <textarea
                              rows={1}
                              placeholder={actionVal === "Partial Done" ? "Comment Required..." : "comment..."}
                              {...register(`comment.${ser.serviceName}.${sc.scopeName}.${con.consumableName}`)}
                              className={`flex-1 outline p-2 focus:outline-2 focus:outline-gray-800 ${actionVal === "Partial Done"
                                ? "outline-orange-400 bg-orange-50"
                                : "outline-gray-400"
                                }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="text-right mt-5 space-x-3">
                  <button
                    type="button"
                    onClick={() => saveLocally(ser.serviceName)}
                    className="px-3 py-2 hidden border rounded"
                  >
                    Save Progress
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => submitSingleService(ser, todaySchedule)}
                    className="bg-green-600 px-5 py-2 text-white rounded disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {isLoading ? "Submitting..." : "Complete Service"}
                  </button>
                </div>
              </div>
            );
          })}
        </form>
      </div>
    </div>
  );
}

export default RegularForm;