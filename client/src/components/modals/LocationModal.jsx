import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import React, { useEffect, useState, useMemo } from "react";
import { useAllServiceQuery, useGetProductsQuery } from "../../redux/adminSlice";
import { useAddLocationMutation, useUpdateLocationMutation } from "../../redux/locationSlice";
import { Button, InputRow, InputSelect, Loading } from "..";
import { useDispatch, useSelector } from "react-redux";
import FormModal from "./FormModal";
import { toggleModal } from "../../redux/helperSlice";
import { frequencies } from "../../utils/helperFunctions";
import History from "../History";
import ProductSection from "./ProductSection";
import ServiceSection from "./ServiceSection";
import { version } from "mongoose";

const defaultService = {
  serviceId: "",
  serviceName: "",
  frequency: "",
  scopes: [],
};


const LocationModal = ({ clientId, locationDetails }) => {
  const dispatch = useDispatch();
  const { isModalOpen, user } = useSelector((store) => store.helper);
  const [type, setType] = useState(["service"]); // always an array

  const [add, { isLoading: addLoading }] = useAddLocationMutation();
  const [update, { isLoading: updateLoading }] = useUpdateLocationMutation();

  const { data: products, isLoading: prLoading } = useGetProductsQuery();
  const { data = {}, isLoading, isFetching } = useAllServiceQuery();
  const allServices = data?.services?.flatMap((ser) => ser.service) || [];


  const hasExistingProducts = locationDetails?.product?.length > 0;
  const hasExistingServices = locationDetails?.service?.length > 0

  const handleTypeToggle = (key, hasExisting) => {
    setType((prev) => {
      const isCurrentlyOn = prev.includes(key);

      // Unchecking something that has real saved data → confirm first
      if (isCurrentlyOn && hasExisting) {
        const ok = window.confirm(
          `This will remove all existing ${key}s from this location once you submit. Are you sure?`
        );
        if (!ok) return prev; // no-op, checkbox stays checked
      }

      return isCurrentlyOn
        ? prev.filter((t) => t !== key)
        : [...prev, key];
    });
  };

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      floor: "",
      subLocation: "",
      location: "",
      serviceReq: [defaultService],
      code: "",
      specification: "",
      calibrations: [],
      products: [
        { _id: null, product: null, version: null, code: '', frequency: null, specification: "", calibration: [] }
      ]
    },
  });

  const serviceReq = watch("serviceReq");

  const allProducts = products?.map(pr => ({
    label: pr.name, value: pr._id
  }))
  const prFrequency = frequencies.map(f => ({ label: f, value: f }))

  // populate form when editing an existing location
  useEffect(() => {
    if (!locationDetails) {
      reset({
        floor: "",
        location: "",
        subLocation: "",
        serviceReq: [defaultService],
        code: "",
        specification: "",
        calibrations: [],
      });
      setType(["service"]);
      return;
    }



    const hasProduct = locationDetails.product?.length > 0;
    const hasService = locationDetails.service?.length > 0;
    const pr = locationDetails.product?.[0];

    // derive active types from what the location actually has
    const activeTypes = [];
    if (hasService) activeTypes.push("service");
    if (hasProduct) activeTypes.push("product");
    setType(activeTypes.length ? activeTypes : ["service"]);

    reset({
      floor: locationDetails.floor || "",
      location: locationDetails.location || "",
      subLocation: locationDetails.subLocation || "",

      products: hasProduct ?
        locationDetails.product?.map((pr) => ({
          _id: pr._id || null,
          product: { label: pr?.productName, value: pr?.productId },
          version: { label: pr?.versionName, value: pr?.versionId },
          frequency: { label: pr?.frequency, value: pr?.frequency },
          code: pr?.code || '',
          specification: pr?.specification || "",
          calibrations: pr?.calibrations ?? [],
        })) : [{ _id: null, product: null, version: [], code: '', frequency: null, specification: '', calibration: [] }],

      serviceReq: hasService
        ? locationDetails.service.map((ser) => ({
          serviceId: ser.serviceId || "",
          serviceName: ser.serviceName || "",
          frequency: ser.frequency || "",
          scopes: ser.scopes?.map((sc) => ({
            scopeId: sc.scopeId || "",
            scopeName: sc.scopeName || "",
            consumables: sc.consumables?.map((con) => ({
              consumableId: con.consumableId || "",
              consumableName: con.consumableName || "",
              calibration: con.calibration || 0,
            })) || [],
          })) || [],
        }))
        : [defaultService],
    });
  }, [locationDetails, reset]);

  const submit = async (data) => {
    data.clientId = clientId;
    data.type = type;

    data.confirmRemoval = {
      service: hasExistingServices && !type.includes("service"),
      product: hasExistingProducts && !type.includes("product"),
    };

    if (!type.length) {
      toast.warning("Please select at least service or product ");
      return;
    }

    if (type.includes("service")) {
      const validServices = data?.serviceReq?.filter(
        (s) => s.serviceId && s.frequency && s.scopes?.length > 0
      );
      if (validServices.length < 1) {
        toast.warning("Please add at least one service");
        return;
      }
      data.serviceReq = validServices;
    }

    if (type.includes("product")) {
      const validProducts = data?.products?.filter((p) => p.product.value && p.version.value && p.version.label && p.frequency.value);
      console.log(validProducts)
      data.productReq = validProducts?.map(p => ({
        _id: p._id || undefined,
        productId: p.product.value,
        productName: p.product.label,
        versionId: p.version.value,
        versionName: p?.version?.label,
        frequency: p.frequency.value,
        code: p.code,
        specification: p.specification,
        calibrations: p.calibrations ?? [],
      }));
    }
    console.log(data.productReq)

    if (locationDetails && !data.changes?.trim()) {
      toast.warning("Please specify what changed and why");
      return;
    }

    try {
      let res;
      if (locationDetails) {
        res = await update({ id: locationDetails._id, data }).unwrap();
      } else {
        res = await add(data).unwrap();
      }
      toast.success(res?.msg);
      reset();
      dispatch(toggleModal({ name: "location", status: false }));
      dispatch(toggleModal({ name: "changes", status: false }));
    } catch (error) {
      toast.error(error?.data?.msg || error.error);
    }
  };

  const formBody = (
    <div className="grid md:grid-cols-3 gap-x-4">
      <InputRow label="Floor" id="floor" errors={errors} register={register} />
      <InputRow label="Location" id="location" errors={errors} register={register} />
      <InputRow label="Sub Location" id="subLocation" errors={errors} register={register} required={false} />

      <div className="col-span-3 flex items-center *:flex *:items-center *:gap-3 gap-5 my-2 px-2">
        <h3 className="font-semibold">Please select:</h3>

        <div className="outline outline-gray-400 px-2 rounded">
          <input
            type="checkbox"
            id="type-service"
            checked={type.includes("service")}
            onChange={() => handleTypeToggle("service", hasExistingServices)}
          />
          <label htmlFor="type-service">Services</label>
        </div>

        <div className="outline outline-gray-400 px-2 rounded">
          <input
            type="checkbox"
            id="type-product"
            checked={type.includes("product")}
            onChange={() => handleTypeToggle("product", hasExistingProducts)}
          />
          <label htmlFor="type-product">Product</label>
        </div>
      </div>

      {type.includes("service") && (
        <ServiceSection
          allServices={allServices}
          defaultService={defaultService}
          serviceReq={serviceReq}
          setValue={setValue}
          watch={watch}
        />
      )}

      {type.includes("product") && (
        <ProductSection
          allProducts={allProducts}
          control={control}
          errors={errors}
          prFrequency={prFrequency}
          products={products}
          register={register}
          setValue={setValue}
        />
      )}

      {locationDetails && (
        <div className="col-span-3 flex m-1 p-2 justify-between items-center">
          <div>
            <InputRow
              label="Please specify Reason"
              type="textarea"
              cls="border-gray-800"
              placeholder="what changed & Why?"
              error={errors}
              id="changes"
              required={true}
              register={register}
            />
          </div>
          {user.role === "Admin" && (
            <div>
              <Button
                label="Changes"
                onClick={() => dispatch(toggleModal({ name: "changes", status: true }))}
              />
              {isModalOpen.changes && <History loc={locationDetails} />}
            </div>
          )}
        </div>
      )}
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
        handleClose={() => dispatch(toggleModal({ name: "location", status: false }))}
        disabled={addLoading || updateLoading}
        isLoading={addLoading || updateLoading}
      />
    </div>
  );
};

export default LocationModal;