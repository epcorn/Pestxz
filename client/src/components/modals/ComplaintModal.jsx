import { useEffect, useState } from "react";
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
import { clientAdminStatus, jobStatus, operatorComment } from "../../utils/constData";
import FormModal from "./FormModal";

const ComplaintModal = ({ locationId, mode = "create" }) => {
  const isCreate = mode === "create";
  const isUpdate = mode === "update";
  const isReview = mode === "review";

  const [images, setImages] = useState([]);
  const [floor, setFloor] = useState("Select");
  const [locations, setLocations] = useState([]);

  const dispatch = useDispatch();
  const { isModalOpen, user } = useSelector((store) => store.helper);

  const [addComplaint, { isLoading: addLoading }] = useNewComplaintMutation();
  const [updateComplaint, { isLoading: updateLoading }] = useUpdateComplaintMutation();

  const { data: clientLocations } = useAllLocationsQuery({ id: user?.type });

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
      location: "",
      service: "",
      comment: "",
      status: "",
    },
  });

  const selectedLocation = watch("location");

  // Sync Locations dynamically whenever the floor dropdown changes
  useEffect(() => {
    if (!clientLocations?.locations) return;

    const filteredLocations = clientLocations.locations
      .filter((item) => floor === "Select" || item.floor === floor)
      .map((item) => ({
        label: `${item.location}${item.subLocation ? `, ${item.subLocation}` : ""}`,
        value: item._id,
      }));

    setLocations(filteredLocations);
    setValue("location", "");
    setValue("service", "");
  }, [floor, clientLocations, setValue]);

  const currentSelectedId = user.rights.raise ? selectedLocation?.value : locationId;
  const targetedLocationRecord = clientLocations?.locations?.find((loc) => loc._id === currentSelectedId);

  // Safely extract services list as distinct string options
  const rawServices = targetedLocationRecord?.service || [];
  const serviceOptions = rawServices
    .map((s) => {
      let nameStr = "";
      if (typeof s === "string") {
        nameStr = s.trim();
      } else if (s && typeof s === "object") {
        nameStr = s.serviceName || s.service || s.name || "";
      }
      if (nameStr.endsWith(",")) {
        nameStr = nameStr.slice(0, -1).trim();
      }
      return nameStr;
    })
    .filter((name) => name !== "");

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

      // CREATE COMPLAINT
      if (isCreate) {
        form.set("comment", data.comment);
        form.set("service", data.service);

        res = await addComplaint({
          id: user.rights.raise
            ? data?.location?.value
            : locationId,
          form,
        }).unwrap();
      }

      // OPERATOR UPDATE
      if (isUpdate) {
        form.set(
          "status",
          data.status?.value || data.status
        );

        form.set(
          "comment",
          data.comment?.value || data.comment
        );

        res = await updateComplaint({
          id: locationId,
          form,
        }).unwrap();
      }

      // CLIENT ADMIN REVIEW
      if (isReview) {
        form.set(
          "status",
          data.status?.value || data.status
        );

        form.set("comment", data.comment);

        res = await updateComplaint({
          id: locationId,
          form,
        }).unwrap();
      }

      toast.success(res?.msg || "Success");

      dispatch(
        toggleModal({
          name: "complaint",
          status: false,
        })
      );

      setFloor("Select");
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
          render={({ field: { onChange, value } }) => (
            <InputSelect
              isMulti={false}
              options={clientAdminStatus}
              onChange={onChange}
              value={value}
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

        <p className="text-xs text-red-500 pl-1 mt-1">
          {errors.comment && "Comment is required"}
        </p>
      </div>

      <div>
        <label
          htmlFor="images"
          className="text-md font-medium leading-6 mr-2 text-gray-900"
        >
          Images
        </label>

        <input
          type="file"
          id="images"
          onChange={(e) =>
            setImages(Array.from(e.target.files))
          }
          multiple
          className="mt-0.5 block w-full text-sm text-slate-500
        file:mr-4 file:py-2 file:px-4
        file:rounded-md file:border-0
        file:text-sm file:font-semibold
        file:bg-zinc-100 file:text-zinc-700
        hover:file:bg-zinc-200"
          accept="image/*"
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
              Floor <span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="mr-2 mt-0.5 w-full py-0.5 px-2 border-2 rounded-md outline-none transition border-neutral-300 focus:border-black"
            >
              {/* <option value="Select">Select</option> */}
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
              rules={{ required: "Location is required" }}
              render={({ field: { onChange, value } }) => (
                <InputSelect
                  isMulti={false}
                  options={locations}
                  onChange={onChange}
                  value={value}
                  label="Location"
                />
              )}
            />
            <p className="text-xs text-red-500 pl-1 mt-1">{errors.location?.message}</p>
          </div>
        </>
      )}

      <div className="col-span-2">
        <label className="block text-md font-medium leading-6 text-gray-900 mb-1">
          Services <span className="text-red-500 ml-0.5">*</span>
        </label>

        <Controller
          name="service"
          control={control}
          rules={{ required: "Select service" }}
          render={({ field: { onChange, value } }) => (
            <select
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              className="w-full py-2 px-2 border-2 rounded-md outline-none transition border-neutral-300 focus:border-black"
            >
              <option value="">Select Service</option>
              {serviceOptions.map((serviceName, index) => (
                <option key={index} value={serviceName}>
                  {serviceName}
                </option>
              ))}
            </select>
          )}
        />
        <p className="text-xs text-red-500 pl-1 mt-1">{errors.service?.message}</p>
      </div>

      <div className="col-span-2">
        <label htmlFor="images" className="text-md font-medium leading-6 mr-2 text-gray-900">
          Images* <span className="text-sm font-normal">(max 2 images allowed)</span>
        </label>
        <input
          type="file"
          id="images"
          onChange={(e) => setImages(Array.from(e.target.files))}
          multiple
          className="mt-0.5 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
          accept="image/*"
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
        <p className="text-xs text-red-500 pl-1 mt-1">
          {errors.comment && "Comment is required"}
        </p>
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
          render={({ field: { onChange, value } }) => (
            <InputSelect
              isMulti={false}
              options={operatorComment}
              onChange={onChange}
              value={value}
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
          render={({ field: { onChange, value } }) => (
            <InputSelect
              options={
                user.role === "ClientAdmin"
                  ? clientAdminStatus
                  : jobStatus
              }
              onChange={onChange}
              value={value}
              label="Complaint Status"
            />
          )}
        />
        <p className="text-xs text-red-500 pl-1 mt-1">{errors.status?.message}</p>
      </div>
      <div>
        <label htmlFor="images" className="text-md font-medium leading-6 mr-2 text-gray-900">
          Images* <span className="text-sm font-normal">(max 2 images allowed)</span>
        </label>
        <input
          type="file"
          id="images"
          onChange={(e) => setImages(Array.from(e.target.files))}
          multiple
          className="mt-0.5 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
          accept="image/*"
        />
      </div>
    </div>
  );

  return (
    <div>
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
              : "Reopen"
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
    </div>
  );
};

export default ComplaintModal;