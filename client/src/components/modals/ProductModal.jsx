import React, { useState } from 'react'
import InputRow from '../InputRow'
import { useForm } from 'react-hook-form'
import Button from '../Button'
import { useDispatch } from 'react-redux'
import { toggleModal } from '../../redux/helperSlice'

function ProductModal() {
  const dispatch = useDispatch();
  const [add, setAdd] = useState({ status: false, calCount: 1, verCount: 1, })
  const { control, formState: { errors }, register, reset, handleSubmit, watch } = useForm();

  console.log(add.verCount)
  return (
    <div className='fixed inset-0 w-full h-full bg-black/60 content-center z-50'>
      <form action="" className='bg-white p-2 max-w-xl mx-auto'>
        <div className="bg-white flex justify-between items-center border-b pb-2 p-2">
          <h2 className="text-lg font-bold">Add Product </h2>
          <p className="w-7 h-7 outline font-black text-red-600 text-center rounded-full leading-none cursor-pointer content-center"
            onClick={() => dispatch(toggleModal({ name: "products", status: false }))}>X</p>
        </div>
        <div className='grid grid-cols-2 gap-x-3 p-3'>
          <div>
            <InputRow id={'name'} register={register} label={'Product Name'} />
            {errors.name && <p>{errors.message}</p>}
          </div>

          <div>
            <InputRow id={'specification'} register={register} label={'Specification'} />
            {errors.name && <p>{errors.message}</p>}
          </div>

          <div className='flex flex-col'>
            {Array.from({ length: add.verCount }).map((_, i) => (
              <div key={i} className='flex items-end'>
                <div className='w-full'>
                  <InputRow id={'version'} register={register} label={'Product version'} />
                  {errors.version && <p>{errors.message}</p>}
                </div>
                <div className='flex items-center'>
                  {add.verCount > 1 &&
                    <Button
                      small={true}
                      width={'w-7 aspect-square'}
                      height={'h-7'}
                      label={'-'}
                      color={'bg-red-600'}
                      onClick={() => setAdd(prev => ({ ...prev, verCount: prev.verCount === 1 ? 1 : prev.verCount - 1 }))}
                    />
                  }
                  {add.verCount === i + 1 &&
                    <Button
                      small={true}
                      width={'w-7 aspect-square'}
                      height={'h-7'}
                      label={'+'}
                      onClick={() => setAdd(prev => ({ ...prev, verCount: prev.verCount + 1 }))}
                    />
                  }
                </div>
              </div>
            ))}
          </div>
          <div>
            <InputRow id={'code'} register={register} label={'Unit code'} />
            {errors.code && <p>{errors.message}</p>}
          </div>

          <div className='col-span-2 flex flex-col items-end'>
            {Array.from({ length: add.calCount }).map((_, i) => (
              <div key={i} className='w-full flex items-end'>
                <div className='w-full'>
                  <InputRow
                    id={`calibration${i + 1}`}
                    register={register}
                    label={`Product calibration ${i + 1}`}
                  />
                  {errors.calibration?.[i + 1] && (
                    <p className="text-red-500 ">{errors.calibration[i + 1]?.message}</p>
                  )}
                </div>

                {add.calCount > 1 &&
                  < div className='ml-auto'>
                    <Button
                      small={true}
                      width={'w-7 aspect-square'}
                      height={'h-7'}
                      label={'-'}
                      color={'bg-red-600'}
                      onClick={() => setAdd(prev => ({ ...prev, calCount: prev.calCount - 1 }))}
                    />
                  </div>}
                {add.calCount === i + 1 &&
                  <div className='ml-auto'>
                    <Button
                      small={true}
                      width={'w-7 aspect-square'}
                      height={'h-7'}
                      label={'+'}
                      onClick={() => setAdd(prev => ({
                        ...prev, calCount
                          : prev.calCount + 1
                      }))}
                    />
                  </div>
                }
              </div>
            ))}

          </div>
        </div>


      </form >
    </div >
  )
}

export default ProductModal