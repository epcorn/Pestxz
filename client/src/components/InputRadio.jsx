import React from 'react'

function InputRadio({ disabled, label, name, register, id, value, onchange, placeholder, status, block = true }) {
  return (
    <div className={`${block ? "grid " : "flex items-center "} w-fit`}>
      <input
        type="radio"
        id={id}
        value={value}
        disabled={disabled}
        {...register(name, { onChange: onchange })}
      />
      <label htmlFor={id} className='ml-1 wrap-break-word'>{label}
        {/* {required && <span className='text-red-600'>*</span>} */}
      </label>
    </div>

  )
}

export default InputRadio