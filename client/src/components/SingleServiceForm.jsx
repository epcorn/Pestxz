import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useRegularServiceMutation } from "../redux/serviceSlice";

function SingleServiceForm({
  serviceData = [],
  id,
  setRegular,
}) {
  const [selectedService, setSelectedService] =
    useState(0);

  const [selectedScope, setSelectedScope] =
    useState(0);

  const [selectedConsumable, setSelectedConsumable] =
    useState(0);

  const [form, setForm] = useState({
    usedCalibration: "",
    action: "Done",
    comment: "",
    image: null,
  });

  const [regularService, { isLoading }] =
    useRegularServiceMutation();

  // CURRENT SERVICE
  const currentService =
    serviceData[selectedService];

  // CURRENT SCOPES
  const scopes =
    currentService?.scopes || [];

  // CURRENT SCOPE
  const currentScope =
    scopes[selectedScope];

  // CURRENT CONSUMABLES
  const consumables =
    currentScope?.consumables || [];

  // CURRENT CONSUMABLE
  const currentConsumable =
    consumables[selectedConsumable];

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      usedCalibration: "",
      action: "Done",
      comment: "",
      image: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      formData.append(
        "serviceName",
        currentService?.serviceName || ""
      );

      formData.append(
        "frequency",
        currentService?.frequency || ""
      );

      formData.append(
        "scopeName",
        currentScope?.scopeName || ""
      );

      formData.append(
        "consumableName",
        currentConsumable?.consumableName ||
        ""
      );

      formData.append(
        "calibration",
        currentConsumable?.calibration ||
        ""
      );

      formData.append(
        "usedCalibration",
        form.usedCalibration
      );

      formData.append(
        "action",
        form.action
      );

      formData.append(
        "comment",
        form.comment
      );

      if (form.image) {
        formData.append(
          "image",
          form.image
        );
      }

      const res = await regularService({
        id,
        form: formData,
      }).unwrap();

      toast.success(res.msg);

      resetForm();
    } catch (error) {
      console.log(error);

      toast.error(
        error?.data?.msg || error.error
      );
    }
  };

  return (
    <div className="bg-white border rounded p-4">

      {/* SERVICE */}
      <div className="grid md:grid-cols-3 gap-3 mb-4">

        {/* SERVICE SELECT */}
        <div>
          <label className="text-sm block mb-1">
            Service
          </label>

          <select
            value={selectedService}
            onChange={(e) => {
              setSelectedService(
                Number(e.target.value)
              );

              setSelectedScope(0);
              setSelectedConsumable(0);

              resetForm();
            }}
            className="w-full border rounded p-2"
          >
            {serviceData.map(
              (service, index) => (
                <option
                  key={index}
                  value={index}
                >
                  {service.serviceName}
                </option>
              )
            )}
          </select>
        </div>

        {/* SCOPE */}
        <div>
          <label className="text-sm block mb-1">
            Scope
          </label>

          <select
            value={selectedScope}
            onChange={(e) => {
              setSelectedScope(
                Number(e.target.value)
              );

              setSelectedConsumable(0);

              resetForm();
            }}
            className="w-full border rounded p-2"
          >
            {scopes.map((scope, index) => (
              <option
                key={index}
                value={index}
              >
                {scope.scopeName}
              </option>
            ))}
          </select>
        </div>

        {/* CONSUMABLE */}
        <div>
          <label className="text-sm block mb-1">
            Consumable
          </label>

          <select
            value={selectedConsumable}
            onChange={(e) => {
              setSelectedConsumable(
                Number(e.target.value)
              );

              resetForm();
            }}
            className="w-full border rounded p-2"
          >
            {consumables.map(
              (consumable, index) => (
                <option
                  key={index}
                  value={index}
                >
                  {
                    consumable.consumableName
                  }
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* INFO */}
      <div className="grid md:grid-cols-3 gap-3 mb-4 text-sm">

        <div className="border rounded p-2">
          <p className="text-gray-500">
            Frequency
          </p>

          <p className="font-medium">
            {currentService?.frequency ||
              "-"}
          </p>
        </div>

        <div className="border rounded p-2">
          <p className="text-gray-500">
            Calibration
          </p>

          <p className="font-medium">
            {currentConsumable?.calibration ||
              "-"}
          </p>
        </div>

        <div className="border rounded p-2">
          <p className="text-gray-500">
            Service
          </p>

          <p className="font-medium">
            {currentService?.serviceName ||
              "-"}
          </p>
        </div>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        {/* USED CALIBRATION */}
        <div>
          <label className="text-sm block mb-1">
            Used Calibration
          </label>

          <input
            type="text"
            value={form.usedCalibration}
            onChange={(e) =>
              handleChange(
                "usedCalibration",
                e.target.value
              )
            }
            placeholder="Enter used calibration"
            className="w-full border rounded p-2"
          />
        </div>

        {/* ACTION */}
        <div>
          <label className="text-sm block mb-1">
            Action
          </label>

          <select
            value={form.action}
            onChange={(e) =>
              handleChange(
                "action",
                e.target.value
              )
            }
            className="w-full border rounded p-2"
          >
            <option value="Done">
              Done
            </option>

            <option value="Not Done">
              Not Done
            </option>

            <option value="Partial Done">
              Partial Done
            </option>
          </select>
        </div>

        {/* COMMENT */}
        <div>
          <label className="text-sm block mb-1">
            Comment
          </label>

          <textarea
            rows={3}
            value={form.comment}
            onChange={(e) =>
              handleChange(
                "comment",
                e.target.value
              )
            }
            placeholder="Enter comment"
            className="w-full border rounded p-2 resize-none"
          />
        </div>

        {/* IMAGE */}
        <div>
          <label className="text-sm block mb-1">
            Upload Image
          </label>

          <input
            type="file"
            onChange={(e) =>
              handleChange(
                "image",
                e.target.files[0]
              )
            }
            className="w-full border rounded p-2"
          />
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3 pt-2">

          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-600 text-white px-5 py-2 rounded"
          >
            {isLoading
              ? "Submitting..."
              : "Submit"}
          </button>

          <button
            type="button"
            onClick={() =>
              setRegular(false)
            }
            className="bg-red-600 text-white px-5 py-2 rounded"
          >
            Close
          </button>
        </div>
      </form>
    </div>
  );
}

export default SingleServiceForm;