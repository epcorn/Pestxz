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
  const [collapse, setCollapse] = useState({ id: "", status: false })
  const dispatch = useDispatch()
  const fileRef = useRef();

  const { isModalOpen } = useSelector(store => store.helper);
  const { data: location } = useGetSingleLocationQuery(locationId, { skip: !locationId });
  const { data: DBuser } = useAllUserQuery();
  const [casualService, { isLoading: submitLoading }] = useCasualServiceMutation();

  const operators = DBuser?.filter(u => u.role === "Operator").map(i => ({ value: i._id, label: i.name }));

  // setup services
  const services = location?.location?.service;

  const { register, control, formState: { errors }, reset, handleSubmit } = useForm();

  const submit = async (data) => {
    try {
      if (mode === "create") {
        const formData = new FormData();
        const payload = {
          ...data,
          serviceId: data.service?.value || null,
          serviceName: data.service?.label || null,
          operatorId: data.operator?.value || null,
          operatorName: data.operator?.label || null,
          client: client,
          id: mode,
          location: locationId,
        };

        delete payload.service;
        delete payload.operator;
        delete payload.images;

        formData.append("data", JSON.stringify(payload));
        if (data.images && data.images.length > 0) {
          Array.from(data.images).forEach((file) => {
            formData.append("images", file);
          });
        }
console.log(payload)
        const res = await casualService(formData).unwrap();
        toast.success(res?.msg || "Casual service added");
        reset();
        dispatch(toggleModal({ name: name, status: false }));

      }
    } catch (error) {
      toast.error("server error")
    }
  }

  const createForm = (
    <div className='w-full md:min-w-2xl grid gap-x-5'>
      <ol className="list-decimal list-outside pl-5 m-1">
        {services?.map((ser, serIndex) => (
          <li key={ser?.serviceId} className={`mb-4 p-3 ${collapse[ser?.serviceId] ? "bg-gray-200" : ""}`}>
            <p className="rounded bg-gray-400 px-5 py-2 cursor-pointer"
              onClick={() => setCollapse(prev => ({ ...prev, [ser?.serviceId]: !prev[ser?.serviceId] }))}>
              <strong>Service Name: </strong>
              <input type="text"
                disabled
                value={ser?.serviceName}
                {...register(`services.${serIndex}.serviceName`)}
                className='px-2 py-0.5 rounded outline outline-gray-700 text-gray-700 ml-2' />
            </p>

            <ul className={`list-disc list-outside pl-5 mt-2 transition-all duration-300 ${collapse[ser?.serviceId] ? "max-h-[1000px]" : "max-h-0 overflow-hidden p-0 m-0"}`}>
              {ser?.scopes?.map((sc, scIndex) => (
                <li key={sc?.scopeId} className="text-gray-700 space-y-1">
                  <strong>Scope Name: </strong>
                  <input type="text"
                    disabled
                    className='placeholder:text-gray-700 max-w-fit outline-gray-400 px-2 py-0.5 my-1 bg-neutral-200 outline rounded ml-2'
                    {...register(`services.${serIndex}.scopes.${scIndex}.scopeId`)}
                    value={sc?.scopeName}
                    placeholder={sc?.scopeName}
                  />
                  {sc?.consumables?.map((con, conIndex) => (
                    <ul key={con?.consumableId} className="list-inside pl-5">
                      <li className='flex items-center flex-wrap gap-5 mt-1'>
                        <strong>{con?.consumableName}:</strong>
                        <div className='flex items-center gap-2'>
                          <label htmlFor={`limit-${con?.consumableId}`}>Limit: </label>
                          <input
                            type="text"
                            id={`limit-${con?.consumableId}`}
                            className='outline outline-gray-400 rounded px-2 max-w-16 py-0.5 '
                            disabled
                            {...register(`services.${serIndex}.scopes.${scIndex}.consumables.${conIndex}.calibration`)}
                            placeholder={String(con?.calibration || 0)} />

                          <label htmlFor={`used-${con?.consumableId}`}>Used: </label>
                          <input
                            type="text"
                            id={`used-${con?.consumableId}`}
                            {...register(`services.${serIndex}.scopes.${scIndex}.consumables.${conIndex}.used`)}
                            className='outline rounded px-2 max-w-16 py-0.5 ' />

                          <label htmlFor={`comment-${con?.consumableId}`}>Comment: </label>
                          <input
                            type="text"
                            id={`comment-${con?.consumableId}`}
                            {...register(`services.${serIndex}.scopes.${scIndex}.consumables.${conIndex}.comment`)}
                            className='outline rounded px-2 w-auto py-0.5 ' />
                        </div>
                      </li>
                    </ul>
                  ))}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <InputRow register={register} id={"comment"} label={'Comment'} required={true} />
    </div>
  );

  const updateForm = (
    <div>
      <input type="text" />

      {/* <Controller
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
      /> */}
      <div>
        <label className="text-md font-medium leading-6 mr-2 text-gray-900">
          Images
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          {...register("images")}
          // FIX: merge RHF's ref with your manual fileRef so both work
          ref={(e) => {
            register("images").ref(e);
            fileRef.current = e;
          }}
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