import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { InputRow, InputSelect } from "..";
import { useAllServiceQuery } from "../../redux/adminSlice";
import { toggleModal } from "../../redux/helperSlice";
import {
  useNewComplaintMutation,
  useUpdateComplaintMutation,
} from "../../redux/serviceSlice";
import { jobStatus, operatorComment } from "../../utils/constData";
import FormModal from "./FormModal";
import { useAllLocationsQuery } from "../../redux/locationSlice";

const ComplaintModal = ({ locationId }) => {
  const [images, setImages] = useState([]);
  const [floor, setFloor] = useState("Select");
  const [locations, setLocations] = useState([]);

  const dispatch = useDispatch();
  const { isModalOpen, user } = useSelector((store) => store.helper);

  const { data, isLoading } = useAllServiceQuery();
  const [addComplaint, { isLoading: addLoading }] = useNewComplaintMutation();
  const [updateComplaint, { isLoading: updateLoading }] =
    useUpdateComplaintMutation();
  const { data: clientLocations, isLoading: locationLoading } =
    useAllLocationsQuery(
      {
        id: user.role,
      },
      { skip: user.role !== "ClientAdmin" }
    );

  useEffect(() => {
    if (clientLocations) {
      if (floor !== "Select") {
        setLocations([]);
        clientLocations.locations.map(
          (item) =>
            item.floor === floor &&
            setLocations((prev) => [
              ...prev,
              {
                label: `${item.location}, ${item.subLocation}`,
                value: item._id,
              },
            ])
        );
      } else {
        setLocations([]);
        clientLocations.locations.map((item) =>
          setLocations((prev) => [
            ...prev,
            {
              label: `${item.location}, ${item.subLocation}`,
              value: item._id,
            },
          ])
        );
      }
    }
  }, [floor, clientLocations]);

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    control,
  } = useForm({
    defaultValues: {
      location: "",
      service: "",
      comment: "",
      status: "",
    },
  });

  const submit = async (data) => {
    if (user.type === "PestEmployee") {
      if (images.length < 1)
        return toast.error("Atleast one image is required");
      if (images.length > 2)
        return toast.error("Maximum 2 images are required");
    }

    const form = new FormData();
    images.map((image) => form.append("images", image));
    if (user.type === "ClientEmployee") {
      form.set("comment", data.comment);
      data.service.map((service) => form.append("service", service.label));
    } else {
      form.set("status", data.status.label);
      form.set("comment", data.comment.label);
    }

    try {
      let res;
      if (user.type === "ClientEmployee") {
        res = await addComplaint({
          id: user.role === "ClientAdmin" ? data.location.value : locationId,
          form,
        }).unwrap();
      } else if (user.type === "PestEmployee") {
        res = await updateComplaint({ id: locationId, form }).unwrap();
      }
      toast.success(res.msg);
      dispatch(toggleModal({ name: "complaint", status: false }));
      setFloor("Select");
      reset();
    } catch (error) {
      console.log(error);
      toast.error(error?.data?.msg || error.error);
    }
  };

  const clientFormBody = (
    <div className="grid md:grid-cols-2 gap-y-3 mb-4">
      {user.role === "ClientAdmin" && (
        <>
          <div className="mr-2 mt-2">
            <label className="block text-md font-medium leading-6 text-gray-900">
              Floor
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="mr-2 mt-0.5 w-full py-0.5 px-2 border-2 rounded-md outline-none transition border-neutral-300 focus:border-black disabled:bg-slate-100"
            >
              <option>Select</option>
              {clientLocations?.floors.map((item, index) => (
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
              render={({ field: { onChange, value, ref } }) => (
                <InputSelect
                  options={locations}
                  onChange={onChange}
                  value={value}
                  label="Location"
                />
              )}
            />
            <p className="text-xs text-red-500 -bottom-4 pl-1">
              {errors.location?.message}
            </p>
          </div>
        </>
      )}
      <div className="col-span-2">
        <Controller
          name="service"
          control={control}
          rules={{ required: "Select service name" }}
          render={({ field: { onChange, value, ref } }) => (
            <InputSelect
              options={data?.services}
              onChange={onChange}
              value={value}
              label="Services"
              isMulti={true}
            />
          )}
        />
        <p className="text-xs text-red-500 -bottom-4 pl-1">
          {errors.service?.message}
        </p>
      </div>
      <div className="col-span-2">
        <label
          htmlFor="images"
          className="text-md font-medium leading-6 mr-2 text-gray-900"
        >
          Images*{" "}
          <span className="text-sm font-normal">(max 2 images allowed)</span>
        </label>
        <input
          type="file"
          onChange={(e) => setImages(Array.from(e.target.files))}
          multiple
          className="mt-0.5"
          accept="image/*"
        />
      </div>
      <div className="col-span-2">
        <InputRow
          label="Additional Comment"
          id="comment"
          errors={errors}
          register={register}
          disabled={isLoading}
          placeholder="Exact location of pest found"
        />
        <p className="text-xs text-red-500 -bottom-4 pl-1">
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
          render={({ field: { onChange, value, ref } }) => (
            <InputSelect
              options={operatorComment}
              onChange={onChange}
              value={value}
              label="Job Comment"
            />
          )}
        />
        <p className="text-xs text-red-500 -bottom-4 pl-1">
          {errors.comment?.message}
        </p>
      </div>
      <div>
        <Controller
          name="status"
          control={control}
          rules={{ required: "Complaint status is required" }}
          render={({ field: { onChange, value, ref } }) => (
            <InputSelect
              options={jobStatus}
              onChange={onChange}
              value={value}
              label="Complaint Status"
            />
          )}
        />
        <p className="text-xs text-red-500 -bottom-4 pl-1">
          {errors.status?.message}
        </p>
      </div>
      <div>
        <label
          htmlFor="images"
          className="text-md font-medium leading-6 mr-2 text-gray-900"
        >
          Images*{" "}
          <span className="text-sm font-normal">(max 2 images allowed)</span>
        </label>
        <input
          type="file"
          onChange={(e) => setImages(Array.from(e.target.files))}
          multiple
          className="mt-0.5"
          accept="image/*"
        />
      </div>
    </div>
  );

  return (
    <div>
      <FormModal
        onSubmit={handleSubmit(submit)}
        title={`${user.type === "PestEmployee" ? "Update" : "New"} Complaint`}
        formBody={
          user.type === "ClientEmployee" ? clientFormBody : operatorFormBody
        }
        submitLabel={user.type === "PestEmployee" ? "Update" : "Add Complaint"}
        handleClose={() =>
          dispatch(toggleModal({ name: "complaint", status: false }))
        }
        disabled={addLoading || updateLoading}
        isLoading={addLoading || updateLoading}
        open={isModalOpen.complaint}
      />
    </div>
  );
};
export default ComplaintModal;
