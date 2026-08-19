import Select from "react-select";

const InputSelect = ({
  onChange,
  options = [],
  value,
  placeholder,
  label,
  disable = false,
  isMulti = false,
  isClearable = true,
  required = true
}) => {

  const getSelectValue = () => {
    if (!value) return isMulti ? [] : null;
    if (isMulti) return Array.isArray(value) ? value : [];
    return options?.find((c) => c.value === value?.value) || [{ value: "", label: "" }];
  };

  const sharedStyles = {
    menuPortal: (base) => ({ ...base, zIndex: 99999 }),
    menu: (base) => ({ ...base, zIndex: 99999 }),
  };

  const singleStyles = {
    ...sharedStyles,
    control: (baseStyles, state) => ({
      ...baseStyles,
      minHeight: "31px",
      height: "32px",
      boxShadow: "none",
      marginTop: "2px",
      borderColor: state.isFocused ? "#6366f1" : "#CCCCCC",
      borderWidth: "2px",
      "&:hover": { borderColor: "#6366f1" },
    }),
    valueContainer: (provided) => ({ ...provided, height: "30px", padding: "0 5px" }),
    input: (provided) => ({ ...provided, margin: "0px" }),
    indicatorsContainer: (provided) => ({ ...provided, height: "31px" }),
  };

  const multiStyles = {
    ...sharedStyles,
    control: (baseStyles, state) => ({
      ...baseStyles,
      boxShadow: "none",
      marginTop: "2px",
      borderColor: state.isFocused ? "#6366f1" : "#CCCCCC",
      borderWidth: "2px",
      "&:hover": { borderColor: "#6366f1" },
    }),
  };

  return (
    <div className="mt-2">
      {label && (
        <label className="block text-md font-medium leading-6 text-gray-900">
          {label}
          {required &&
            <span className="text-red-500 ml-0.5">*</span>
          }
        </label>
      )}
      <Select
        required={required}
        placeholder={placeholder}
        isMulti={isMulti}
        isDisabled={disable}
        className="basic-multi-select"
        isClearable={isClearable}
        options={options}
        menuPlacement="auto"
        menuPortalTarget={document.body}
        menuPosition="fixed"
        value={getSelectValue()}
        onChange={(val) => onChange(val)}
        styles={isMulti ? multiStyles : singleStyles}
      />
    </div>
  );
};

export default InputSelect;