import React from 'react'
import FormModal from '../../modals/FormModal'
import { useDispatch, useSelector } from 'react-redux'
import { toggleModal } from '../../../redux/helperSlice';
import { useParams } from 'react-router-dom';
import InputRow from '../../InputRow';
import { Controller, useForm } from 'react-hook-form';
import InputSelect from '../../InputSelect';
import { useAllServiceQuery } from '../../../redux/adminSlice';
import { useCasualServiceMutation } from '../../../redux/serviceSlice';
import { toast } from 'react-toastify';

function CasualForm({ mode, client, casualId }) {
  const { id: locationId } = useParams();
  const dispatch = useDispatch()

  const { isModalOpen } = useSelector(store => store.helper);
  const { data: services } = useAllServiceQuery();
  const [casualService, { isLoading: submitLoading }] = useCasualServiceMutation()

  const allServices = services?.services?.flatMap(f => f?.service?.map(ser => ({
    label: ser.serviceName, value: ser._id
  })))
  const { register, control, formState: { errors }, reset, handleSubmit } = useForm();

  const submit = async (data) => {
    if (mode === "create") {
      data.client = client
      data.id = mode;
      data.location = locationId;
      console.log(data)
      try {
        const res = await casualService(data).unwrap()
        toast.success(res.msg || "casual service added")
        reset();
      } catch (error) {
        toast.error("server error")
      }
    } else {

    }

  }

  const createForm = (
    <div>
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
      <InputRow register={register} id={"comment"} label={'Comment'} required={true} />
    </div>
  )
  return (
    <FormModal
      formBody={createForm}
      submitLabel={mode === "create" ? "Submit" : "Update"}
      onSubmit={handleSubmit(submit)}
      disabled={submitLoading}
      open={isModalOpen.casual}
      title={mode === "create" ? 'Casual Service' : "Update Casual Service"}
      handleClose={() => dispatch(toggleModal({ name: "casual", status: false }))}
    />
  )
}

export default CasualForm