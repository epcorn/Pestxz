import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import React, { useEffect } from "react";
import {
  useAllServiceQuery,
  useGetFrequencyQuery,
} from "../../redux/adminSlice";
import {
  useAddLocationMutation,
  useUpdateLocationMutation,
} from "../../redux/locationSlice";
import { InputRow, Loading } from "..";
import { useDispatch, useSelector } from "react-redux";
import FormModal from "./FormModal";
import { toggleModal } from "../../redux/helperSlice";

const defaultService = {
  serviceId: "",
  serviceName: "",
  frequency: "",
  scopes: [],
};

const LocationModal = ({ clientId, locationDetails }) => {
  const dispatch = useDispatch();
  const { isModalOpen } = useSelector((store) => store.helper);
  const [add, { isLoading: addLoading }] = useAddLocationMutation();
  const [update, { isLoading: updateLoading }] = useUpdateLocationMutation();
  const { data: frequencies = [] } = useGetFrequencyQuery();

  const { data = {}, isLoading, isFetching } = useAllServiceQuery();

  const allServices = data?.services?.flatMap((ser) => ser.service) || [];

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      floor: "",
      subLocation: "",
      location: "",
      serviceReq: [defaultService],
    },
  });

  const serviceReq = watch("serviceReq");

  useEffect(() => {
    if (locationDetails) {
      reset({
        floor: locationDetails.floor || "",
        location: locationDetails.location || "",
        subLocation: locationDetails.subLocation || "",

        serviceReq:
          locationDetails.service?.length > 0
            ? locationDetails.service.map((ser) => ({
              serviceId: ser.serviceId || "",
              serviceName: ser.serviceName || "",
              frequency: ser.frequency || "",

              scopes:
                ser.scopes?.map((sc) => ({
                  scopeId: sc.scopeId || "",
                  scopeName: sc.scopeName || "",

                  consumables:
                    sc.consumables?.map((con) => ({
                      consumableId: con.consumableId || "",
                      consumableName: con.consumableName || "",
                      calibration: con.calibration || "",
                    })) || [],
                })) || [],
            }))
            : [defaultService],
      });
    } else {
      reset({
        floor: "",
        location: "",
        subLocation: "",
        serviceReq: [defaultService],
      });
    }
  }, [locationDetails, reset]);

  const submit = async (data) => {
    data.clientId = clientId;
    const validServices = data.serviceReq.filter(
      (s) => s.serviceId && s.frequency && s.scopes?.length > 0,
    );
    if (validServices.length < 1) {
      toast.warning("Please add at least one service");
      return;
    }
    data.serviceReq = validServices;
    console.log(data);
    try {
      let res;

      if (locationDetails) {
        res = await update({ id: locationDetails._id, data }).unwrap();
      } else {
        res = await add(data).unwrap();
      }

      toast.success(res.msg);
      reset();
      dispatch(toggleModal({ name: "location", status: false }));
    } catch (error) {
      console.log(error);
      toast.error(error?.data?.msg || error.error);
    }
  };

  const formBody = (
    <div className="grid md:grid-cols-3 gap-4">
      {/* FLOOR */}
      <InputRow label="Floor" id="floor" errors={errors} register={register} />

      {/* LOCATION */}
      <InputRow
        label="Location"
        id="location"
        errors={errors}
        register={register}
      />

      {/* SUB LOCATION */}
      <InputRow
        label="Sub Location"
        id="subLocation"
        errors={errors}
        register={register}
        required={false}
      />

      {/* SERVICES */}
      <div className="col-span-3 mt-4">
        <div className="flex items-center justify-between mb-3">
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

        <div className="space-y-4">
          {serviceReq?.map((item, index) => {
            const selectedService = allServices.find(
              (s) => s._id === watch(`serviceReq.${index}.serviceId`),
            );

            const scopes = selectedService?.scopes || [];

            return (
              <div key={index} className="border rounded p-3 space-y-4">
                {/* TOP */}
                <div className="grid md:grid-cols-3 gap-3">
                  {/* SERVICE */}
                  <select
                    className="border rounded p-2"
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
                    className="border rounded p-2"
                    value={watch(`serviceReq.${index}.frequency`) || ""}
                    onChange={(e) =>
                      setValue(`serviceReq.${index}.frequency`, e.target.value)
                    }>
                    <option value="">Select Frequency</option>

                    {frequencies.map((freq) => (
                      <option key={freq._id} value={freq.name}>
                        {freq.name}
                      </option>
                    ))}
                  </select>

                  {/* REMOVE */}
                  <button
                    type="button"
                    className="border rounded p-2 text-red-500"
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
                        <div key={scope._id} className="border rounded p-3">
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
                                      className="border rounded p-2"
                                      disabled={!selectedConsumable}
                                      value={
                                        selectedConsumable?.calibration || ""
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
  );

  return (
    <div>
      {(isLoading || isFetching) && <Loading />}
      <FormModal
        open={isModalOpen.location}
        title={locationDetails ? "Update Location" : "New Location"}
        formBody={formBody}
        submitLabel={locationDetails ? "Update Location" : "Add Location"}
        onSubmit={handleSubmit(submit)}
        handleClose={() =>
          dispatch(toggleModal({ name: "location", status: false, }),)}
        disabled={addLoading || updateLoading}
        isLoading={addLoading || updateLoading}
      />
    </div>
  );
};

export default LocationModal;
