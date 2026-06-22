import { useDebugValue, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { InputRow, InputSelect } from "..";
import {
  useChangePasswordMutation,
  useRegisterUserMutation,
} from "../../redux/adminSlice";
import { useAllClientsQuery } from "../../redux/clientSlice";
import { toggleModal } from "../../redux/helperSlice";
import FormModal from "./FormModal";
import { clientRoles, pestRoles } from "../../utils/constData";
import InputCheck from "../InputCheck";

const UserModal = ({ userDetails }) => {
  const [clients, setClients] = useState([]);
  const dispatch = useDispatch();
  const { isModalOpen, user } = useSelector((store) => store.helper);
  const [addUser, { isLoading: addLoading }] = useRegisterUserMutation();
  const [changePassword, { isLoading: updateLoading }] = useChangePasswordMutation();
  const { data: rawClients } = useAllClientsQuery();

  console.log(userDetails)
  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "",
      type: "PestEmployee",
      department: "",
      client: null,
      rights: {
        raise: false,
        close: false,
        scan_Scheduled: false,
        scan_Unscheduled: false,
        delete: false,
        addData: false,
      },
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    if (rawClients) {
      const formattedClients = rawClients?.map((item) => ({
        label: item.name,
        value: item._id,
      }));
      setClients(formattedClients);
    }
  }, [rawClients]);

  useEffect(() => {
    if (userDetails) return;
    setValue("role", "");
    setValue("client", null);
  }, [selectedType]);

  useEffect(() => {
    if (userDetails) {
      reset({
        name: userDetails.name || "",
        email: userDetails.email || "",
        password: "",
        phone: userDetails?.phone || "",
        role: userDetails?.role || "",
        type: userDetails?.type || "PestEmployee",
        department: userDetails?.department || "",
        client: userDetails.client || null,
        rights: {
          raise: userDetails?.rights?.raise ?? false,
          close: userDetails?.rights?.close ?? false,
          scan_Scheduled: userDetails?.rights?.scan_Scheduled ?? false,
          scan_Unscheduled: userDetails?.rights?.scan_Unscheduled ?? false,
          delete: userDetails?.rights?.delete ?? false,
          addData: userDetails?.rights?.addData ?? false,
        },
      });
    } else {
      reset({
        name: "",
        email: "",
        password: "",
        role: "",
        phone: "",
        type: "PestEmployee",
        department: "",
        client: null,
        rights: {
          raise: false,
          close: false,
          scan_Scheduled: false,
          scan_Unscheduled: false,
          delete: false,
          addData: false,
        },
      });
    }
  }, [userDetails, reset]);

  const activeRoleOptions =
    selectedType === "PestEmployee"
      ? userDetails?.role === "Admin"
        ? [{ label: "Admin", value: "Admin" }, ...pestRoles]
        : pestRoles
      : clientRoles;

  const submit = async (formData) => {
    const payload = {
      ...formData,
      rights: {
        raise: !!formData.rights?.raise,
        close: !!formData.rights?.close,
        scan_Scheduled: !!formData.rights?.scan_Scheduled,
        scan_Unscheduled: !!formData.rights?.scan_Unscheduled,
        delete: !!formData.rights?.delete,
        addData: !!formData.rights?.addData,
      },
      client:
        selectedType === "ClientEmployee"
          ? formData.client?.value
          : user?._id,
    };

    try {
      let res;
      if (userDetails) {
        res = await changePassword({
          id: userDetails._id,
          data: payload,
        }).unwrap();
      } else {
        res = await addUser(payload).unwrap();
      }

      toast.success(res?.msg || "Success");
      reset();
      dispatch(toggleModal({ name: "user", status: false }));
    } catch (error) {
      toast.error(error?.data?.msg || "Error");
    }
  };

  const formBody = (
    <div className="grid gap-y-1 mb-4 w-sm">
      {/* Type Radio Controls */}
      <div className="grid grid-cols-2 text-sm mt-1 py-1 border-b border-gray-100 transition-all">
        <div className="flex items-center gap-2">
          <input
            type="radio"
            id="PestEmployee"
            value="PestEmployee"
            disabled={!!userDetails}
            {...register("type")}
          />
          <label htmlFor="PestEmployee" className="font-medium text-gray-700 cursor-pointer">Pest Employee</label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="radio"
            id="ClientEmployee"
            value="ClientEmployee"
            disabled={!!userDetails}
            {...register("type")}
          />
          <label htmlFor="ClientEmployee" className="font-medium text-gray-700 cursor-pointer">Client Employee</label>
        </div>
      </div>
      {/* Client Selection Custom Dropdown Wrapper */}
      {selectedType === "ClientEmployee" && (
        <div>
          <Controller
            name="client"
            control={control}
            rules={{ required: "Client selection is required" }}
            render={({ field: { onChange, value } }) => (
              <InputSelect
                options={clients}
                onChange={onChange}
                disable={!!userDetails}
                value={value}
                label="Client Name"
                placeholder="Select Client Account"
              />
            )}
          />
          <p className="text-xs text-red-500 pl-1 mt-0.5">
            {errors.client && "Client selection is required"}
          </p>
        </div>
      )}
      {/* Full Name Input */}
      <div>
        <InputRow
          label="Full Name"
          id="name"
          errors={errors}
          register={register}
          disabled={addLoading || userDetails}
        />
        <p className="text-xs text-red-500 pl-1 mt-1">
          {errors.name && "Name is required"}
        </p>
      </div>

      <div>
        <InputRow
          label="Phone Number"
          id="phone"
          errors={errors}
          register={register}
          disabled={addLoading}
        />
        <p className="text-xs text-red-500 pl-1 mt-1">
          {errors.phone && "Phone is required"}
        </p>
      </div>

      {/* Select Role Dropdown */}
      <div className="flex items-end gap-2">

        <div className="flex-1 flex flex-col">
          <label htmlFor="role" className="font-semibold text-gray-700">
            Select Role<span className="text-red-500 ml-0.5">*</span>
          </label>
          <select
            id="role"
            disabled={!!userDetails}
            className="w-full px-1.5 py-1 border outline-none rounded border-gray-400 text-sm bg-white focus:border-black transition"
            {...register("role", { required: "Role field is required" })}
          >
            <option value="">--Select--</option>
            {activeRoleOptions?.map((r, i) => (
              <option key={i} value={r.value}>{r.label}</option>
            ))}
          </select>
          <p className="text-xs text-red-500 pl-1 mt-0.5">
            {errors.role?.message}
          </p>
        </div>

        {/* Department Input */}
        {selectedType === "ClientEmployee" &&
          <div>
            <InputRow
              label="Department"
              id="department"
              register={register}
              required={false}
              disabled={addLoading || userDetails}
            />
          </div>
        }
      </div>
      {/* Email Address */}
      <div>
        <InputRow
          label="Email"
          id="email"
          errors={errors}
          register={register}
          disabled={addLoading || userDetails}
          type="email"
          cls="mt-0"
        />
        <p className="text-xs text-red-500 pl-1 mt-1">
          {errors.email && "Email is required"}
        </p>
      </div>
      {/* Password Field */}
      <div>
        <InputRow
          label="Password"
          id="password"
          placeholder={'*****'}
          errors={errors}
          register={register}
          disabled={addLoading}
          required={!userDetails}
          cls="mt-0"
        />
        <p className="text-xs text-red-500 pl-1 mt-1">
          {errors.password && "Password field is required"}
        </p>
      </div>
      <div>
        <Controller
          name="rights"
          control={control}
          defaultValue={{
            raise: false,
            close: false,
            scan_Scheduled: false,
            scan_Unscheduled: false,
            delete: false,
            addData: false,
          }}
          render={({ field }) => (
            <InputCheck
              selectedType={selectedType}
              value={field.value || {}}
              onChange={field.onChange}
              required={true}
            />
          )}
        />
      </div>

    </div>
  );
  return (
    <FormModal
      onSubmit={handleSubmit(submit)}
      title={`${userDetails ? "Update" : "Add"} Employee`}
      formBody={formBody}
      submitLabel={userDetails ? "Update User" : "Add"}
      handleClose={() => dispatch(toggleModal({ name: "user", status: false }))}
      disabled={addLoading || updateLoading}
      isLoading={addLoading || updateLoading}
      open={isModalOpen?.user}
    />
  );
};

export default UserModal;
