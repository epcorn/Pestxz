import Select from "react-select";

const InputSelect = ({
  onChange,
  options = [],
  value,
  placeholder,
  label,
  isMulti = false,
  isClearable = true,
  menuPortalTarget,
  menuPosition,
}) => {

  const getSelectValue = () => {
    if (!value) return isMulti ? [] : null;

    if (isMulti) {
      return Array.isArray(value) ? value : [];
    }

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
        menuPortalTarget={menuPortalTarget}
        menuPosition={menuPosition}
        value={getSelectValue()}
        onChange={(val) => onChange(val)}
        styles={
          !isMulti
            ? {

    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
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
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
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