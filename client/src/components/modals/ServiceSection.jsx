import React from 'react';
import { useFieldArray } from 'react-hook-form';
import { frequencies } from '../../utils/helperFunctions';

function ServiceSection({ allServices, control, register, setValue, watch, locationDetails }) {
  const { fields: serviceFields, append, remove } = useFieldArray({
    control,
    name: "serviceReq"
  });

  const handleServiceChange = (index, serviceId) => {
    const selectedService = allServices.find((s) => s._id === serviceId);
    setValue(`serviceReq.${index}.serviceId`, serviceId);
    setValue(`serviceReq.${index}.serviceName`, selectedService?.serviceName || "");
    setValue(`serviceReq.${index}.scopes`, []);
  };

  // ─── PART 1: AUTO-SELECT ALL CONSUMABLES BY DEFAULT ON SCOPE CHECK ───
  const handleScopeToggle = (serviceIndex, scope, isChecked) => {
    const currentScopes = watch(`serviceReq.${serviceIndex}.scopes`) || [];

    if (isChecked) {
      // 💡 ALL SELECTED BY DEFAULT: Map all consumables automatically with a default calibration of "0"
      const autoConsumables = (scope.consumables || []).map((con) => ({
        consumableId: con._id,
        consumableName: con.name,
        calibration: "0"
      }));

      setValue(`serviceReq.${serviceIndex}.scopes`, [
        ...currentScopes,
        {
          scopeId: scope._id,
          scopeName: scope.scopeName,
          consumables: autoConsumables
        }
      ]);
    } else {
      // If the scope is unchecked, remove it entirely
      setValue(
        `serviceReq.${serviceIndex}.scopes`,
        currentScopes.filter((s) => s.scopeId !== scope._id)
      );
    }
  };

  // ─── PART 2: ALLOW MANUAL DESELECT/SELECT OF INDIVIDUAL CONSUMABLES ───
  const handleConsumableToggle = (serviceIndex, scopeId, consumable, isChecked) => {
    const currentScopes = watch(`serviceReq.${serviceIndex}.scopes`) || [];
    const updatedScopes = [...currentScopes];
    const scopeIndex = updatedScopes.findIndex((s) => s.scopeId === scopeId);

    if (scopeIndex === -1) return;

    if (isChecked) {
      // Add back manually if re-checked
      updatedScopes[scopeIndex].consumables.push({
        consumableId: consumable._id,
        consumableName: consumable.name,
        calibration: "0"
      });
    } else {
      updatedScopes[scopeIndex].consumables = updatedScopes[scopeIndex].consumables.filter(
        (c) => c.consumableId !== consumable._id
      );
    }

    setValue(`serviceReq.${serviceIndex}.scopes`, updatedScopes);
  };

  return (
    <div className="col-span-3 mt-1 bg-blue-200 p-3 rounded-lg shadow-inner">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">Services Setup</h3>
        <button
          type="button"
          className="px-4 py-1.5 rounded-md bg-blue-800 hover:bg-blue-900 text-white font-medium text-sm transition shadow"
          onClick={() => append({ serviceId: "", serviceName: "", frequency: "", scopes: [], isNew: true })}
        >
          + Add Service
        </button>
      </div>

      <div className="overflow-y-auto max-h-96 space-y-1 pr-1">
        {serviceFields.map((field, index) => {
          const currentServiceId = watch(`serviceReq.${index}.serviceId`);
          const selectedService = allServices.find((s) => s._id === currentServiceId);
          const scopes = selectedService?.scopes || [];
          const selectedScopesData = watch(`serviceReq.${index}.scopes`) || [];

          const isDisabled = Boolean(locationDetails && !field.isNew)

          return (
            <div key={field.id} className="border border-gray-400 rounded-xl p-4 space-y-4 bg-white/80 shadow-sm">

              {/* TOP HEADER CONTROLS */}
              <div className="grid md:grid-cols-3 gap-3 items-center ">
                <div className="flex gap-2 items-center">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-800 text-white rounded-full text-xs font-bold">
                    {index + 1}
                  </span>
                  <select
                    className="border w-full bg-white h-10 border-gray-300 rounded-md px-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                    value={currentServiceId || ""}
                    disabled={isDisabled}
                    onChange={(e) => handleServiceChange(index, e.target.value)}
                  >
                    <option value="">Select Service</option>
                    {allServices.map((service) => (
                      <option key={service._id} value={service._id}>
                        {service.serviceName}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  {...register(`serviceReq.${index}.frequency`)}
                  className="border bg-white h-10 border-gray-300 rounded-md px-2 text-sm capitalize focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-75"
                  disabled={isDisabled}
                >
                  <option value="">Select Frequency</option>
                  {frequencies.map((freq) => (
                    <option key={freq} value={freq}>{freq}</option>
                  ))}
                </select>

                <button
                  type="button"
                  className="h-10 text-sm font-medium border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition"
                  onClick={() => remove(index)}
                >
                  Remove Service
                </button>
              </div>

              {/* DYNAMIC SCOPES & CONSUMABLES */}
              {scopes.length > 0 && (
                <div className="bg-gray-50 border rounded-lg space-y-1 p-2 max-h-52 overflow-y-auto">
                  {scopes.map((scope) => {
                    const scopeIndex = selectedScopesData.findIndex((s) => s.scopeId === scope._id);
                    const isScopeSelected = scopeIndex !== -1;

                    return (
                      <div key={scope._id} className="border border-gray-400 bg-white rounded-md p-3 space-y-1 shadow-xs">
                        <div className="flex items-center gap-2 border-b pb-1">
                          <input
                            type="checkbox"
                            id={scope._id}
                            checked={isScopeSelected}
                            onChange={(e) => handleScopeToggle(index, scope, e.target.checked)}
                            className="rounded text-blue-600 cursor-pointer w-4 h-4"
                          />
                          <label htmlFor={scope._id} className="font-semibold text-sm text-gray-800">{scope.scopeName}</label>
                        </div>

                        {/* Consumables section */}
                        {isScopeSelected && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center px-2 md:px-5 ">
                            {scope.consumables?.map((consumable) => {
                              const conIndex = selectedScopesData[scopeIndex]?.consumables?.findIndex((c) => c.consumableId === consumable._id);
                              const isConsumableSelected = conIndex !== -1 && conIndex !== undefined;

                              return (
                                <div key={consumable._id} className="grid grid-cols-2 outline outline-gray-500 p-1 gap-4 items-center pl-6">
                                  <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isConsumableSelected}
                                      onChange={(e) => handleConsumableToggle(index, scope._id, consumable, e.target.checked)}
                                      className="rounded text-blue-500 w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <span>{consumable.name}</span>
                                  </label>

                                  <input
                                    type="text"
                                    placeholder="Calibration"
                                    disabled={!isConsumableSelected}
                                    {...register(`serviceReq.${index}.scopes.${scopeIndex}.consumables.${conIndex}.calibration`)}
                                    className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ServiceSection;