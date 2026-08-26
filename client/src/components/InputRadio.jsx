import React from 'react'

function InputRadio({ disabled, label, name, register, id, value, onchange, placeholder, status, block = true, errors, args }) {
  return (
    <>
      <div className={`${block ? "grid " : "flex items-center "} w-fit`}>
        <input
          type="radio"
          id={id}
          value={value}
          disabled={disabled}
          {...register(name, { onChange: onchange })}
          {...args}
        />
        <label htmlFor={id} className='ml-1 wrap-break-word'>{label}
        </label>

      </div>
      {errors?.id && <p className='text-red-600'>Please select option</p>}
    </>
  )
}

export default InputRadio