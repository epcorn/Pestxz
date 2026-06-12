import LoadingSpinner from "./LoadingSpinner";

const Button = ({
  label,
  onClick,
  type = "button",
  disabled,
  small,
  color,
  height,
  isLoading,
  width
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        disabled:opacity-70
        disabled:cursor-not-allowed
        rounded-lg
        leading-none
        hover:opacity-80
        transition
        m-1 w-fit
        text-white
        ${width && width}
        ${height ? height : "h-8"}
        ${color ? color : "bg-blue-500"}
        ${small ? "text-sm" : "text-md"}
        ${small ? "px-2" : "px-4"}
        ${small ? "font-medium" : "font-semibold"}
      `}
    >
      {label} {isLoading && <LoadingSpinner />}
    </button>
  );
};
export default Button;
