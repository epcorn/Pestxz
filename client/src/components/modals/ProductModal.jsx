import React, { useEffect, useState } from 'react'
import InputRow from '../InputRow'
import { useFieldArray, useForm } from 'react-hook-form'
import Button from '../Button'
import { useDispatch, useSelector } from 'react-redux'
import { toggleModal } from '../../redux/helperSlice'
import FormModal from './FormModal'
import { useAddProductsMutation } from '../../redux/adminSlice'
import { toast } from 'react-toastify'

function ProductModal({ mode = 'create', productData = {}, modalKey = "" }) {
  const dispatch = useDispatch();
  const { isModalOpen } = useSelector(Store => Store.helper)
  const [add, setAdd] = useState({ status: false, });

  const [addProduct, { isLoading: addPrLoading, error: addPrError }] = useAddProductsMutation();

  // const { control, formState: { errors }, register, reset, handleSubmit, watch } = useForm({
  //   defaultValues: {
  //     name: "",
  //     specification: "",
  //     version: "", code: "", calibration: [{ value: "" }],
  //   }
  // });

  const { control, formState: { errors }, register, reset, handleSubmit, watch } = useForm({
    defaultValues: {
      name: "",
      specification: "",
      version: "", code: "", calibration: [{ value: "" }],
    }
  });

  // const { fields, append, remove } = useFieldArray({
  //   control,
  //   name: "calibration"
  // })

  // useEffect(() => {
  //   if (mode === 'update' && productData) {
  //     reset({
  //       name: productData.name || "",
  //       code: productData.code,
  //       version: productData.version,
  //       specification: productData.specification || "",
  //       calibration: productData.calibration.map(val => typeof val === "string" ? { value: val } : val) || [{ value: "" }],

  //     })
  //   } else if (mode === 'create') {
  //     reset({
  //       name: "",
  //       code: '',
  //       version: '',
  //       specification: "",
  //       calibration: [{ value: "" }],
  //     })
  //   }
  // }, [mode, productData?._id, reset])

  const submit = async (data) => {
    data.mode = mode;

    console.log(data)
    if (mode === "create") {
      try {
        const res = await addProduct(data).unwrap()
        reset();
        toast.success(res.msg || `${data.name} is added`)
        dispatch(toggleModal({ name: modalKey, status: false }))
      } catch (error) {
        if (error?.status === 400) {
          toast.warn(error.data.msg || " uhh an error occured")
          return;
        }
        toast.error(error?.data.msg || "Uhh uhh an error occured")
      }
    }
    else if (mode === "update") {
      data.id = productData._id
      const res = await addProduct(data).unwrap()
      reset();
      toast.success(res.msg || `${data.name} is added`)
      dispatch(toggleModal({ name: modalKey, status: false }))
    } else {
      toast.error(`${mode} not available`)
    }
  }

  const productForm = (
    <div className='grid grid-cols-2 gap-x-3 p-3'>
      <div>
        <InputRow id={'name'} register={register} label={'Product Name'} />
        {errors?.name && <p>{errors?.name?.message}</p>}
      </div>

      <div>
        <InputRow id={'specification'} register={register} label={'Specification'} />
        {errors?.specification && <p>{errors?.specification?.message}</p>}
      </div>

      <div className='col-span-2 flex flex-col'>
        {versionFiels.map((field, index) => (
          <div key={field.id} className=''>
            <div className='flex items-end '>
              <div className='flex justify-between w-full gap-2'>
                <div className='w-full'>
                  <InputRow id={`version[${index}].name`} register={register} label={'Version Name'} />
                  {errors?.version?.[index]?.name && <p>{errors?.version?.[index]?.name?.message}</p>}
                </div>
                <div className='w-full'>
                  <InputRow id={`version[${index}].code`} register={register} label={'Unit code'} />
                  {errors?.version?.[index]?.code && <p>{errors?.version?.[index]?.code?.message}</p>}
                </div>
              </div>
              <div className='flex items-center'>
                {versionFiels.length > 1 &&
                  <Button
                    small={true}
                    width={'w-7 aspect-square'}
                    height={'h-7'}
                    label={'-'}
                    color={'bg-red-600'}
                    onClick={() => removeVersion(i)}
                  />
                }
                {versionFiels.length === index + 1 &&
                  <Button
                    small={true}
                    width={'w-7 aspect-square'}
                    height={'h-7'}
                    label={'+'}
                    onClick={() => appendVersion({ name: "", code: "" })}
                  />
                }
              </div>
            </div>
            <CalibrationInput index={index} register={register} />
          </div>
        ))}
      </div>
    </div>
  )

  // const productForm = (
  //   <div className='grid grid-cols-2 gap-x-2 m-1'>
  //     <InputRow register={register} id={'name'} label={'Name'} />
  //     <InputRow register={register} id={'version'} label={'Version'} />
  //     <InputRow register={register} id={'code'} label={'Code'} />
  //     <InputRow register={register} id={'specification'} label={'Specification'} />
  //     <div className='col-span-2 grid grid-cols-2 w-full '>
  //       {fields.map((field, index) => (
  //         <div key={field.id} className='flex items-end w-full'>
  //           <InputRow register={register} id={`calibration.${index}.value`} label={`Calibration - ${index > 0 ? index : ""}`} />
  //           {fields.length > 1 && <div>
  //             <Button disabled={fields.length === 0} label={'-'} height={'p-2'} color={'bg-red-600'} small={true} onClick={() => remove(index)} />
  //           </div>
  //           }
  //           {fields.length - 1 === index &&
  //             <div>
  //               <Button label={'+'} small={true} onClick={() => append()} />
  //             </div>}
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // )
  return (
    <>
      <FormModal
        disabled={addPrLoading}
        isLoading={addPrLoading}
        submitLabel={mode === "create" ? 'Add Product' : "Update Product"}
        title={mode === "create" ? 'Add Product' : "Update Product"}
        onSubmit={handleSubmit(submit)}
        formBody={productForm}
        handleClose={() => dispatch(toggleModal({ name: modalKey, status: false }))}
        open={!!isModalOpen?.[modalKey]}
      />
    </ >
  )
}

export default ProductModal

function CalibrationInput({ index, register, }) {
  const { fields: calibrationFields, append: appendCalibration, remove: removeCalibration } = useFieldArray({ control, name: "calibration" })

  return (<div className='col-span-2 flex flex-col items-end'>
    {calibrationFields.map((field, i) => (
      <div key={field.id} className='w-full flex items-end'>
        <div className='w-full'>
          <InputRow
            id={`calibration.${i}.value`}
            register={register}
            label={`Product calibration ${i + 1}`}
          />
          {errors?.calibration?.[i]?.value && (
            <p className="text-red-500 ">{errors?.calibration?.[i]?.value?.message}</p>
          )}
        </div>

        {calibrationFields.length > 1 &&
          < div className='ml-auto'>
            <Button
              small={true}
              width={'w-7 aspect-square'}
              height={'h-7'}
              label={'-'}
              color={'bg-red-600'}
              onClick={() => removeCalibration(i)}
            />
          </div>}
        {calibrationFields.length === i + 1 &&
          <div className='ml-auto'>
            <Button
              small={true}
              width={'w-7 aspect-square'}
              height={'h-7'}
              label={'+'}
              onClick={() => appendCalibration("")}
            />
          </div>
        }
      </div>
    ))}
  </div>)
}