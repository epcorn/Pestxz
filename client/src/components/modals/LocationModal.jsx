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
    },
  });

  const serviceReq = watch("serviceReq");
  const selectedProduct = watch("product");
  const selectedVersion = watch("version");

  const versions = useMemo(() => {
    if (!selectedProduct?.value || !products) return [];
    return products
      .filter((p) => p?._id === selectedProduct.value)
      .flatMap((p) => p.version?.map((ver) => ({ label: ver.name, value: ver._id })) || []);
  }, [selectedProduct?.value, products]);

  const prFrequency = useMemo(
    () => frequencies.map((fr) => ({ label: fr, value: fr })),
    []
  );

  const allProducts = useMemo(
    () => products?.map((p) => ({ label: p.name, value: p._id })) ?? [],
    [products]
  );

  const productinfo = useMemo(() => {
    if (!selectedProduct?.value || !selectedVersion?.value || !products) return null;
    const activeProduct = products.find((p) => p._id === selectedProduct.value);
    const activeVersion = activeProduct?.version?.find((ver) => ver._id === selectedVersion.value);
    return {
      code: activeVersion?.code,
      specification: activeProduct?.specification,
      calibrations: activeProduct?.calibration,
    };
  }, [selectedProduct?.value, selectedVersion?.value, products]);

  // auto-fill code & specification when product+version selected
  useEffect(() => {
    if (!productinfo) return;
    setValue("code", productinfo.code ?? "");
    setValue("specification", productinfo.specification ?? "");
  }, [productinfo, setValue]);

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

      // Controller fields need {label, value} shape for react-select to show pre-selected
      ...(hasProduct && {
        product: { label: pr.productName, value: pr.productId },
        version: { label: pr.versionName, value: pr.versionId },
        frequency: { label: pr.frequency, value: pr.frequency },
        code: pr.code || "",
        specification: pr.specification || "",
        calibrations: pr.calibrations ?? [],
      }),

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
      if (!data.product?.value || !data.version?.value || !data.frequency?.value) {
        toast.warning("Please fill all product fields");
        return;
      }
      data.productReq = {
        productId: data.product.value,
        productName: data.product.label,
        versionId: data.version.value,
        versionName: data.version.label,
        frequency: data.frequency.value,
        code: data.code,
        specification: data.specification,
        calibrations: data.calibrations ?? [],
      };
    }

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
            onChange={() =>
              setType((prev) =>
                prev.includes("service")
                  ? prev.filter((t) => t !== "service")
                  : [...prev, "service"]
              )
            }
          />
          <label htmlFor="type-service">Services</label>
        </div>

        <div className="outline outline-gray-400 px-2 rounded">
          <input
            type="checkbox"
            id="type-product"
            checked={type.includes("product")}
            onChange={() =>
              setType((prev) =>
                prev.includes("product")
                  ? prev.filter((t) => t !== "product")
                  : [...prev, "product"]
              )
            }
          />
          <label htmlFor="type-product">Product</label>
        </div>
      </div>

      {type.includes("product") && (
        <ProductSection
          allProducts={allProducts}
          control={control}
          errors={errors}
          prFrequency={prFrequency}
          productinfo={productinfo}
          register={register}
          versions={versions}
        />
      )}

      {type.includes("service") && (
        <ServiceSection
          allServices={allServices}
          defaultService={defaultService}
          serviceReq={serviceReq}
          setValue={setValue}
          watch={watch}
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