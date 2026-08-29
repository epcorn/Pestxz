import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useCasualServiceMutation, useRegularServiceMutation } from "../../redux/serviceSlice";
import { formatShortDate } from "../../utils/helperFunctions";
import Button from "../Button";
import { useDispatch, useSelector } from "react-redux";
import { toggleModal } from "../../redux/helperSlice";
import { useUnscheduledReportMutation } from "../../redux/locationSlice";
import { socket } from "../../socket";
import InputSelect from "../InputSelect";
import { Controller, useForm } from "react-hook-form";

const getStorageKey = (id, name) => `pestxz_saved_services_${id}_${name}`;

const todayShort = (d) => {
  // const d = new Date();
  const day = d.getDate().toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day}-${months[d.getMonth()]}`;
};

function RegularForm({ serviceData, id, type, locationName, setRegular, today }) {
  const { isModalOpen } = useSelector(store => store.helper);
  const dispatch = useDispatch();
  const [count, setCount] = useState({ type: "", count: 0 })
  const isRegular = type === "regular";
  const isUnschedule = type === "unscheduled";
  const [rerender, setRerender] = useState([]);

  const [regularService, { isLoading }] = useRegularServiceMutation();
  const [casualService, { isLoading: submitLoading }] = useCasualServiceMutation();
  const [updateUnscheduled, { isLoading: unScLoading }] = useUnscheduledReportMutation()

  const { register, reset, control, setValue, getValues, watch } = useForm({ defaultValues: { pestCount: 0 } });
  const STORAGE_KEY = getStorageKey(id, locationName);
  const todays = todayShort(today); //before today=


  const upComing = isRegular ? serviceData.map(s =>
    s.schedule.filter(sc => sc.status === "Pending") || []
  ) : [];

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
    ser?.scopes?.forEach((sc) => {
      result[sc.scopeId] = {};
      sc?.consumables?.forEach((con) => {
        result[sc?.scopeId][con.consumableId] =
          values?.[field]?.[ser.serviceName]?.[sc.scopeName]?.[con.consumableName] || "";
      });
    });
    return result;
  };

  const submitSingleService = async (ser, todaySchedule) => {
    try {
      saveLocally(ser.serviceName);
      const serviceDate =
        todaySchedule?.date ||
        ser?.serviceDate ||
        ser?.date ||
        (today ? new Date(today).toISOString() : new Date().toISOString());

      const values = getValues();
      const partialWithoutComment = [];
      ser?.scopes?.forEach((sc) => {
        sc?.consumables?.forEach((con) => {
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
      form.append(
        "service",
        JSON.stringify(isUnschedule ? ser : { ...ser, locationId: id })
      );
      form.append("usedCalibration", JSON.stringify(buildPayload("usedCalibration", ser, values)));
      form.append("action", JSON.stringify(buildPayload("action", ser, values)));
      form.append("comment", JSON.stringify(buildPayload("comment", ser, values)));
      form.append("serviceDate", serviceDate);
      if (isUnschedule) {
        form.append("type", "update");
        form.append("unscheduledId", id); // id prop IS the unscheduled doc's _id here
      }
      const rawCount = values?.pestCount?.[ser.serviceName];
      const countValue = typeof rawCount === "object" && rawCount !== null
        ? (rawCount.value ?? 0)
        : (rawCount ?? 0);

      // Append clean numeric value to FormData
      form.append("pestCount", countValue);

      const files = values?.image?.[ser.serviceName];
      if (files) {
        Array.from(files)?.slice(0, 2).forEach((file) => form.append("image", file));
      }
      console.log(form, [...form])
      const res = isUnschedule
        ? await updateUnscheduled(form).unwrap()
        : await (isRegular ? regularService : casualService)({ id, form }).unwrap();

      console.log(res)
      socket.emit("services", { ...res, url: `/location/${id}` })
      toast.success(res.msg || "Service Submitted 🎉");

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      ["usedCalibration", "action", "comment"]?.forEach((field) => {
        if (saved[field]?.[ser.serviceName]) delete saved[field][ser.serviceName];
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      setRerender((prev) => [...prev, res]);

      isRegular ? setRegular(false) : dispatch(toggleModal({ name: type, status: false }));
      reset();
    } catch (err) {
      console.log(err);
      toast.error("Submission failed");
    }
  };

  const pestOptions = Array.from({ length: 16 }).map((_, i) => ({ label: i, value: i }))

  const servicesForToday = isRegular ? serviceData?.filter((ser) =>
    ser?.schedule?.some((s) => formatShortDate(s.date) === todays && !s.completed && s.status === "Pending")) : serviceData;

  if (isRegular && !servicesForToday?.length) {
    const allDates = upComing?.map(u => u[0]?.date).filter(Boolean) || [];


    const uniqueDates = [...new Set(allDates)];

    return (
      <div className="w-full p-6 outline outline-gray-400 rounded-2xl text-center text-xl bg-gray-200 text-gray-500">
        <p>
          Next Schedule Date is
          {uniqueDates?.map((dateStr, i) => (
            <strong key={dateStr + i}> ({formatShortDate(dateStr)}) </strong>
          ))}
          .
        </p>
      </div>
    );
  }


  return (
    <div className={`${isRegular ? "" : "fixed inset-0 z-90 w-full h-dvh grid place-items-center bg-black/50"}`}>
      <div className={`w-full max-h-[80dvh] bg-gray-200 overflow-auto outline-4 outline-gray-800 rounded-lg ${isRegular ? "w-full" : "max-w-3xl"}`}>
        <div className="">
          <div className="flex sticky top-0 bg-white border-b-2 justify-between items-center z-1 p-3">
            <h2 className="text-lg md:text-xl font-bold">{isRegular ? "Regular Service Form" : isUnschedule ? "Unscheduled Service" : "Casual Service Form"}</h2>
            <p className="leading-none outline-2 text-red-600 rounded-full cursor-pointer w-6 h-6 text-center content-center font-bold " onClick={() => dispatch(toggleModal({ name: type, status: false }))}>X</p>
          </div>

          {serviceData.length === 0 ? <div className="text-center font-semibold my-5 bg-gray-200 ">No Services Found on Location</div> : <form className="space-y-6 bg-green-200">
            {servicesForToday?.map((ser, i) => {
              const todaySchedule = isRegular ? ser.schedule?.find(
                (s) => formatShortDate(s.date) === todays && s.status === "Pending" && !s.completed) : null;
              return (
                <div
                  key={i}
                  className="outline outline-gray-400 rounded p-2 bg-white/70 shadow text-xs md:textbase"
                >
                  <div className="flex justify-between mb-4">
                    <div className="flex gap-x-4 gap-y-2 items-center flex-wrap">
                      <p className="text-sm md:text-lg bg-white font-semibold outline px-2 py-1 rounded outline-gray-400">
                        <span className="outline px-1.5 leading-none rounded-full text-gray-700 font-semibold mr-2 text-sm">{i + 1}</span> Service:{" "}
                        <span className="text-base text-gray-500">{ser.serviceName}</span>
                      </p>
                      {(isRegular) &&
                        <>
                          <p className="text-sm md:text-lg bg-white font-semibold outline px-2 py-1 rounded outline-gray-400">
                            Frequency:{" "}
                            <span className="text-base text-gray-500">{ser.frequency}</span>
                          </p>
                          <p className="text-sm md:text-lg bg-white font-semibold outline px-2 py-1 rounded outline-gray-400">
                            Date:{" "}
                            <span className="text-base text-blue-600">{todaySchedule?.date.split("T")[0]}</span>
                          </p>
                        </>
                      }
                    </div>
                  </div>
                  <div className="flex justify-center gap-5 items-center">
                    <div className="flex flex-col gap-1">
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
                    </div>
                    <div>
                      <Controller
                        name={`pestCount.${ser.serviceName}`}
                        control={control}
                        defaultValue={0}
                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                          <div className="max-w-32">
                            <InputSelect
                              label="Pest Count"
                              options={pestOptions}
                              value={value}
                              onChange={onChange} // Pass down React Hook Form's handler
                              required={true}
                            />
                            {error && (
                              <span className="text-red-500 text-sm mt-1 block">
                                {error.message}
                              </span>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2 text-lg">
                    {ser?.scopes?.map((sc) => (
                      <div
                        key={sc.scopeName}
                        className="mt-2 outline-4 outline-gray-400 rounded bg-white p-1"
                      >
                        <h4 className="font-bold mb-3 px-3 underline ">Scope: {sc.scopeName}</h4>
                        {sc?.consumables?.map((con, i) => {
                          const actionVal = watchAction?.action?.[ser.serviceName]?.[sc.scopeName]?.[con.consumableName];

                          return (
                            <div
                              key={con.consumableName}
                              className=" mb-2 grid grid-cols-5 gap-x-3 p-1 gap-y-1 outline-2"
                            >
                              <input
                                defaultValue={con.consumableName}
                                disabled
                                className="outline outline-gray-700 px-2 bg-gray-100 col-span-5 font-bold"
                              />
                              <input
                                defaultValue={con.calibration || 0}
                                disabled
                                className="max-w-20 outline-2 outline-gray-400 px-2 bg-gray-100"
                              />
                              <input
                                placeholder="Used"
                                {...register(`usedCalibration.${ser.serviceName}.${sc.scopeName}.${con.consumableName}`)}
                                className="max-w-20 outline-2 px-2 focus:outline-2 focus:outline-gray-800"
                              />
                              <select
                                {...register(`action.${ser.serviceName}.${sc.scopeName}.${con.consumableName}`)}
                                className="outline-2 outline-gray-900 px-2 focus:outline-2 focus:outline-gray-800"
                              >
                                <option>Done</option>
                                <option>Not Done</option>
                                <option>Partial Done</option>
                              </select>
                              <textarea
                                rows={1}
                                placeholder={actionVal === "Partial Done" ? "Comment Required..." : "comment..."}
                                {...register(`comment.${ser.serviceName}.${sc.scopeName}.${con.consumableName}`)}
                                className={`flex-1 outline-2 px-2 focus:outline-2 col-span-2 focus:outline-gray-800 ${actionVal === "Partial Done"
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
                    {!isRegular &&
                      <Button color={'bg-red-400'} label={'Close'} onClick={() => dispatch(toggleModal({ name: type, status: false }))} />
                    }<button
                      type="button"
                      disabled={isRegular ? isLoading : submitLoading}
                      onClick={() => submitSingleService(ser, todaySchedule)}
                      className="bg-green-600 px-5 py-2 text-white rounded disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {(isRegular ? isLoading : submitLoading) ? "Submitting..." : "Complete Service"}
                    </button>
                  </div>
                </div>
              );
            })}
          </form>}
        </div>
      </div>
    </div>
  );
}

export default RegularForm;