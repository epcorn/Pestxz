import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { MdAddCircle } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import {
  useRegisterClientMutation,
  useUpdateClientMutation,
} from "../../redux/clientSlice";

import {
  Button,
  InputRow,
  InputSelect,
} from "..";

import { toggleModal } from "../../redux/helperSlice";

import FormModal from "./FormModal";

const endDateList = [
  { label: "1 Month (30 Days)", value: "1 Month (30 Days)" },
  { label: "2 Months (60 Days)", value: "2 Months (60 Days)" },
  { label: "3 Months (90 Days)", value: "3 Months (90 Days)" },
  { label: "4 Months (120 Days)", value: "4 Months (120 Days)" },
  { label: "5 Months (150 Days)", value: "5 Months (150 Days)" },
  { label: "6 Months (180 Days)", value: "6 Months (180 Days)" },
  { label: "7 Months (210 Days)", value: "7 Months (210 Days)" },
  { label: "8 Months (240 Days)", value: "8 Months (240 Days)" },
  { label: "9 Months (270 Days)", value: "9 Months (270 Days)" },
  { label: "10 Months (300 Days)", value: "10 Months (300 Days)" },
  { label: "11 Months (330 Days)", value: "11 Months (330 Days)" },
  { label: "1 Year", value: "1 Year" },
  { label: "Onwards", value: "Onwards" },
];

const NewClient = ({
  update = false,
  id,
  clientDetails,
}) => {

  const { isModalOpen } = useSelector(
    (store) => store.helper
  );

  const dispatch = useDispatch();

  const [addClient, { isLoading: addLoading }] =
    useRegisterClientMutation();

  const [updateClient, { isLoading: updateLoading }] =
    useUpdateClientMutation();

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    control,
  } = useForm({
    defaultValues: {
      name: "",
      address: "",
      contractNo: "",
      email: "",
      startDate: "",
      endDate: null,
      phone: "",
    },
  });

  useEffect(() => {
    if (clientDetails) {
      reset({
        name: clientDetails.name || "",
        address: clientDetails.address || "",
        contractNo: clientDetails.contractNo || "",
        email: clientDetails.email || "",
        phone: clientDetails.phone || "",
        startDate: clientDetails.startDate || "",

        endDate: clientDetails.endDate
          ? {
            label: clientDetails.endDate,
            value: clientDetails.endDate,
          }
          : null,
      });
    }
  }, [clientDetails, reset]);

  const submit = async (data) => {
    try {

      const payload = {
        ...data,
        endDate:
          data.endDate?.value || "",
      };

      let res;

      if (update) {
        res = await updateClient({ id, data: payload, }).unwrap();
      } else {
        res = await addClient(payload).unwrap();
      }

      toast.success(res.msg);

      reset();

      dispatch(
        toggleModal({
          name: "newClient",
          status: false,
        })
      );

    } catch (error) {

      console.log(error);

      toast.error(
        error?.data?.msg || error.error
      );
    }
  };

  const formBody = (
    <div className="grid grid-cols-4 gap-x-2 pb-5 **:mt-0.5">

      <div className="col-span-3">
        <InputRow
          label="Client Name"
          id="name"
          errors={errors}
          register={register}
        />
      </div>

      <div>
        <InputRow
          label="Contract No"
          id="contractNo"
          errors={errors}
          register={register}
        />
      </div>

      <div className="col-span-2">
        <InputRow
          label="Client Address"
          id="address"
          errors={errors}
          register={register}
        />
      </div>

      <div className="col-span-2">
        <InputRow
          label="Client Phone"
          id="phone"
          errors={errors}
          register={register}
          type="tel"
        />
      </div>

      <div className="col-span-2">
        <InputRow
          label="Client Email"
          id="email"
          errors={errors}
          register={register}
          type="email"
        />
      </div>

      <div>
        <InputRow
          label="Start Date"
          id="startDate"
          errors={errors}
          register={register}
          type="date"
        />
      </div>

      <div>
        <Controller
          name="endDate"
          control={control}
          render={({ field }) => (
            <InputSelect
              label="End Date"
              options={endDateList}
              isMulti={false}
              isClearable
              value={field.value}
              onChange={field.onChange}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />
      </div>
    </div>
  );

  return (
    <div>

      {!update && (
        <Button
          height="h-10"
          color="bg-green-600"
          label={
            <div className="flex items-center">
              <MdAddCircle className="w-6 h-6 pr-1" />
              New Client
            </div>
          }
          onClick={() =>
            dispatch(
              toggleModal({
                name: "newClient",
                status: true,
              })
            )
          }
        />
      )}

      <FormModal
        onSubmit={handleSubmit(submit)}
        title={
          update
            ? "Update Client"
            : "New Client"
        }
        formBody={formBody}
        submitLabel={
          update
            ? "Update Client"
            : "Add Client"
        }
        handleClose={() =>
          dispatch(
            toggleModal({
              name: "newClient",
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
        open={isModalOpen.newClient}
      />
    </div>
  );
};

export default NewClient;