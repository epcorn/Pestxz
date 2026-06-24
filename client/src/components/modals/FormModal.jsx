import { useState, useEffect } from "react";
import Button from "../Button";

const FormModal = ({ title, formBody, submitLabel, onSubmit, handleClose, disabled, isLoading, open }) => {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      window.focus();
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
      setTimeout(() => setMounted(false), 300);
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 flex justify-center z-50 items-center transition-colors ${visible ? "visible bg-black/20" : "invisible"}`}>
      <div className={`bg-white rounded-xl max-w-4xl max-h-[90dvh] flex flex-col shadow p-2 md:p-5 m-3 transition-opacity duration-300 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-125"}`}>
        <h2 className="text-2xl font-medium text-center text-green-500 mb-3 shrink-0">
          {title}
        </h2>
        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 pr-1">{formBody}</div>
          <div className="grid grid-cols-2 gap-2 mt-4 shrink-0">
            <Button type="submit" label={submitLabel} disabled={disabled} color="bg-green-500" isLoading={isLoading} />
            <Button label="Cancel" disabled={disabled} color="bg-red-500" onClick={handleClose} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormModal;