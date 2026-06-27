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

  const { control, formState: { errors }, register, reset, handleSubmit, watch } = useForm({
    defaultValues: {
      name: "",
      specification: "",
      calibration: [{ value: "" }],
      version: [{ name: "", code: "" }]
    }
  });

  const { fields: versionFiels, append: appendVersion, remove: removeVersion } = useFieldArray({
    control,
    name: "version"
  })
  const { fields: calibrationFields, append: appendCalibration, remove: removeCalibration } = useFieldArray({ control, name: "calibration" })

  useEffect(() => {
    if (mode === 'update' && productData) {
      reset({
        name: productData.name || "",
        specification: productData.specification || "",
        calibration: productData.calibration.map(val => typeof val === "string" ? { value: val } : val) || [{ value: "" }],
        version: productData.version || [{ name: "", code: "" }]
      })
    } else if (mode === 'create') {
      reset({
        name: "",
        specification: "",
        calibration: [{ value: "" }],
        version: [{ name: "", code: "" }]
      })
    }
  }, [mode, productData, reset])

  const submit = async (data) => {
    data.mode = mode;

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
        {versionFiels.map((field, i) => (
          <div key={field.id} className='flex items-end '>
            <div className='flex justify-between w-full gap-2'>
              <div className='w-full'>
                <InputRow id={`version[${i}].name`} register={register} label={'Version Name'} />
                {errors?.version?.[i]?.name && <p>{errors?.version?.[i]?.name?.message}</p>}
              </div>
              <div className='w-full'>
                <InputRow id={`version[${i}].code`} register={register} label={'Unit code'} />
                {errors?.version?.[i]?.code && <p>{errors?.version?.[i]?.code?.message}</p>}
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
              {versionFiels.length === i + 1 &&
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
        ))}
      </div>
      <div className='col-span-2 flex flex-col items-end'>
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
      </div>
    </div>)

  const updateProductForm = (
    <div>

    </div>
  )
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