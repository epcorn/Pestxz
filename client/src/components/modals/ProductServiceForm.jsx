import React, { useState } from 'react'
import { formatShortDate } from '../../utils/helperFunctions'
import BoxStatus from '../product_service/BoxStatus'
import { useForm } from 'react-hook-form'
import Button from '../Button'
import InputRow from '../InputRow'

function ProductServiceForm({ products }) {
  const [formState, setFormState] = useState({})

  const today = new Date().toISOString().split("T")[0]
  const todaySchedulesDates = products?.flatMap(p => p?.schedule?.find(sc => sc.date === today && !sc.completed)) || []

  const handleStatusChange = (productId, fieldName, value) => {
    setFormState(prev => ({ ...prev, [`${productId}-${fieldName}`]: value }))
  }

  const { control, handleSubmit, formState: { errors }, watch, register } = useForm({ defaultValues: { check: {} } })

  const checkWatch = watch("check")
  console.log(products)
  const submit = (data) => {
    console.log(data)
  }
  return (
    <div className='bg-slate-300 max-w-2xl border-2 rounded-lg mx-auto p-2 md:p-5'>
      <div>
        <h3 className='font-semibold text-lg mb-3'>Product Service form</h3>
      </div>
      <div className='flex hidden items-center gap-2 my-3'>
        <strong> Next Product Service Dates: </strong>
        {todaySchedulesDates?.map((d, i) => (
          <p key={i}>{formatShortDate(d?.date)}</p>
        ))}
      </div>

      <div className='space-y-2 outline rounded bg-white p-1 max-h-80 overflow-y-auto'>
        {products?.map(pr => {
          // Read local flat state keys cleanly with default values
          const currentStatus = formState[`${pr.productId}-status`] || 'missing'
          const currentQuality = formState[`${pr.productId}-quality`] || 'ok'

          return (
            <div key={pr.productId} className='outline outline-gray-400 p-2 rounded'>
              <div className='grid grid-cols-2 text-lg mb-3'>
                <p>Product Name: <strong>{pr.productName}</strong></p>
                <p>Version: <strong>{pr.versionName}</strong></p>
                <p>Frequency: <strong>{pr.frequency}</strong></p>
                <p>Specification: <strong>{pr.specification}</strong></p>
              </div>
              <BoxStatus
                handleStatusChange={handleStatusChange}
                id={pr.productId}
                currentStatus={currentStatus}
                currentQuality={currentQuality}
              />

              {/* Dynamic check conditionally rendered based on status and quality */}
              <form onSubmit={handleSubmit(submit)}>
                {currentStatus === "found" && currentQuality !== "ok" && (
                  <ul className='m-2'>
                    <h3 className='text-lg font-semibold'>Update Service Records:</h3>
                    {pr.calibrations?.map((c, index) => {

                      return (
                        <li key={index} className='flex items-center gap-2 ml-5'>
                          <input
                            type="checkbox"
                            value={c}
                            id={`check.${c}`}
                            {...register(`check.${pr.productId}`)}
                          />
                          <label htmlFor={`check.${c}`}>Reload: {c}</label>
                        </li>
                      )
                    })}
                    <li className='max-w-1/2'>
                      <InputRow register={register} id={'comment'} label={'Comment'} />
                    </li>
                  </ul>
                )}
                <div className='text-right mt-5'>
                  <Button label={'Submit'} />
                </div>
              </form>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProductServiceForm