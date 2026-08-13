import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { InputRow, InputSelect } from "..";
import { toggleModal } from "../../redux/helperSlice";
import { useAllLocationsQuery, useGetComplaintLocationQuery } from "../../redux/locationSlice";
import {
  useNewComplaintMutation,
  useUpdateComplaintMutation,
} from "../../redux/serviceSlice";
import {
  clientAdminStatus,
  jobStatus,
  operatorComment,
} from "../../utils/constData";
import FormModal from "./FormModal";
import { socket } from "../../socket";
import { useAllClientsQuery } from "../../redux/clientSlice";
import { useGetSingleUserQuery } from "../../redux/userSlice";

const ComplaintModal = ({ locationId, mode = "create" }) => {
  const isCreate = mode === "create";
  const isUpdate = mode === "update";
  const isReview = mode === "review";

  const [images, setImages] = useState([]);
  const [floor, setFloor] = useState("");

  const dispatch = useDispatch();
  const { isModalOpen, user } = useSelector((store) => store.helper);
  const isPestEmployee = user.type === "PestEmployee";

  const { data: DBUser } = useGetSingleUserQuery(user._id, {
    skip: !user._id,
  });

  // Client picker only applies to PestEmployee creating a fresh complaint.
  const { data: clientsData } = useAllClientsQuery(
    { limit: 100, page: 1 },
    { skip: !isPestEmployee || !isCreate },
  );
  const clientOptions = clientsData?.clients?.map((c) => ({
    label: c.name,
    value: c._id,
  }));

  const [addComplaint, { isLoading: addLoading }] = useNewComplaintMutation();
  const [updateComplaint, { isLoading: updateLoading }] =
    useUpdateComplaintMutation();

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
  } = useForm({
    defaultValues: { location: null, service: [], comment: "", status: null },
  });

  const selectedLocation = watch("location");
  const watchedClient = watch("client");
  const status = watch("status");

  // Single source of truth for which client's locations to load:
  // - PestEmployee: whichever client they picked in the form
  // - everyone else: their own client
  // - update/review: skip client resolution entirely, locationId already scopes it
  const clientId = isPestEmployee ? watchedClient?.value : user?.client;
  const locationQueryId = locationId || clientId;

  const { data: clientLocations } = useGetComplaintLocationQuery(
    locationQueryId,
    { skip: !locationQueryId },
  );

  const floors = clientLocations?.floors || [];
  const locationRecords = clientLocations?.locations || [];

  // Default to the first available floor once loaded
  useEffect(() => {
    if (!floor && floors.length) setFloor(floors[0]);
  }, [floors, floor]);

  // Opened for a specific location (update/review) -> preselect it,
  // otherwise clear location/service whenever the floor changes manually.
  useEffect(() => {
    if (!locationId) {
      setValue("location", null);
      setValue("service", []);
      return;
    }
    const match = locationRecords.find(
      (loc) => loc._id?.toString() === locationId.toString(),
    );
    if (!match) return;
    setFloor(match.floor);
    setValue("location", {
      label: `${match.location}${match.subLocation ? `, ${match.subLocation}` : ""}`,
      value: match._id,
    });
  }, [floor, locationId, locationRecords, setValue]);

  const locationOptions = useMemo(
    () =>
      locationRecords
        .filter((loc) => !floor || loc.floor === floor)
        .map((loc) => ({
          label: `${loc.location}${loc.subLocation ? `, ${loc.subLocation}` : ""}`,
          value: loc._id,
        })),
    [locationRecords, floor],
  );

  const selectedLocationId = selectedLocation?.value || locationId;
  const selectedLocationRecord = locationRecords.find(
    (loc) => loc._id?.toString() === selectedLocationId?.toString(),
  );

  const serviceOptions = useMemo(() => {
    const raw = selectedLocationRecord?.service || [];
    return raw
      .map((s) =>
        typeof s === "string"
          ? s.trim().replace(/,$/, "")
          : (s.serviceName || s.service || s.name || "").trim().replace(/,$/, ""),
      )
      .filter(Boolean);
  }, [selectedLocationRecord]);

  const submit = async (data) => {
    if (images.length > 2) {
      toast.error("Maximum 2 images are allowed");
      return;
    }

    const form = new FormData();
    images.forEach((image) => form.append("images", image));

    try {
      let res;

      if (isCreate) {
        const locationToUse = data?.location?.value;
        if (!locationToUse) {
          toast.error("Location is required");
          return;
        }

        form.set("comment", data.comment);
        data.service.forEach((s) => form.append("service", s.value));

        res = await addComplaint({ id: locationToUse, form }).unwrap();
        socket.emit("complaint-raised", {
          user: user.name,
          comment: data.comment,
          url: res.url,
        });
      }

      // Update (operator) and Review (client admin) hit the same endpoint
      // with the same shape — only the status option list differs in the UI.
      if (isUpdate || isReview) {
        form.set("status", data.status?.value || data.status);
        form.set("comment", data.comment?.value || data.comment);

        res = await updateComplaint({ id: locationId, form }).unwrap();
        socket.emit("complaint-updated", {
          user: user.name,
          status: data.status?.label,
          url: res.url,
        });

        if (isReview) toast.success(res?.msg || "Success");
      }

      dispatch(toggleModal({ name: "complaint", status: false }));
      setImages([]);
      reset();
    } catch (error) {
      toast.error(error?.data?.msg || error?.error || "Something went wrong");
    }
  };

  const imageInput = (label) => (
    <div className="mt-2">
      <label className="text-md font-medium leading-6 mr-2 text-gray-900">
        {label}
      </label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setImages(Array.from(e.target.files))}
        className="mt-0.5 block w-full text-sm text-slate-500
        file:mr-4 file:py-2 file:px-4
        file:rounded-md file:border-0
        file:text-sm file:font-semibold
        file:bg-zinc-100 file:text-zinc-700
        hover:file:bg-zinc-200"
      />
    </div>
  );

  const reviewFormBody = (
    <div className="grid gap-y-3 mb-4 ml-1">
      <div>
        <Controller
          name="status"
          control={control}
          rules={{ required: "Status is required" }}
          render={({ field }) => (
            <InputSelect
              isMulti={false}
              options={clientAdminStatus}
              onChange={field.onChange}
              value={field.value}
              label="Review Action"
            />
          )}
        />
        <p className="text-xs text-red-500 pl-1 mt-1">{errors.status?.message}</p>
      </div>

      <InputRow
        label="Comment"
        id="comment"
        errors={errors}
        register={register}
        placeholder="Add review comment"
      />

      {status?.value === "Reopen" && imageInput("Images")}
    </div>
  );

  const clientFormBody = (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {DBUser?.rights?.raise && (
        <>
          {!locationId && isPestEmployee && (
            <div>
              <Controller
                name="client"
                control={control}
                rules={{ required: "Client is required" }}
                render={({ field }) => (
                  <InputSelect
                    isMulti={false}
                    options={clientOptions}
                    onChange={field.onChange}
                    value={field.value}
                    label="Client"
                  />
                )}
              />
              <p className="text-xs text-red-500 pl-1 mt-1">
                {errors.client?.message}
              </p>
            </div>
          )}

          <div className="mr-2 mt-2">
            <label className="block text-md font-medium leading-6 text-gray-900">
              Floor
            </label>
            <select
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="mr-2 mt-0.5 w-full py-1 px-2 border-2 rounded-md outline-none transition border-neutral-300 focus:border-black"
            >
              {floors.map((item, index) => (
                <option key={index} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Controller
              name="location"
              control={control}
              rules={{ required: "Location is required" }}
              render={({ field }) => (
                <InputSelect
                  isMulti={false}
                  options={locationOptions}
                  onChange={field.onChange}
                  value={field.value}
                  label="Location"
                />
              )}
            />
            <p className="text-xs text-red-500 pl-1 mt-1">
              {errors.location?.message}
            </p>
          </div>
        </>
      )}

      <Controller
        name="service"
        control={control}
        rules={{ required: "Select at least one service" }}
        render={({ field }) => (
          <InputSelect
            isMulti={true}
            options={serviceOptions.map((s) => ({ label: s, value: s }))}
            onChange={field.onChange}
            value={field.value}
            label="Services"
          />
        )}
      />

      {imageInput("Images")}

      <div className="col-span-2">
        <InputRow
          label="Additional Comment"
          id="comment"
          errors={errors}
          register={register}
          placeholder="Exact location of pest found"
        />
      </div>
    </div>
  );

  const operatorFormBody = (
    <div className="grid gap-y-3 mb-4">
      <div>
        <Controller
          name="comment"
          control={control}
          rules={{ required: "Job comment is required" }}
          render={({ field }) => (
            <InputSelect
              isMulti={false}
              options={operatorComment}
              onChange={field.onChange}
              value={field.value}
              label="Job Comment"
            />
          )}
        />
        <p className="text-xs text-red-500 pl-1 mt-1">{errors.comment?.message}</p>
      </div>

      <div>
        <Controller
          name="status"
          control={control}
          rules={{ required: "Complaint status is required" }}
          render={({ field }) => (
            <InputSelect
              options={
                user.role === "ClientAdmin"
                  ? clientAdminStatus
                  : watch("comment")?.value === "All job done"
                    ? jobStatus.filter((s) => s.value === "Close Req")
                    : jobStatus.filter((s) => s.value === "In Progress")
              }
              onChange={field.onChange}
              value={field.value}
              label="Complaint Status"
            />
          )}
        />
        <p className="text-xs text-red-500 pl-1 mt-1">{errors.status?.message}</p>
      </div>

      {imageInput("Images*")}
    </div>
  );

  return (
    <FormModal
      onSubmit={handleSubmit(submit)}
      title={
        isCreate ? "New Complaint" : isUpdate ? "Update Complaint" : "Reopen Complaint"
      }
      formBody={isCreate ? clientFormBody : isUpdate ? operatorFormBody : reviewFormBody}
      submitLabel={isCreate ? "Add Complaint" : isUpdate ? "Update" : "Reopen/Close"}
      handleClose={() =>
        dispatch(toggleModal({ name: "complaint", status: false }))
      }
      disabled={addLoading || updateLoading}
      isLoading={addLoading || updateLoading}
      open={isModalOpen.complaint}
    />
  );
};

export default ComplaintModal;