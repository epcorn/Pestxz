import React, { useRef, useState } from 'react'
import FormModal from '../../modals/FormModal'
import { useDispatch, useSelector } from 'react-redux'
import { toggleModal } from '../../../redux/helperSlice';
import { useParams } from 'react-router-dom';
import InputRow from '../../InputRow';
import { Controller, useForm } from 'react-hook-form';
import InputSelect from '../../InputSelect';
import { useAllServiceQuery, useAllUserQuery } from '../../../redux/adminSlice';
import { useCasualServiceMutation } from '../../../redux/serviceSlice';
import { toast } from 'react-toastify';
import { useGetSingleLocationQuery } from '../../../redux/locationSlice';

function CasualForm({ mode, client, casualId, name }) {
  const { id: locationId } = useParams();
  const dispatch = useDispatch()
  const fileRef = useRef();

  const { isModalOpen } = useSelector(store => store.helper);
  const { data: location } = useGetSingleLocationQuery(locationId, { skip: !locationId });
  const { data: DBuser } = useAllUserQuery();
  const [casualService, { isLoading: submitLoading }] = useCasualServiceMutation();

  const operators = DBuser?.filter(u => u.role === "Operator").map(i => ({ value: i._id, label: i.name }));

  console.log(operators);

  // setup services
  const services = location?.location?.service
  const allServices = services?.map(ser => ({
    label: ser.serviceName, value: ser.serviceId
  }))

  const { register, control, formState: { errors }, reset, handleSubmit } = useForm();

  const submit = async (data) => {
    try {
      const formData = new FormData();
      if (mode === "create") {
        // 2. Append all text and select fields
        Object.keys(data)?.forEach((key) => {
          if (key === "images") return;
          if (key === "service" && data.service) {
            formData.append("serviceId", data.service.value);
            formData.append("serviceName", data.service.label);
          } else if (key === "operator" && data.operator) {
            formData.append("operatorId", data.operator.value);
            formData.append("operatorName", data.operator.label);
          } else if (data[key] !== undefined && data[key] !== null) {
            formData.append(key, data[key]);
          }
        });
        formData.append("client", client);
        formData.append("id", mode);
        formData.append("location", locationId);

        if (data.images && data.images.length > 0) {
          for (let i = 0; i < data.images.length; i++) {
            formData.append("images", data.images[i]);
          }
        }
        const res = await casualService(formData).unwrap()
        toast.success(res.msg || "casual service added")
        reset();
      } else if (mode === "update") {

      }
    } catch (error) {
      toast.error("server error")
    }
  }

  const createForm = (
    <div className='w-full md:min-w-2xl grid grid-cols-2 gap-x-5'>
      <Controller
        name="service"
        control={control}
        rules={{ required: "Please select a service" }}
        render={({ field: { onChange, value } }) => (
          <InputSelect
            label="Select service"
            placeholder="choose a service..."
            options={allServices}
            value={value}
            onChange={onChange}
            required={true}
          />
        )}
      />
      <Controller
        name="operator"
        control={control}
        rules={{ required: "Need to select operator" }}
        render={({ field: { onChange, value } }) => (
          <InputSelect
            label="Select Operator"
            placeholder="choose a Operator..."
            options={operators}
            value={value}
            onChange={onChange}
            required={true}
          />
        )}
      />
      {/* <div>
        <label className="text-md font-medium leading-6 mr-2 text-gray-900">
          Images
        </label>
        <input
          type="file"
          multiple

          ref={fileRef}
          accept="image/*"
          {...register("images")}
          className="mt-0.5 block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-zinc-100 file:text-zinc-700
          hover:file:bg-zinc-200"
        />
      </div> */}
      <InputRow register={register} id={"comment"} label={'Comment'} required={true} />
    </div>
  )
  const updateForm = (
    <div>
      <input type="text" />

      <Controller
        name="service"
        control={control}
        rules={{ required: "Please select a service" }}
        render={({ field: { onChange, value } }) => (
          <InputSelect
            label="Select service"
            placeholder="choose a service..."
            options={allServices}
            value={value}
            onChange={onChange}
            required={true}
          />
        )}
      />
      <div>
        <label className="text-md font-medium leading-6 mr-2 text-gray-900">
          Images
        </label>
        <input
          type="file"
          multiple
          ref={fileRef}
          accept="image/*"
          {...register("images")}
          className="mt-0.5 block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-zinc-100 file:text-zinc-700
          hover:file:bg-zinc-200"
        />
      </div>
      <InputRow register={register} id={"comment"} label={'Comment'} required={true} />
    </div>
  )

  return (
    <FormModal
      formBody={mode === "create" ? createForm : updateForm}
      submitLabel={mode === "create" ? "Submit" : "Update"}
      onSubmit={handleSubmit(submit)}
      disabled={submitLoading}
      open={isModalOpen[name]}
      title={mode === "create" ? 'Casual Service' : "Update Casual Service"}
      handleClose={() => dispatch(toggleModal({ name: name, status: false }))}
    />
  )
}

export default CasualForm