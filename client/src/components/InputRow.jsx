const InputRow = ({
  label,
  register,
  name,
  id,
  onchange,
  placeholder,
  required = true,
  type = "text",
  disabled = false,
  cls = "mt-2",
  inputCls,
  min,
  ...args
}) => {

  return (
    <div className={`relative ${cls}`}>
      <label
        htmlFor={type === "radio" ? name : id}
        className="block text-md font-medium leading-6 text-gray-900"
      >
        {label}
        {required && (
          <span className="text-red-500 required-dot ml-0.5">*</span>
        )}
      </label>
      <input
        type={type}
        id={type === "radio" ? name : id}
        disabled={disabled}
        min={min}
        className={`mt-0.5 w-full py-0.5 px-2 border-2 rounded-md outline-none transition border-neutral-400 focus:border-black disabled:bg-slate-100 ${inputCls}`}
        placeholder={placeholder}
        {...register(id, { required: required, onChange: onchange })}
        {...args}
      />
    </div>
  );
};
export default InputRow;
