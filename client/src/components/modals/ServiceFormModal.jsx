import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";

function ServiceFormModal({ addService }) {
  const [disable, setDisable] = useState(false);
  const [serviceData, setServiceData] = useState({
    serviceName: "",
    scopes: [
      {
        scopeName: "",
        consumables: [
          {
            name: "",
          },
        ],
      },
    ],
  });

  // 1. Ref to track the container holding all scopes
  const formContainerRef = useRef(null);
  // 2. State to track which scope and consumable index needs focus
  const [focusTarget, setFocusTarget] = useState(null);

  // 3. Effect to handle focusing when a new consumable is added
  useEffect(() => {
    if (focusTarget && formContainerRef.current) {
      const { scopeIndex, consumableIndex } = focusTarget;
      // Find the specific input using a data attribute selector
      const selector = `[data-scope="${scopeIndex}"][data-consumable="${consumableIndex}"]`;
      const inputToFocus = formContainerRef.current.querySelector(selector);

      if (inputToFocus) {
        inputToFocus.focus();
      }
      // Reset the target state after focusing
      setFocusTarget(null);
    }
  }, [focusTarget]);

  /* ---------------- SERVICE ---------------- */
  const handleServiceName = (value) => {
    setServiceData((prev) => ({ ...prev, serviceName: value }));
  };

  /* ---------------- SCOPE ---------------- */
  const handleScopeChange = (scopeIndex, value) => {
    const updatedScopes = [...serviceData.scopes];
    updatedScopes[scopeIndex].scopeName = value;
    setServiceData((prev) => ({ ...prev, scopes: updatedScopes }));
  };

  const addScope = () => {
    setServiceData((prev) => ({
      ...prev,
      scopes: [
        ...prev.scopes,
        {
          scopeName: "",
          consumables: [{ name: "" }],
        },
      ],
    }));
  };

  /* ---------------- CONSUMABLE ---------------- */
  const handleConsumableChange = (scopeIndex, consumableIndex, value) => {
    const updatedScopes = [...serviceData.scopes];
    updatedScopes[scopeIndex].consumables[consumableIndex].name = value;
    setServiceData((prev) => ({ ...prev, scopes: updatedScopes }));
  };

  const addConsumable = (scopeIndex) => {
    const updatedScopes = [...serviceData.scopes];
    updatedScopes[scopeIndex].consumables.push({ name: "" });

    // Calculate the index of the newly added consumable item
    const newConsumableIndex = updatedScopes[scopeIndex].consumables.length - 1;

    setServiceData((prev) => ({ ...prev, scopes: updatedScopes }));

    // 4. Set the focus target to trigger the useEffect hook
    setFocusTarget({ scopeIndex, consumableIndex: newConsumableIndex });
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const confirm = window.confirm("Please confirm to submit");
    if (!confirm) return;
    const filteredScopes = serviceData.scopes.filter(
      (scope) => scope.scopeName.trim() !== ""
    );
    const data = { ...serviceData, scopes: filteredScopes };
    try {
      console.log(data);
      const res = await addService(data).unwrap();
      toast.success(res?.msg || "Service added successfully");
      handleReset();
    } catch (error) {
      console.log(error);
      toast.error(error.data.msg || error.error);
    }
  };

  /* ---------------- RESET ---------------- */
  const handleReset = () => {
    setServiceData({
      serviceName: "",
      scopes: [
        {
          scopeName: "",
          consumables: [{ name: "" }],
        },
      ],
    });
  };

  return (
    // 5. Attach the ref to the parent container element
    <div ref={formContainerRef}>
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
              <p className="text-sm font-semibold">Scope {scopeIndex + 1}</p>
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
                onChange={(e) => handleScopeChange(scopeIndex, e.target.value)}
                className="border border-gray-400 rounded px-3 py-2 text-sm outline-none focus:border-green-600"
              />

              {/* Consumables */}
              <div className="space-y-2">
                {scope.consumables.map((consumable, consumableIndex) => (
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
                    // 6. Add dynamic data attributes to find the input in DOM
                    data-scope={scopeIndex}
                    data-consumable={consumableIndex}
                    className="w-full border border-gray-400 rounded px-3 py-2 text-sm outline-none focus:border-green-600"
                  />
                ))}
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
            Save
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
