import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAllServiceQuery } from "../../redux/adminSlice";
import {
  useAddLocationMutation,
  useUpdateLocationMutation,
} from "../../redux/locationSlice";
import { InputRow, InputSelect, Loading } from "..";
import { useDispatch, useSelector } from "react-redux";
import FormModal from "./FormModal";
import { toggleModal } from "../../redux/helperSlice";

const LocationModal = ({ clientId, locationDetails }) => {
  const dispatch = useDispatch();
  const { isModalOpen } = useSelector((store) => store.helper);
  const [add, { isLoading: addLoading }] = useAddLocationMutation();
  const [update, { isLoading: updateLoading }] = useUpdateLocationMutation();
  const { data, isLoading, isFetching } = useAllServiceQuery();

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    control,
  } = useForm({
    defaultValues: locationDetails || {
      floor: "",
      subLocation: "",
      location: "",
      service: "",
      product: "",
    },
  });

  const submit = async (data) => {
    if (data.service.length < 1 && data.product.length < 1) {
      toast.error("Please choose Service/Product");
      return;
    }
    data.clientId = clientId;
    let res;
    try {
      if (locationDetails) {
        res = await update({ id: locationDetails._id, data }).unwrap();
      } else {
        res = await add(data).unwrap();
      }
      reset();
      toast.success(res.msg);
      dispatch(toggleModal({ name: "location", status: false }));
    } catch (error) {
      console.log(error);
      toast.error(error?.data?.msg || error.error);
    }
  };

  const formBody = (
    <div className="grid md:grid-cols-2 gap-x-4 mb-4">
      <div>
        <InputRow
          label="Floor"
          id="floor"
          errors={errors}
          register={register}
          disabled={addLoading || updateLoading}
        />
        <p className="text-xs text-red-500 -bottom-4 pl-1">
          {errors.floor && "Floor is required"}
        </p>
      </div>
      <div>
        <InputRow
          label="Location"
          id="location"
          errors={errors}
          register={register}
          disabled={addLoading || updateLoading}
        />
        <p className="text-xs text-red-500 -bottom-4 pl-1">
          {errors.subLocation && "Sub location is required"}
        </p>
      </div>
      <div className="md:col-span-2">
        <InputRow
          label="Sub Location"
          id="subLocation"
          errors={errors}
          register={register}
          disabled={addLoading || updateLoading}
        />
        <p className="text-xs text-red-500 -bottom-4 pl-1">
          {errors.location && "Location is required"}
        </p>
      </div>
      <div>
        <Controller
          name="service"
          control={control}
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
      </div>
      <div>
        <Controller
          name="product"
          control={control}
          render={({ field: { onChange, value, ref } }) => (
            <InputSelect
              options={data?.products}
              onChange={onChange}
              value={value}
              label="Products"
              isMulti={true}
            />
          )}
        />
      </div>
    </div>
  );

  return (
    <div>
      {(isLoading || isFetching) && <Loading />}
      <FormModal
        onSubmit={handleSubmit(submit)}
        title={`${locationDetails ? "Update" : "New"} Location`}
        formBody={formBody}
        submitLabel={`${locationDetails ? "Update" : "Add"} Location`}
        handleClose={() =>
          dispatch(toggleModal({ name: "location", status: false }))
        }
        disabled={addLoading || updateLoading}
        isLoading={addLoading || updateLoading}
        open={isModalOpen.location}
      />
    </div>
  );
};
export default LocationModal;
