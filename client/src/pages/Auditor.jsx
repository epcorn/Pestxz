import { toast } from "react-toastify";
import AuditorForm from "../components/auditor/AuditorForm";
import { useForm } from "react-hook-form";

function Auditor() {
  const {
    register,
    control,
    setValue,
    watch,
    handleSubmit,
  } = useForm();

  const onSubmit = (data) => {
    Object.entries(data).forEach(([key, value]) => {
    console.log(key, value);
  });
  };

  return (
    <form id="audit-form"
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-6xl bg-gray-100 mx-auto space-y-4"
    >
      {/* Header */}
      <div className="sticky top-22 bg-gray-100 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 py-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Audit Assessment
          </h1>

          <p className="text-xs text-gray-500">
            {new Date().toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}
          </p>
        </div>

        <button
          form="audit-form"
          type="submit"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-md transition"
        >
          Submit Audit
        </button>
      </div>

      {/* Form Contents */}
      <AuditorForm
        register={register}
        watch={watch}
        setValue={setValue}
        control={control}
      />
    </form>
  );
}

export default Auditor;