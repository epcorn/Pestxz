import React, { useState } from 'react'
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
  const [unscheduledReport, { isLoading: unScLoading }] = useUnscheduledReportMutation()

  const flatServices = allServices?.services.flatMap(a => a.service.map(s => ({ label: s.serviceName, value: s._id })));
  const serviceList = flatServices?.filter(s => !existing?.includes(s.value));

  const labels = [{ label: "Done", value: "Done" }, { label: "Not Done", value: "Not Done" }]
  const switchs = type === "raise" ? serviceList : labels

  const submit = async (data) => {
    if (type !== "raise") {
      dispatch(toggleModal({ name: "unscheduled", status: false }))
      return
    }

    try {
      const formData = new FormData()
      formData.append("type", "raise")
      formData.append("locationId", locationId)
      formData.append("comment", data.comment)
      formData.append("service", JSON.stringify(data.service))

      for (let i = 0; i < data.image.length; i++) {
        formData.append("image", data.image[i])
      }

      const res = await unscheduledReport(formData).unwrap()

      socket.emit("unscheduled-raised", {
        type: "raise",
        locationId,
        name: "Unscheduled work",
        comment: data.comment,
        raisedBy: user.name,
      })

      toast.success(res?.msg || "done")
      reset()
      dispatch(toggleModal({ name: "unscheduled", status: false }))
    } catch (err) {
      console.log(err)
      toast.error(err?.data?.msg || "Submission failed")
    }
  }

  const raisebody = (
    <div className='px-1'>
      <Controller
        name="service"
        control={control}
        rules={{ required: "Please select a service" }}
        render={({ field: { onChange, value } }) => (
          <InputSelect
            isMulti={true}
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

      <div>
        <label className="text-md font-medium leading-6 mr-2 text-gray-900">
          Images<span className='text-red-500'>*</span>
        </label>
        <input
          type="file"
          multiple
          required={false}
          accept="image/*"
          {...register("image")}
          className="mt-0.5 block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-zinc-100 file:text-zinc-700
          hover:file:bg-zinc-200"
        />
      </div>

      <InputRow register={register} id='comment' label='Comment' required={true} />
    </div>
  )

  return (
    <FormModal
      formBody={type === "raise" ? raisebody : ""}
      open={isModalOpen.unscheduled}
      title='Report Un-Scheduled work'
      disabled={unScLoading}
      submitLabel={type === "raise" ? "Report" : unScLoading ? "Reporting..." : ""}
      isLoading={unScLoading}
      onSubmit={handleSubmit(submit)}
      handleClose={() => dispatch(toggleModal({ name: "unscheduled", status: false }))}
    />
  )
}

export default UnscheduledForm;