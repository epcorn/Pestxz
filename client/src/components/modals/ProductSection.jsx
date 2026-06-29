import React from 'react'
import Button from '../Button'
import { Controller } from 'react-hook-form'
import InputSelect from '../InputSelect'
import InputRow from '../InputRow'

function ProductSection({ control, register, errors, versions, allProducts, prFrequency, productinfo }) {
  return (
    <div className="col-span-3 outline outline-gray-400 rounded m-1 p-1 ">
      <div className=" flex justify-between items-center">
        <h3 className="font-semibold text-lg">Select Products </h3>
        <Button label={'Add Products'} color={'bg-white'} text={'text-black border'} />
      </div>
      <div className="grid grid-cols-3 gap-x-2">
        <div>
          <Controller
            name="product"
            control={control}
            rules={{ required: "Product is required" }}
            render={({ field }) => (
              <InputSelect
                isMulti={false}
                options={allProducts}
                onChange={field.onChange}
                value={field.value}
                label="Select Product"
              />
            )}
          />
          <p className="text-xs text-red-500 pl-1 mt-1">
            {errors.product?.message}
          </p>
        </div>
        <div>
          <Controller
            name="version"
            control={control}
            rules={{ required: "Version is required" }}
            render={({ field }) => (
              <InputSelect
                isMulti={false}
                options={versions}
                onChange={field.onChange}
                value={field.value}
                label="Select Version"
              />
            )}
          />
          <p className="text-xs text-red-500 pl-1 mt-1">
            {errors.version?.message}
          </p>
        </div>
        <div>
          <InputRow label={'Code'} id={"code"} register={register} disabled={true} />
        </div>
        <div>
          <Controller
            name="frequency"
            control={control}
            rules={{ required: "Frequency is required" }}
            render={({ field }) => (
              <InputSelect
                isMulti={false}
                options={prFrequency}
                onChange={field.onChange}
                value={field.value}
                label="Product Frequency"
              />
            )}
          />
          <p className="text-xs text-red-500 pl-1 mt-1">
            {errors.frequency?.message}
          </p>
        </div>
        <div>
          <InputRow register={register} label={'Specification'} disabled={true} id={'specification'} />
        </div>
        <div className="col-span-3 grid grid-cols-2">

          {productinfo?.calibrations?.map((cal, i) => (
            <div key={`calibration.${i}`} className="flex items-center gap-2">
              <input type="checkbox"
                id={`calibration.${i}`}
                value={cal}
                {...register(`calibrations`)}
              />
              <label htmlFor={`calibration.${i}`}>{cal}</label>
            </div>
          ))}
        </div>
        <div>
        </div>
      </div>
    </div>
  )
}

export default ProductSection