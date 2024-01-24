import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import {
  AlertMessage,
  Button,
  InputRow,
  InputSelect,
  Loading,
} from "../components";
import { types } from "../utils/constData";
import {
  useAddServiceMutation,
  useAllServiceQuery,
  useDeleteServiceMutation,
  useUpdateServiceMutation,
} from "../redux/adminSlice";
import { FaEdit } from "react-icons/fa";
import { useState } from "react";
import { DeleteModal } from "../components/modals";
import { useDispatch, useSelector } from "react-redux";
import { toggleModal } from "../redux/helperSlice";

const Services = () => {
  const [update, setUpdate] = useState({
    status: false,
    id: "",
  });
  const { isModalOpen } = useSelector((store) => store.helper);
  const dispatch = useDispatch();

  const { data, isLoading, isFetching, error } = useAllServiceQuery();
  const [addService, { isLoading: addLoading }] = useAddServiceMutation();
  const [updateService, { isLoading: updateLoading }] =
    useUpdateServiceMutation();
  const [deleteService, { isLoading: deleteLoading }] =
    useDeleteServiceMutation();

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
      serviceType: { label: "Service", value: "Service" },
      serviceName: "",
    },
  });

  const watchType = watch("serviceType");

  const submit = async (data) => {
    let res;
    try {
      if (update.status) {
        res = await updateService({ id: update.id, data }).unwrap();
      } else {
        res = await addService(data).unwrap();
      }
      setUpdate({ status: false, id: "" });
      toast.success(res.msg);
      reset();
    } catch (error) {
      console.log(error);
      toast.error(error?.data?.msg || error.error);
    }
  };

  const copyData = (data) => {
    setValue("serviceName", data.serviceName.label);
    setValue("serviceType", data.serviceType);
    setUpdate({ status: true, id: data._id });
  };

  const handleDelete = async () => {
    try {
      await deleteService(isModalOpen.delete.id).unwrap();
      toast.success("Deleted successfully");
      dispatch(
        toggleModal({ name: "delete", status: { id: null, name: null } })
      );
    } catch (error) {
      console.log(error);
      toast.error(error?.data?.msg || error.error);
    }
  };

  return (
    <div>
      {isLoading || isFetching || updateLoading ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}
      {!error && (
        <>
          <form
            className="md:flex md:space-x-5 justify-center items-center"
            onSubmit={handleSubmit(submit)}
          >
            <div className="md:w-56">
              <Controller
                name="serviceType"
                control={control}
                rules={{ required: "Select type" }}
                render={({ field: { onChange, value, ref } }) => (
                  <InputSelect
                    options={types}
                    onChange={onChange}
                    value={value}
                    label="Type"
                  />
                )}
              />
              <p className="text-xs text-red-500 -bottom-4 pl-1">
                {errors.serviceType?.message}
              </p>
            </div>
            <div className="pb-4 md:pb-0">
              <InputRow
                label="Name"
                id="serviceName"
                errors={errors}
                register={register}
              />
              <p className="text-xs text-red-500 -bottom-4 pl-1">
                {errors.serviceName && "Name is required"}
              </p>
            </div>
            <div className="text-center">
              <Button
                type="submit"
                color="bg-green-500"
                label={`${update.status ? "Update" : "Add"} ${watchType.label}`}
                disabled={addLoading}
                isLoading={addLoading}
                height="h-10"
              />
            </div>
          </form>
          <hr className="h-px mt-5 mb-7 border-0 bg-gray-700" />
          <div className="overflow-y-auto my-4">
            <table className="w-full border whitespace-nowrap border-neutral-500 bg-text">
              <thead>
                <tr className="h-8 w-full leading-none">
                  <th className="font-bold text-center border-neutral-500 border-2 px-3">
                    Service Type
                  </th>
                  <th className="font-bold text-center border-neutral-500 border-2 px-3">
                    Service Name
                  </th>
                  <th className="font-bold text-center border-neutral-500 border-2 w-32 px-3">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.allServices.map((service) => (
                  <tr
                    key={service._id}
                    className="h-8 text-[14px] border-b border-neutral-500 hover:bg-slate-200"
                  >
                    <td className="px-3 border-r  border-neutral-500">
                      {service.serviceType.label}
                    </td>
                    <td className="px-3 border-r  border-neutral-500">
                      {service.serviceName.label}
                    </td>
                    <td className="px-3 flex justify-center h-8 items-center space-x-3 border-r text-center border-neutral-500">
                      <button type="button" onClick={() => copyData(service)}>
                        <FaEdit className="h-5 w-5 text-indigo-600" />
                      </button>
                      <DeleteModal
                        title="Delete Service"
                        handleDelete={handleDelete}
                        isLoading={deleteLoading}
                        id={{
                          id: service._id,
                          name: service.serviceName.label,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
export default Services;
