// ComplaintModal.jsx

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { InputRow, InputSelect } from "..";
import { toggleModal } from "../../redux/helperSlice";
import { useAllLocationsQuery } from "../../redux/locationSlice";
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

const ComplaintModal = ({ locationId, mode = "create" }) => {
  
  const isCreate = mode === "create";
  const isUpdate = mode === "update";
  const isReview = mode === "review";

  const [images, setImages] = useState([]);
  const [floor, setFloor] = useState("");
  const dispatch = useDispatch();
  const { isModalOpen, user } = useSelector((store) => store.helper);

  const [addComplaint, { isLoading: addLoading }] =
    useNewComplaintMutation();

  const [updateComplaint, { isLoading: updateLoading }] =
    useUpdateComplaintMutation();

  const { data: clientLocations } = useAllLocationsQuery(
    { id: user?.type === "ClientEmployee" ? user?.type : locationId },
    { skip: !user?.type }
  );

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
      location: null,
      service: "",
      comment: "",
      status: null,
    },
  });

  const selectedLocation = watch("location");

  // SET INITIAL FLOOR
  useEffect(() => {
    if (!clientLocations?.floors?.length) return;
    if (!floor) {
      setFloor(clientLocations.floors[0]);
    }
  }, [clientLocations, floor]);

  // LOCATION OPTIONS
  const locationOptions = useMemo(() => {
    if (!clientLocations?.locations) return [];

    return clientLocations.locations
      .filter((item) => !floor || item.floor === floor)
      .map((item) => ({
        label: `${item.location}${item.subLocation ? `, ${item.subLocation}` : ""
          }`,
        value: item._id,
      }));
  }, [clientLocations, floor]);

  // PRESELECT LOCATION
  useEffect(() => {
    if (!locationId || !clientLocations?.locations) return;

    const currentLocation = clientLocations.locations.find(
      (loc) => loc._id?.toString() === locationId?.toString()
    );
    if (!currentLocation) return;
    setFloor(currentLocation.floor);

    setValue("location", {
      label: `${currentLocation.location}${currentLocation.subLocation
        ? `, ${currentLocation.subLocation}`
        : ""
        }`,
      value: currentLocation._id,
    });
  }, [locationId, clientLocations, setValue]);

  // RESET ON FLOOR CHANGE
  useEffect(() => {
    if (!locationId) {
      setValue("location", null);
      setValue("service", "");
    }
  }, [floor, locationId, setValue]);

  const currentSelectedId =
    selectedLocation?.value || locationId;

  console.log(selectedLocation?.value, currentSelectedId, locationId)
  const targetedLocationRecord =
    clientLocations?.locations?.find(
      (loc) => loc._id?.toString() === currentSelectedId?.toString()
    );
  // SERVICES
  const serviceOptions = useMemo(() => {
    const rawServices = targetedLocationRecord?.service || [];

    return rawServices
      .map((s) => {
        if (typeof s === "string") {
          return s.trim().replace(/,$/, "");
        }
        if (typeof s === "object") {
          return (
            s.serviceName ||
            s.service ||
            s.name ||
            ""
          )
            .trim()
            .replace(/,$/, "");
        }
        return "";
      })
      .filter(Boolean);
  }, [targetedLocationRecord]);


  const submit = async (data) => {
    if (images.length > 2) {
      return toast.error("Maximum 2 images are allowed");
    }
    const form = new FormData();
    images.forEach((image) => {
      form.append("images", image);
    });
    try {
      let res;
      // CREATE
      if (isCreate) {
        form.set("comment", data.comment);
        form.set("service", data.service);

        const locationToUse = data?.location?.value;
        if (!locationToUse) {
          toast.error("Location is required");
          return;
        }
        console.log(locationToUse, [...form])
        res = await addComplaint({ id: locationToUse, form }).unwrap();
      }
      // UPDATE
      if (isUpdate) {
        form.set("status", data.status?.value || data.status);
        form.set("comment", data.comment?.value || data.comment);
        res = await updateComplaint({ id: locationId, form }).unwrap();
      }

      // REVIEW
      if (isReview) {
        form.set("status", data.status?.value || data.status);
        form.set("comment", data.comment);
        res = await updateComplaint({
          id: locationId,
          form,
        }).unwrap();
      }

      toast.success(res?.msg || "Success");

      dispatch(toggleModal({ name: "complaint", status: false }));

      setImages([]);
      reset();
    } catch (error) {
      console.log(error);

      toast.error(
        error?.data?.msg ||
        error?.error ||
        "Something went wrong"
      );
    }
  };


  const reviewFormBody = (
    <div className="grid gap-y-3 mb-4">
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

        <p className="text-xs text-red-500 pl-1 mt-1">
          {errors.status?.message}
        </p>
      </div>

      <div>
        <InputRow
          label="Comment"
          id="comment"
          errors={errors}
          register={register}
          placeholder="Add review comment"
        />
      </div>

      <div>
        <label className="text-md font-medium leading-6 mr-2 text-gray-900">
          Images
        </label>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) =>
            setImages(Array.from(e.target.files))
          }
          className="mt-0.5 block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-zinc-100 file:text-zinc-700
          hover:file:bg-zinc-200"
        />
      </div>
    </div>
  );

  const clientFormBody = (
    <div className="grid md:grid-cols-2 gap-y-3 mb-4">
      {user.rights.raise && (
        <>
          <div className="mr-2 mt-2">
            <label className="block text-md font-medium leading-6 text-gray-900">
              Floor
            </label>

            <select
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="mr-2 mt-0.5 w-full py-1 px-2 border-2 rounded-md outline-none transition border-neutral-300 focus:border-black"
            >
              {clientLocations?.floors?.map((item, index) => (
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
              rules={{
                required: "Location is required",
              }}
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

      <div className="col-span-2">
        <label className="block text-md font-medium leading-6 text-gray-900 mb-1">
          Services
        </label>

        <Controller
          name="service"
          control={control}
          rules={{ required: "Select service" }}
          render={({ field }) => (
            <select
              value={field.value || ""}
              onChange={(e) =>
                field.onChange(e.target.value)
              }
              className="w-full py-2 px-2 border-2 rounded-md outline-none transition border-neutral-300 focus:border-black"
            >
              <option value="">Select Service</option>

              {serviceOptions?.map((serviceName, index) => (
                <option key={index} value={serviceName}>
                  {serviceName}
                </option>
              ))}
            </select>
          )}
        />

        <p className="text-xs text-red-500 pl-1 mt-1">
          {errors.service?.message}
        </p>
      </div>

      <div className="col-span-2">
        <label className="text-md font-medium leading-6 mr-2 text-gray-900">
          Images*
        </label>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) =>
            setImages(Array.from(e.target.files))
          }
          className="mt-0.5 block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-zinc-100 file:text-zinc-700
          hover:file:bg-zinc-200"
        />
      </div>

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
          rules={{
            required: "Job comment is required",
          }}
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

        <p className="text-xs text-red-500 pl-1 mt-1">
          {errors.comment?.message}
        </p>
      </div>

      <div>
        <Controller
          name="status"
          control={control}
          rules={{
            required: "Complaint status is required",
          }}
          render={({ field }) => (
            <InputSelect
              options={
                user.role === "ClientAdmin"
                  ? clientAdminStatus
                  : watch("comment")?.value === "All job done"
                    ? jobStatus.filter(s => s.value === "Close Req")
                    : jobStatus.filter(s => s.value === "In Progress")
              }
              onChange={field.onChange}
              value={field.value}
              label="Complaint Status"
            />
          )}
        />

        <p className="text-xs text-red-500 pl-1 mt-1">
          {errors.status?.message}
        </p>
      </div>

      <div>
        <label className="text-md font-medium leading-6 mr-2 text-gray-900">
          Images*
        </label>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) =>
            setImages(Array.from(e.target.files))
          }
          className="mt-0.5 block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-zinc-100 file:text-zinc-700
          hover:file:bg-zinc-200"
        />
      </div>
    </div>
  );

  return (
    <FormModal
      onSubmit={handleSubmit(submit)}
      title={
        isCreate
          ? "New Complaint"
          : isUpdate
            ? "Update Complaint"
            : "Reopen Complaint"
      }
      formBody={
        isCreate
          ? clientFormBody
          : isUpdate
            ? operatorFormBody
            : reviewFormBody
      }
      submitLabel={
        isCreate
          ? "Add Complaint"
          : isUpdate
            ? "Update"
            : "Reopen/Close"
      }
      handleClose={() =>
        dispatch(
          toggleModal({
            name: "complaint",
            status: false,
          })
        )
      }
      disabled={addLoading || updateLoading}
      isLoading={addLoading || updateLoading}
      open={isModalOpen.complaint}
    />
  );
};

export default ComplaintModal;