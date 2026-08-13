import React from "react";
import Button from "../Button";
import { Controller, useFieldArray, useWatch } from "react-hook-form";
import InputSelect from "../InputSelect";
import InputRow from "../InputRow";

const emptyProduct = {
  product: null,
  version: null,
  code: "",
  frequency: null,
  specification: "",
  calibrations: [],
  isNew: true,
};

function ProductRow({
  control,
  register,
  errors,
  setValue,
  index,
  products,
  allProducts,
  prFrequency,
  onRemove,
  canRemove,
  isNewProduct,
}) {
  const selectedProduct = useWatch({
    control,
    name: `products.${index}.product`,
  });
  const selectedVersion = useWatch({
    control,
    name: `products.${index}.version`,
  });
  const versions = React.useMemo(() => {
    if (!selectedProduct?.value)
      return selectedVersion ? [selectedVersion] : [];
    if (!selectedProduct?.value || !products) return [];

    const opts = products
      .filter((p) => String(p?._id) === String(selectedProduct.value))
      .flatMap(
        (p) =>
          p.version?.map((ver) => ({ label: ver.name, value: ver._id })) || [],
      );

    if (
      selectedVersion?.value &&
      !opts.some((o) => String(o.value) === String(selectedVersion.value))
    ) {
      opts.push(selectedVersion);
    }

    return opts;
  }, [selectedProduct?.value, products]);

  const productinfo = React.useMemo(() => {
    if (!selectedProduct?.value || !selectedVersion?.value || !products)
      return null;
    const activeProduct = products.find((p) => p._id === selectedProduct.value);
    const activeVersion = activeProduct?.version?.find(
      (ver) => ver._id === selectedVersion.value,
    );

    return {
      code: activeVersion?.code,
      specification: activeProduct?.specification,
      calibrations: activeVersion?.calibration,
    };
  }, [selectedProduct?.value, selectedVersion?.value, products]);

  // auto-fill code & specification when product+version selected, scoped to this row
  React.useEffect(() => {
    if (!productinfo) return;
    setValue(`products.${index}.code`, productinfo.code ?? "");
    setValue(
      `products.${index}.specification`,
      productinfo.specification ?? "",
    );
  }, [productinfo, setValue, index]);

  const fieldError = errors?.products?.[index] || {};

  return (
    <div className="col-span-3 outline outline-gray-400 rounded m-1 p-1">
      <div className="flex justify-between pl-5 gap-2">
        <span className="outline w-7 h-7 text-center content-center bg-white leading-none text-lg">
          {index + 1}
        </span>
        {canRemove && (
          <Button
            type="button"
            label={"Remove"}
            color={"bg-white"}
            text={"text-red-600 border"}
            onClick={onRemove}
          />
        )}
      </div>
      <div className="grid grid-cols-3 gap-x-2">
        <input type="hidden" {...register(`products.${index}._id`)} />
        <div>
          <Controller
            name={`products.${index}.product`}
            control={control}
            rules={{ required: "Product is required" }}
            render={({ field }) => (
              <InputSelect
                isMulti={false}
                options={allProducts}
                onChange={(val) => {
                  field.onChange(val);
                  // reset dependent fields when product changes
                  setValue(`products.${index}.version`, null);
                  setValue(`products.${index}.code`, "");
                  setValue(`products.${index}.specification`, "");
                  setValue(`products.${index}.calibrations`, []);
                }}
                disable={!isNewProduct}
                value={field.value}
                label="Select Product"
              />
            )}
          />
          <p className="text-xs text-red-500 pl-1 mt-1">
            {fieldError.product?.message}
          </p>
        </div>

        <div>
          <Controller
            name={`products.${index}.version`}
            control={control}
            rules={{ required: "Version is required" }}
            render={({ field }) => (
              <InputSelect
                isMulti={false}
                disable={!isNewProduct}
                options={versions}
                onChange={field.onChange}
                value={field.value}
                label="Select Version"
              />
            )}
          />
          <p className="text-xs text-red-500 pl-1 mt-1">
            {fieldError.version?.message}
          </p>
        </div>

        <div>
          <InputRow
            label={"Code"}
            id={`products.${index}.code`}
            register={register}
            disabled={true}
          />
        </div>

        <div>
          <Controller
            name={`products.${index}.frequency`}
            control={control}
            rules={{ required: "Frequency is required" }}
            render={({ field }) => (
              <InputSelect
                isMulti={false}
                options={prFrequency}
                onChange={field.onChange}
                value={field.value}
                disable={!isNewProduct}
                label="Product Frequency"
              />
            )}
          />
          <p className="text-xs text-red-500 pl-1 mt-1">
            {fieldError.frequency?.message}
          </p>
        </div>

        <div>
          <InputRow
            register={register}
            label={"Specification"}
            disabled={true}
            id={`products.${index}.specification`}
          />
        </div>

        <div className=" col-span-3 grid grid-cols-3 outline outline-gray-400 px-2 rounded mt-2 hidden">
          <h3 className="col-span-3 font-semibold ">
            Calibrations<span className="text-red-600">*</span>
          </h3>
          {productinfo?.calibrations?.map((cal, i) => (
            <div
              key={`calibration.${index}.${i}`}
              className="flex items-center gap-2"
            >
              <input
                type="checkbox"
                id={`calibration.${index}.${i}`}
                value={cal}
                defaultChecked
                {...register(`products.${index}.calibrations`)}
              />
              <label htmlFor={`calibration.${index}.${i}`}>{cal}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductSection({
  control,
  register,
  errors,
  setValue,
  products,
  allProducts,
  prFrequency,
  locationDetails,
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "products",
  });

  return (
    <div className="col-span-3 bg-emerald-200 mt-2 p-2">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Products</h3>
        <Button
          type="button"
          label={"Add Products"}
          color={"bg-white"}
          text={"text-black border"}
          onClick={() => append(emptyProduct)}
        />
      </div>
      <div className="bg-gray-100 ml-0.5 max-h-72 overflow-y-auto">
        {fields.map((field, index) => {
          const isNewProduct = field.isNew;
          console.log(isNewProduct, field.isNew)
          return (
            <ProductRow
              key={field.id}
              index={index}
              control={control}
              register={register}
              errors={errors}
              setValue={setValue}
              products={products}
              isNewProduct={isNewProduct}
              allProducts={allProducts}
              prFrequency={prFrequency}
              onRemove={() => remove(index)}
              canRemove={fields.length >= 0}
            />
          );
        })}
      </div>
    </div>
  );
}

export default ProductSection;