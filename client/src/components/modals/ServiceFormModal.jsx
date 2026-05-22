import React, { useState } from "react";
import { toast } from "react-toastify";

function ServiceFormModal({ addService }) {

  const [disable, setDisable] = useState(false)
  const [serviceData, setServiceData] = useState({
    serviceName: "",
    scopes: [
      {
        scopeName: "",
        consumables: [
          {
            name: "",
            calibration: {
              limit: "",
              used: "",
            },
          },
        ],
      },
    ],
  });

  /* ---------------- SERVICE ---------------- */

  const handleServiceName = (value) => {
    setServiceData((prev) => ({
      ...prev,
      serviceName: value,
    }));
  };

  /* ---------------- SCOPE ---------------- */

  const handleScopeChange = (scopeIndex, value) => {
    const updatedScopes = [...serviceData.scopes];

    updatedScopes[scopeIndex].scopeName = value;

    setServiceData((prev) => ({
      ...prev,
      scopes: updatedScopes,
    }));
  };

  const addScope = () => {
    setServiceData((prev) => ({
      ...prev,
      scopes: [
        ...prev.scopes,
        {
          scopeName: "",
          consumables: [
            {
              name: "",
              calibration: {
                limit: "",
                used: "",
              },
            },
          ],
        },
      ],
    }));
  };

  /* ---------------- CONSUMABLE ---------------- */

  const handleConsumableChange = (
    scopeIndex,
    consumableIndex,
    value
  ) => {
    const updatedScopes = [...serviceData.scopes];

    updatedScopes[scopeIndex].consumables[consumableIndex].name =
      value;

    setServiceData((prev) => ({
      ...prev,
      scopes: updatedScopes,
    }));
  };

  const addConsumable = (scopeIndex) => {
    const updatedScopes = [...serviceData.scopes];

    updatedScopes[scopeIndex].consumables.push({
      name: "",
      calibration: {
        limit: "",
        used: "",
      },
    });

    setServiceData((prev) => ({
      ...prev,
      scopes: updatedScopes,
    }));
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const filteredScopes = serviceData.scopes.filter(scope => scope.scopeName.trim() !== "")

    const data = {
      ...serviceData, scopes: filteredScopes,
    }

    console.log(data)
    try {
      const res = await addService({ data }).unwrap();
      console.log(res)
      console.log(data);
      toast.success(res.msg)
    } catch (error) {
      console.log(error)
      toast.error(error.data.msg || error.error)
    }
  };

  /* ---------------- RESET ---------------- */

  const handleReset = () => {
    setServiceData({
      serviceName: "",
      scopes: [
        {
          scopeName: "",
          consumables: [
            {
              name: "",
              calibration: {
                limit: "",
                used: "",
              },
            },
          ],
        },
      ],
    });
  };

  return (
    <div>


      <form
        onSubmit={handleSubmit}
        className="mx-auto bg-white border border-gray-400 rounded-lg p-4 space-y-3"
      >
        {/* SERVICE */}

        <div>
          <label className="text-sm font-medium mb-1 block">
            Service Name
          </label>

          <input
            type="text"
            placeholder="Pest Control"
            value={serviceData.serviceName}
            onChange={(e) => handleServiceName(e.target.value)}
            className="w-full border border-gray-400 rounded px-3 py-2 text-sm outline-none focus:border-green-600"
          />
        </div>

        {/* SCOPES */}

        {serviceData.scopes.map((scope, scopeIndex) => (
          <div
            key={scopeIndex}
            className="border border-gray-400 rounded-md p-3 bg-gray-50 space-y-2"
          >
            {/* TOP */}

            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold">
                Scope {scopeIndex + 1}
              </p>

              <button
                type="button"
                onClick={() => addConsumable(scopeIndex)}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
              >
                + Consumable
              </button>
            </div>

            {/* INPUTS */}

            <div className="grid grid-cols-2 gap-2">
              {/* Scope */}

              <input
                type="text"
                placeholder="Scope Name"
                value={scope.scopeName}
                onChange={(e) =>
                  handleScopeChange(scopeIndex, e.target.value)
                }
                className="border border-gray-400 rounded px-3 py-2 text-sm outline-none focus:border-green-600"
              />

              {/* Consumables */}

              <div className="space-y-2">
                {scope.consumables.map(
                  (consumable, consumableIndex) => (
                    <input
                      key={consumableIndex}
                      type="text"
                      placeholder="Consumable Name"
                      value={consumable.name}
                      onChange={(e) =>
                        handleConsumableChange(
                          scopeIndex,
                          consumableIndex,
                          e.target.value
                        )
                      }
                      className="w-full border border-gray-400 rounded px-3 py-2 text-sm outline-none focus:border-green-600"
                    />
                  )
                )}
              </div>
            </div>
          </div>
        ))}

        {/* ACTIONS */}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={addScope}
            className="bg-yellow-500 text-white px-3 py-2 rounded text-sm"
          >
            + Scope
          </button>

          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded text-sm"
          >
            Submit
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="bg-gray-500 text-white px-4 py-2 rounded text-sm"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}

export default ServiceFormModal;