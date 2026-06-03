import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { MdAddCircle } from "react-icons/md";
import { toast } from "react-toastify";
import {
  useRegisterClientMutation,
  useUpdateClientMutation,
} from "../../redux/clientSlice";
import { Button, InputRow, InputSelect } from "..";
import { toggleModal } from "../../redux/helperSlice";
import FormModal from "./FormModal";
import { endDateList, timeList } from "../../utils/constData";

const calculateEndDate = (startDate, months) => {
  if (!startDate || !months) return "";
  const date = new Date(startDate);
  const totalMonths = parseInt(months, 10);

  const computeEndDate = new Date(date.getFullYear(), date.getMonth() + totalMonths , 0);

  return computeEndDate.toLocaleDateString("en-CA"); // yyyy-mm-dd
};

const NewClient = ({ update = false, id, clientDetails }) => {
  const { isModalOpen } = useSelector((store) => store.helper);
  const dispatch = useDispatch();

  const [addClient, { isLoading: addLoading }] = useRegisterClientMutation();
  const [updateClient, { isLoading: updateLoading }] = useUpdateClientMutation();

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      name: "",
      address: "",
      contractNo: "",
      email: "",
      phone: "",
      startDate: "",
      servicePeriod: "",
      endDate: "",

      adminName: "",
      adminPass: "",
    },
  });

  const startDate = watch("startDate");
  const servicePeriod = watch("servicePeriod");
  const endDate = calculateEndDate(startDate, servicePeriod);

  console.log(servicePeriod)
  useEffect(() => {
    if (clientDetails) {
      reset({
        name: clientDetails.name || "",
        address: clientDetails.address || "",
        contractNo: clientDetails.contractNo || "",
        email: clientDetails.email || "",
        phone: clientDetails.phone || "",
        startDate: clientDetails.startDate || "",
        servicePeriod: clientDetails.servicePeriod || "",
        adminName: clientDetails.adminName || "",
        adminPass: "",
      });
    }
  }, [clientDetails, reset]);

  const submit = async (data) => {
    try {
      const payload = { ...data, endDate };
      let res;
      if (update) {
        res = await updateClient({ id, data: payload }).unwrap();
      } else {
        res = await addClient(payload).unwrap();
      }
      toast.success(res.msg);
      reset();
      dispatch(toggleModal({ name: "newClient", status: false }));
    } catch (error) {
      toast.error(error?.data?.msg || error.error);
    }
  };

  const today = new Date().toLocaleDateString("en-CA");

  const formBody = (
    <div className="grid grid-cols-2 gap-x-3 pb-5">

      {/* Row 1 — Name, Phone, Contract */}
      <div className="col-span-2">
        <InputRow label="Client Name" id="name" errors={errors} register={register} />
      </div>

      <div>
        <InputRow label="Client Phone" id="phone" errors={errors} register={register} type="tel" />
      </div>

      <div>
        <InputRow label="Contract No" disabled={clientDetails} id="contractNo" errors={errors} register={register} />
      </div>

      {/* Row 2 — Address, Email */}
      <div className="col-span-2">
        <InputRow label="Client Address" id="address" errors={errors} register={register} />
      </div>

      <div className="col-span-2">
        <InputRow label="Client Email" id="email" errors={errors} register={register} type="email" />
      </div>

      {/* Row 3 — Admin */}
      <div>
        <InputRow label="Admin Name" id="adminName" disabled={clientDetails} errors={errors} register={register} required={false} />
      </div>

      <div>
        <InputRow label="Admin Password" id="adminPass" disabled={clientDetails} errors={errors} register={register} type="password" required={false} />
      </div>

      {/* Row 4 — Dates */}
      <div>
        <InputRow label="Start Date" id="startDate" errors={errors} register={register} type="date" min={update ? undefined : today} required={true} disabled={update} />
      </div>

      <div className="flex flex-col">
        <label className="text-gray-800 mt-2 font-semibold ">
          Service Period<span className="text-red-600">*</span>
        </label>
        <select required
          id="servicePeriod"
          disabled={clientDetails}
          className="border-2 border-gray-300 rounded px-1.5 py-1 text-sm outline-none focus:border-indigo-500 disabled:bg-blue-50"
          {...register("servicePeriod", { required: true })}
        >
          <option value=""> -- Select -- </option>
          {endDateList?.map((end) => (
            <option key={end.value} value={end.value}>
              {end.label}
            </option>
          ))}
        </select>
        {errors.servicePeriod && (
          <p className="text-xs text-red-500 mt-0.5">Service period is required</p>
        )}
      </div>

      <div className="col-span-2 mt-2 flex flex-col">
        <label className="text-gray-800 font-semibold text-sm">Contract End Date</label>
        <input
          type="text"
          readOnly
          value={endDate || "Select start date and service period"}
          className="mt-0.5 border-2 border-gray-200 bg-gray-50 rounded px-2 py-1 text-sm text-gray-600 cursor-default"
        />
      </div>

      <InputRow
        label="Preferred Day"
        id="prefDay"
        errors={errors}
        register={register}
        required={false}
        disabled={clientDetails}
      />

      <InputSelect
        label="Preferred Time"
        value={watch("prefTime") ? { label: watch("prefTime"), value: watch("prefTime") } : null}
        onChange={(val) => setValue("prefTime", val?.value || "")}
        options={timeList}
        required={false}
        isClearable
      />
    </div>
  );

  return (
    <div>
      {!update && (
        <Button
          height="h-10"
          color="bg-green-600"
          label={
            <div className="flex items-center">
              <MdAddCircle className="w-6 h-6 pr-1" />
              New Client
            </div>
          }
          onClick={() => dispatch(toggleModal({ name: "newClient", status: true }))}
        />
      )}

      <FormModal
        onSubmit={handleSubmit(submit)}
        title={update ? "Update Client" : "New Client"}
        formBody={formBody}
        submitLabel={update ? "Update Client" : "Add Client"}
        handleClose={() => dispatch(toggleModal({ name: "newClient", status: false }))}
        disabled={addLoading || updateLoading}
        isLoading={addLoading || updateLoading}
        open={isModalOpen.newClient}
      />
    </div>
  );
};

export default NewClient;