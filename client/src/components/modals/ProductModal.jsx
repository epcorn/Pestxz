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

  const [addProduct, { isLoading: addPrLoading }] = useAddProductsMutation();

  const { control, formState: { errors }, register, reset, handleSubmit } = useForm({
    defaultValues: {
      name: "",
      specification: "",
      version: [{
        name: "", code: "",
        calibration: [{ value: "" }],
      }]
    }
  });

  const { fields: versionFields, append: appendVersion, remove: removeVersion } = useFieldArray({
    control,
    name: "version"
  })

  useEffect(() => {
    if (mode === 'update' && productData) {
      reset({
        name: productData.name || "",
        specification: productData.specification || "",
        version: (productData.version || [{ name: "", code: "", calibration: [{ value: "" }] }])
          .map(v => ({
            ...v,
            calibration: (v.calibration || []).map(c => typeof c === "string" ? { value: c } : c)
          }))
      })
    } else if (mode === 'create') {
      reset({
        name: "",
        specification: "",
        version: [{ name: "", code: "", calibration: [{ value: "" }] }]
      })
    }
  }, [mode, productData?._id, reset])

  const submit = async (data) => {
    data.mode = mode;
    if (mode === "create") {
      console.log(data)
      try {
        const res = await addProduct(data).unwrap()
        reset();
        toast.success(res.msg || `${data.name} is added`)
        dispatch(toggleModal({ name: modalKey, status: false }))
      } catch (error) {
        if (error?.status === 400) {
          toast.warn(error.data.msg || "an error occured")
          return;
        }
        toast.error(error?.data?.msg || "an error occured")
      }
    } else if (mode === "update") {
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

      <div className='col-span-2 flex flex-col gap-2'>
        {versionFields.map((field, i) => (
          <div key={field.id} className='flex flex-col outline outline-gray-400 rounded pb-2 p-1 m-1 mb-2'>
            <div className='flex items-end'>
              <div className='flex justify-between w-full gap-2'>
                <div className='w-full'>
                  <InputRow id={`version.${i}.name`} register={register} label={'Version Name'} />
                  {errors?.version?.[i]?.name && <p>{errors.version[i].name.message}</p>}
                </div>
                <div className='w-full'>
                  <InputRow id={`version.${i}.code`} register={register} label={'Unit code'} />
                  {errors?.version?.[i]?.code && <p>{errors.version[i].code.message}</p>}
                </div>
              </div>
              <div className='flex items-center'>
                {versionFields.length > 1 &&
                  <Button small width={'w-7 aspect-square'} height={'h-7'} label={'-'} color={'bg-red-600'}
                    onClick={() => removeVersion(i)} />
                }
                {versionFields.length === i + 1 &&
                  <Button small width={'w-7 aspect-square'} height={'h-7'} label={'+'}
                    onClick={() => appendVersion({ name: "", code: "", calibration: [{ value: "" }] })} />
                }
              </div>
            </div>

            <CalibrationFields
              control={control}
              register={register}
              errors={errors}
              nestIndex={i}
            />
          </div>
        ))}
      </div>
    </div>
  )

  return (
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
  )
}

export default ProductModal

function CalibrationFields({ control, register, errors, nestIndex }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `version.${nestIndex}.calibration`
  })

  return (
    <div className='grid grid-cols-2'>
      {fields.map((field, i) => (
        <div key={field.id} className='w-full flex items-end'>
          <div className='w-full'>
            <InputRow
              id={`version.${nestIndex}.calibration.${i}.value`}
              register={register} required={false}
              label={`Calibration ${i + 1}`}
            />
            {errors?.version?.[nestIndex]?.calibration?.[i]?.value && (
              <p className="text-red-500">
                {errors.version[nestIndex].calibration[i].value.message}
              </p>
            )}
          </div>

          {fields.length > 1 &&
            <div className='ml-auto'>
              <Button small width={'w-7 aspect-square'} height={'h-7'} label={'-'} color={'bg-red-600'}
                onClick={() => remove(i)} />
            </div>
          }
          {fields.length === i + 1 &&
            <div className='ml-auto'>
              <Button small width={'w-7 aspect-square'} height={'h-7'} label={'+'}
                onClick={() => append({ value: "" })} />
            </div>
          }
        </div>
      ))}
    </div>
  )
}