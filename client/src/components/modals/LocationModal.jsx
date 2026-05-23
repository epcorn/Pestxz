import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

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

import React from "react";

const defaultService = {
  serviceId: "",
  serviceName: "",

  scopeId: "",
  scopeName: "",

  consumableId: "",
  consumableName: "",

  calibration: "",
  frequency: "",
};

const LocationModal = ({
  clientId,
  locationDetails,
}) => {
  const dispatch = useDispatch();

  const { isModalOpen } = useSelector(
    (store) => store.helper
  );

  const [add, { isLoading: addLoading }] =
    useAddLocationMutation();

  const [update, { isLoading: updateLoading }] =
    useUpdateLocationMutation();

  const {
    data: frequencies = [],
  } = useGetFrequencyQuery();

  const {
    data = {},
    isLoading,
    isFetching,
  } = useAllServiceQuery();

  const allServices =
    data?.services?.flatMap(
      (ser) => ser.service
    ) || [];

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues:
      locationDetails || {
        floor: "",
        subLocation: "",
        location: "",
        serviceReq: [defaultService],
      },
  });

  const serviceReq = watch("serviceReq");

  const submit = async (data) => {
    data.clientId = clientId;

    const validServices =
      data.serviceReq.filter(
        (s) =>
          s.serviceId &&
          s.scopeId &&
          s.consumableId &&
          s.frequency
      );

    if (validServices.length < 1) {
      toast.warning(
        "Please add at least one service"
      );
      return;
    }

    data.serviceReq = validServices;

    console.log(data)
    // try {
    //   let res;

    //   if (locationDetails) {
    //     res = await update({
    //       id: locationDetails._id,
    //       data,
    //     }).unwrap();
    //   } else {
    //     res = await add(data).unwrap();
    //   }

    //   toast.success(res.msg);

    //   reset();

    //   dispatch(
    //     toggleModal({
    //       name: "location",
    //       status: false,
    //     })
    //   );
    // } catch (error) {
    //   console.log(error);

    //   toast.error(
    //     error?.data?.msg || error.error
    //   );
    // }
  };

  const formBody = (
    <div className="grid md:grid-cols-3 gap-4 mb-4">

      {/* FLOOR */}

      <div>
        <InputRow
          label="Floor"
          id="floor"
          errors={errors}
          register={register}
          disabled={
            addLoading || updateLoading
          }
        />
      </div>

      {/* LOCATION */}

      <div>
        <InputRow
          label="Location"
          id="location"
          errors={errors}
          register={register}
          disabled={
            addLoading || updateLoading
          }
        />
      </div>

      {/* SUB LOCATION */}

      <div>
        <InputRow
          required={false}
          label="Sub Location"
          id="subLocation"
          errors={errors}
          register={register}
          disabled={
            addLoading || updateLoading
          }
        />
      </div>

      {/* SERVICES */}

      <div className="col-span-3 mt-4 grid gap-3">

        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">
            Service Details
          </h3>

          <button
            type="button"
            className="bg-green-600 text-white px-3 py-1 rounded"
            onClick={() =>
              setValue("serviceReq", [
                ...serviceReq,
                { ...defaultService },
              ])
            }
          >
            + Add
          </button>
        </div>

        {serviceReq?.map((item, index) => {

          const selectedService =
            allServices.find(
              (s) =>
                s._id ===
                watch(
                  `serviceReq.${index}.serviceId`
                )
            );

          const scopes =
            selectedService?.scopes || [];

          const selectedScope =
            scopes.find(
              (s) =>
                s._id ===
                watch(
                  `serviceReq.${index}.scopeId`
                )
            );

          const consumables =
            selectedScope?.consumables || [];

          return (
            <div
              key={index}
              className="grid md:grid-cols-6 gap-2 border border-gray-300 rounded p-3"
            >

              {/* SERVICE */}

              <select
                className="border border-gray-400 rounded p-2 w-full"
                value={
                  watch(
                    `serviceReq.${index}.serviceId`
                  ) || ""
                }
                onChange={(e) => {

                  const service =
                    allServices.find(
                      (s) =>
                        s._id === e.target.value
                    );

                  setValue(
                    `serviceReq.${index}.serviceId`,
                    service?._id || ""
                  );

                  setValue(
                    `serviceReq.${index}.serviceName`,
                    service?.serviceName || ""
                  );

                  setValue(
                    `serviceReq.${index}.scopeId`,
                    ""
                  );

                  setValue(
                    `serviceReq.${index}.scopeName`,
                    ""
                  );

                  setValue(
                    `serviceReq.${index}.consumableId`,
                    ""
                  );

                  setValue(
                    `serviceReq.${index}.consumableName`,
                    ""
                  );
                }}
              >
                <option value="">
                  Select Service
                </option>

                {allServices.map((service) => (
                  <option
                    key={service._id}
                    value={service._id}
                  >
                    {service.serviceName}
                  </option>
                ))}
              </select>

              {/* SCOPE */}

              <select
                className="border border-gray-400 rounded p-2 w-full"
                disabled={!selectedService}
                value={
                  watch(
                    `serviceReq.${index}.scopeId`
                  ) || ""
                }
                onChange={(e) => {

                  const scope =
                    scopes.find(
                      (s) =>
                        s._id === e.target.value
                    );

                  setValue(
                    `serviceReq.${index}.scopeId`,
                    scope?._id || ""
                  );

                  setValue(
                    `serviceReq.${index}.scopeName`,
                    scope?.scopeName || ""
                  );

                  setValue(
                    `serviceReq.${index}.consumableId`,
                    ""
                  );

                  setValue(
                    `serviceReq.${index}.consumableName`,
                    ""
                  );
                }}
              >
                <option value="">
                  Select Scope
                </option>

                {scopes.map((scope) => (
                  <option
                    key={scope._id}
                    value={scope._id}
                  >
                    {scope.scopeName}
                  </option>
                ))}
              </select>

              {/* CONSUMABLE */}

              <select
                className="border border-gray-400 rounded p-2 w-full"
                disabled={!selectedScope}
                value={
                  watch(
                    `serviceReq.${index}.consumableId`
                  ) || ""
                }
                onChange={(e) => {

                  const consumable =
                    consumables.find(
                      (c) =>
                        c._id === e.target.value
                    );

                  setValue(
                    `serviceReq.${index}.consumableId`,
                    consumable?._id || ""
                  );

                  setValue(
                    `serviceReq.${index}.consumableName`,
                    consumable?.name || ""
                  );
                }}
              >
                <option value="">
                  Select Consumable
                </option>

                {consumables.map(
                  (consumable) => (
                    <option
                      key={consumable._id}
                      value={consumable._id}
                    >
                      {consumable.name}
                    </option>
                  )
                )}
              </select>

              {/* CALIBRATION */}

              <input
                type="text"
                placeholder="Calibration"
                {...register(
                  `serviceReq.${index}.calibration`
                )}
                className="border border-gray-400 rounded p-2 w-full"
              />

              {/* FREQUENCY */}

              <select
                {...register(
                  `serviceReq.${index}.frequency`
                )}
                className="border border-gray-400 rounded p-2 w-full"
              >
                <option value="">
                  Frequency
                </option>

                {frequencies.map((freq) => (
                  <option
                    key={freq._id}
                    value={freq.name}
                  >
                    {freq.name}
                  </option>
                ))}
              </select>

              {/* REMOVE */}

              <button
                type="button"
                className="text-red-500 text-sm hover:underline"
                onClick={() => {

                  const updated =
                    serviceReq.filter(
                      (_, i) => i !== index
                    );

                  setValue(
                    "serviceReq",
                    updated.length
                      ? updated
                      : [{ ...defaultService }]
                  );
                }}
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      {(isLoading || isFetching) && (
        <Loading />
      )}

      <FormModal
        onSubmit={handleSubmit(submit)}
        title={`${locationDetails
          ? "Update"
          : "New"
          } Location`}
        formBody={formBody}
        submitLabel={`${locationDetails
          ? "Update"
          : "Add"
          } Location`}
        handleClose={() =>
          dispatch(
            toggleModal({
              name: "location",
              status: false,
            })
          )
        }
        disabled={
          addLoading || updateLoading
        }
        isLoading={
          addLoading || updateLoading
        }
        open={isModalOpen.location}
      />
    </div>
  );
};

export default LocationModal;