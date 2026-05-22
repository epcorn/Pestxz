import Select from "react-select";

const InputSelect = ({
  onChange,
  options = [],
  value,
  placeholder,
  label,
  isMulti = false,
  isClearable = true
}) => {

  // Dynamically resolve the value prop so react-select understands multi-select arrays
  const getSelectValue = () => {
    if (!value) return isMulti ? [] : null;
    
    if (isMulti) {
      // If it's multi-select, value is already an array of selected options
      return Array.isArray(value) ? value : [];
    }
    
    // Single select matching logic
    return options?.find((c) => c.value === value?.value) || null;
  };

  return (
    <div className="mt-2">
      <label className="block text-md font-medium leading-6 text-gray-900">
        {label}
        <span className="text-red-500 ml-0.5">*</span>
      </label>
      <Select
        placeholder={placeholder}
        isMulti={isMulti}
        className="basic-multi-select"
        isClearable={isClearable}
        options={options}
        menuPlacement="auto"
        value={getSelectValue()} // Fixed: Safely computes value arrays vs single values
        onChange={(val) => onChange(val)}
        styles={
          !isMulti
            ? {
              control: (baseStyles, state) => ({
                ...baseStyles,
                minHeight: "31px",
                height: "32px",
                boxShadow: state.isFocused ? null : null,
                marginTop: "2px",
                borderColor: "#CCCCCC",
                borderWidth: "2px",
                paddingTop: "0px",
              }),

              valueContainer: (provided, state) => ({
                ...provided,
                height: "30px",
                padding: "0 5px",
              }),

              input: (provided, state) => ({
                ...provided,
                margin: "0px",
              }),

              indicatorsContainer: (provided, state) => ({
                ...provided,
                height: "31px",
              }),
            }
            : {
              control: (baseStyles, state) => ({
                ...baseStyles,
                boxShadow: state.isFocused ? null : null,
                marginTop: "2px",
                borderColor: "#CCCCCC",
                borderWidth: "2px",
                paddingTop: "0px",
              }),
            }
        }
      />
    </div>
  );
};

export default InputSelect;