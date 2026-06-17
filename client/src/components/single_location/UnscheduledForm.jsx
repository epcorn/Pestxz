import React from 'react'
import FormModal from '../modals/FormModal'
import { Controller, useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { toggleModal } from '../../redux/helperSlice'
import { toast } from 'react-toastify'
import InputRow from '../InputRow'
import InputSelect from '../InputSelect'
import { useAllServiceQuery } from '../../redux/adminSlice'
import { useUnscheduledReportMutation } from '../../redux/locationSlice'
import { socket } from '../../socket'


function UnscheduledForm({ existing, locationId, type, id }) {
  const dispatch = useDispatch()
  const { isModalOpen, user } = useSelector(store => store.helper)
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm()
  const { data: allServices } = useAllServiceQuery({ skip: !locationId })
  const [updateUnscheduledReport, { isLoading: unScLoading }] = useUnscheduledReportMutation()

  const flatServices = allServices?.services.flatMap(a => a.service.map(s => ({ label: s.serviceName, value: s._id })));

  const serviceList = flatServices?.filter(s => !existing?.includes(s.value));

  const labels = [{ label: "Done", value: "Done" }, { label: "Not Done", value: "Not Done" }]
  const switchs = type === "raise" ? serviceList : labels

  const submit = async (data) => {
    if (type === "raise") {
      data.type = "raise"
      data.locationId = locationId
      // const res = await updateUnscheduledReport(data).unwrap()
      data.raisedBy = user.name
      socket.emit("unscheduled-raised", data)
      toast.success(res?.msg || "done")
    }
    if (type === "update") {
      data.type = "update"
      data.id = id
      const res = await updateUnscheduledReport(data).unwrap()
      socket.emit("unscheduled-update", { status: data.status })
      toast.success(res.msg || "done")
    }
    dispatch(toggleModal({
      name: "unscheduled",
      status: false,
    }))
  }

  const raisebody = (
    <div>
      <Controller
        name="service"
        control={control}
        rules={{ required: "Please select a service" }}
        render={({ field: { onChange, value } }) => (
          <InputSelect
            label="Select Service"
            placeholder="choose a service..."
            options={switchs}
            value={value}
            onChange={onChange}
            required={true}
          />
        )}
      />
      {errors.service && <p className="text-red-500 text-sm mt-1">{errors.service.message}</p>}

      <InputRow register={register} id='comment' label='Comment' required={true} />
    </div>
  )
  const updatebody = (
    <div>
      <Controller
        name="status"
        control={control}
        rules={{ required: "Please select a status" }}
        render={({ field: { onChange, value } }) => (
          <InputSelect
            label="Select status"
            placeholder="choose a status..."
            options={switchs}
            value={value}
            onChange={onChange}
            required={true}
          />
        )}
      />
      {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}

      

      <InputRow register={register} id={'comment'} label={'Comment'} required={true} />
    </div>
  )
  return (
    <FormModal formBody={type === "raise" ? raisebody : updatebody} 
    open={isModalOpen.unscheduled}
      title='Report Un-Scheduled work'
      disabled={unScLoading}
      submitLabel={type === "raise" ? "Report" : "Update"}
      onSubmit={handleSubmit(submit)}
      handleClose={() => dispatch(toggleModal({
        name: "unscheduled",
        status: false,
      }))}
    />
  )
}

export default UnscheduledForm;