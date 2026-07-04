import React from 'react'
import { frequencies } from '../../utils/helperFunctions';

function ServiceSection({ serviceReq, defaultService, allServices, setValue, watch }) {
  return (
    <div className="col-span-3 mt-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold">Service Details</h3>

        <button
          type="button"
          className="border px-3 py-1 rounded"
          onClick={() =>
            setValue("serviceReq", [...serviceReq, { ...defaultService }])
          }>
          Add Service
        </button>
      </div>

      <div className="overflow-y-auto max-h-72  bg-gray-100">
        <div className="space-y-1">
          {serviceReq?.map((item, index) => {
            const selectedService = allServices.find(
              (s) => s._id === watch(`serviceReq.${index}.serviceId`),
            );

            const scopes = selectedService?.scopes || [];

            return (
              <div key={index} className="border border-gray-400 rounded p-3 space-y-4">
                {/* TOP */}
                <div className="grid md:grid-cols-3 gap-3">
                  {/* SERVICE */}
                  <select
                    className="border bg-white border-gray-400 rounded px-1"
                    value={watch(`serviceReq.${index}.serviceId`) || ""}
                    onChange={(e) => {
                      const service = allServices.find(
                        (s) => s._id === e.target.value,
                      );

                      setValue(
                        `serviceReq.${index}.serviceId`,
                        service?._id || "",
                      );

                      setValue(
                        `serviceReq.${index}.serviceName`,
                        service?.serviceName || "",
                      );

                      setValue(`serviceReq.${index}.scopes`, []);
                    }}>
                    <option value="">Select Service</option>

                    {allServices.map((service) => (
                      <option key={service._id} value={service._id}>
                        {service.serviceName}
                      </option>
                    ))}
                  </select>

                  {/* FREQUENCY */}
                  <select
                    className="border bg-white border-gray-400 text-black rounded p-2 capitalize"
                    value={watch(`serviceReq.${index}.frequency`) || ""}
                    onChange={(e) =>
                      setValue(`serviceReq.${index}.frequency`, e.target.value)
                    }>
                    <option value="">Select Frequency</option>

                    {frequencies.map((freq) => (
                      <option key={freq} value={freq}>
                        {freq}
                      </option>
                    ))}
                  </select>

                  {/* REMOVE */}
                  <button
                    type="button"
                    className="border bg-red-200 rounded p-2 text-red-500"
                    onClick={() => {
                      const updated = serviceReq.filter((_, i) => i !== index);

                      setValue(
                        "serviceReq",
                        updated.length ? updated : [defaultService],
                      );
                    }}>
                    Remove
                  </button>
                </div>

                {/* SCOPES */}
                {scopes.length > 0 && (
                  <div className="space-y-3">
                    {scopes.map((scope) => {
                      const selectedScopes =
                        watch(`serviceReq.${index}.scopes`) || [];

                      const existingScope = selectedScopes.find(
                        (s) => s.scopeId === scope._id,
                      );

                      return (
                        <div key={scope._id} className="border border-gray-400 rounded p-3">
                          {/* SCOPE */}
                          <label className="flex items-center gap-2 mb-3">
                            <input
                              type="checkbox"
                              checked={!!existingScope}
                              onChange={(e) => {
                                let updatedScopes = [...selectedScopes];

                                if (e.target.checked) {
                                  updatedScopes.push({
                                    scopeId: scope._id,
                                    scopeName: scope.scopeName,
                                    consumables: [],
                                  });
                                } else {
                                  updatedScopes = updatedScopes.filter(
                                    (s) => s.scopeId !== scope._id,
                                  );
                                }

                                setValue(
                                  `serviceReq.${index}.scopes`,
                                  updatedScopes,
                                );
                              }}
                            />

                            <span>{scope.scopeName}</span>
                          </label>

                          {/* CONSUMABLES */}
                          {existingScope && (
                            <div className="space-y-2">
                              {scope.consumables?.map((consumable) => {
                                const selectedConsumable =
                                  existingScope.consumables?.find(
                                    (c) => c.consumableId === consumable._id,
                                  );

                                return (
                                  <div
                                    key={consumable._id}
                                    className="grid md:grid-cols-2 gap-2 items-center">
                                    {/* CHECKBOX */}
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={!!selectedConsumable}
                                        onChange={(e) => {
                                          const updatedScopes = [
                                            ...selectedScopes,
                                          ];

                                          const scopeIndex =
                                            updatedScopes.findIndex(
                                              (s) => s.scopeId === scope._id,
                                            );

                                          if (e.target.checked) {
                                            updatedScopes[
                                              scopeIndex
                                            ].consumables.push({
                                              consumableId: consumable._id,
                                              consumableName: consumable.name,
                                              calibration: "",
                                            });
                                          } else {
                                            updatedScopes[
                                              scopeIndex
                                            ].consumables = updatedScopes[
                                              scopeIndex
                                            ].consumables.filter(
                                              (c) =>
                                                c.consumableId !==
                                                consumable._id,
                                            );
                                          }

                                          setValue(
                                            `serviceReq.${index}.scopes`,
                                            updatedScopes,
                                          );
                                        }}
                                      />

                                      <span>{consumable.name}</span>
                                    </label>

                                    {/* CALIBRATION */}
                                    <input
                                      type="text"
                                      placeholder="Calibration"
                                      className="border rounded p-2 disabled:opacity-35"
                                      disabled={!selectedConsumable}
                                     
                                      value={
                                        selectedConsumable?.calibration ?? ''
                                      }
                                      onChange={(e) => {
                                        const updatedScopes = [
                                          ...selectedScopes,
                                        ];

                                        const scopeIndex =
                                          updatedScopes.findIndex(
                                            (s) => s.scopeId === scope._id,
                                          );

                                        const consumableIndex = updatedScopes[
                                          scopeIndex
                                        ].consumables.findIndex(
                                          (c) =>
                                            c.consumableId === consumable._id,
                                        );

                                        updatedScopes[scopeIndex].consumables[
                                          consumableIndex
                                        ].calibration = e.target.value;

                                        setValue(
                                          `serviceReq.${index}.scopes`,
                                          updatedScopes,
                                        );
                                      }}
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
    </div>
  )
}

export default ServiceSection