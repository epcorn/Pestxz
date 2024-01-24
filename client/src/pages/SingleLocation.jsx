import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AlertMessage, Button, InputSelect, Loading } from "../components";
import { ComplaintModal } from "../components/modals";
import { toggleModal } from "../redux/helperSlice";
import { useSingleLocationDetailsQuery } from "../redux/locationSlice";
import { useRegularServiceMutation } from "../redux/serviceSlice";
import { serviceActions } from "../utils/constData";
import { dateFormat, progress } from "../utils/helperFunctions";

const SingleLocation = () => {
  const { id } = useParams();
  const { user, isModalOpen } = useSelector((store) => store.helper);
  const [regular, setRegular] = useState(false);
  const dispatch = useDispatch();

  const { data, isLoading, error } = useSingleLocationDetailsQuery(id);
  const [regularService, { isLoading: regularLoading }] =
    useRegularServiceMutation();

  const {
    formState: { errors },
    handleSubmit,
    reset,
    control,
  } = useForm({
    defaultValues: {
      service: [
        {
          action: "",
          image: "",
        },
      ],
    },
  });

  const { fields } = useFieldArray({
    name: "service",
    control,
  });

  const submit = async (value) => {
    if (value.service.filter((item) => item.action).length < 1) {
      return toast.error("One service action is required");
    }

    const form = new FormData();

    form.append("name", "NA");
    form.append("action", "NA");
    form.append("upload", false);

    for (let i = 0; i < value.service.length; i++) {
      const item = value.service[i];
      if (item.image && !item.action) return toast.error("Action is required");
      if (item.action) {
        form.append("name", data.location?.service[i]?.label);
        form.append("action", item.action.label);
        form.append("upload", item.image ? true : false);
        form.append("images", item.image);
      }
    }

    try {
      const res = await regularService({ id, form }).unwrap();
      toast.success(res.msg);
      reset();
      setRegular(false);
    } catch (error) {
      console.log(error);
      toast.error(error?.data?.msg || error.error);
    }
  };

  const handleCancel = () => {
    setRegular(false);
    reset();
  };

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}
      {data && (
        <div>
          <h4>Floor - {data.location.floor}</h4>
          <h4>Location - {data.location.location}</h4>
          <h4 className="mb-2">Sub Location - {data.location.subLocation}</h4>
          {user.type === "ClientEmployee" && (
            <>
              <Button
                label="Raise Complaint"
                onClick={() =>
                  dispatch(toggleModal({ name: "complaint", status: true }))
                }
              />
              {isModalOpen.complaint && <ComplaintModal locationId={id} />}
            </>
          )}
          {data.complaints?.length > 0 && (
            <div className="overflow-y-auto my-3">
              <table className="w-full border whitespace-nowrap border-neutral-500 bg-text">
                <thead>
                  <tr className="h-8 w-full leading-none">
                    <th className="font-bold text-center border-neutral-500 w-40 border-2 px-3">
                      Complaint Number
                    </th>
                    <th className="font-bold text-center border-neutral-500 border-2 px-3">
                      Date
                    </th>
                    <th className="font-bold text-center border-neutral-500 border-2 px-3">
                      Pest
                    </th>
                    <th className="font-bold text-center border-neutral-500 border-2 w-24 px-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.complaints?.map((complaint) => (
                    <tr
                      key={complaint._id}
                      className="h-8 text-[14px] border-b border-neutral-500 hover:bg-slate-200"
                    >
                      <td className="px-3 border-r text-center border-neutral-500">
                        <Link
                          to={`/complaint/${complaint._id}`}
                          className="hover:text-blue-700 hover:font-medium"
                        >
                          {complaint.complaintDetails.number}
                        </Link>
                      </td>
                      <td className="px-3 border-r text-center border-neutral-500">
                        {dateFormat(complaint.createdAt)}
                      </td>
                      <td className="px-3 border-r text-center border-neutral-500">
                        {complaint.complaintDetails.service?.join(", ")}
                      </td>
                      <td className="px-3 border-r text-center border-neutral-500">
                        <p
                          className={`inline-flex items-center rounded-md px-2 font-medium ring-1 ring-gray-300
                      ${progress(complaint.complaintDetails.status)} `}
                        >
                          {complaint.complaintDetails.status}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <hr className="h-px my-4 border-0 bg-gray-700" />
          {data.lastServices.length > 0 && (
            <div className="overflow-y-auto my-3">
              <p className="text-center text-lg font-medium mb-3">
                {`Last ${data.lastServices.length} Recent Services`}
              </p>
              <table className="w-full border whitespace-nowrap border-neutral-500 bg-text">
                <thead>
                  <tr className="h-8 w-full leading-none">
                    <th className="font-bold text-center border-neutral-500 w-40 border-2 px-3">
                      Type
                    </th>
                    <th className="font-bold text-center border-neutral-500 border-2 px-3">
                      Date
                    </th>
                    <th className="font-bold text-center border-neutral-500 border-2 px-3">
                      Pest
                    </th>
                    <th className="font-bold text-center border-neutral-500 border-2 w-24 px-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.lastServices?.map((service) => (
                    <tr
                      key={service.id}
                      className="h-8 text-[14px] border-b border-neutral-500 hover:bg-slate-200"
                    >
                      <td className="px-3 border-r text-center border-neutral-500">
                        {service.type}
                      </td>
                      <td className="px-3 border-r text-center border-neutral-500">
                        {dateFormat(service.date)}
                      </td>
                      <td className="px-3 border-r text-center border-neutral-500">
                        {service.pest.join(", ")}
                      </td>
                      <td className="px-3 border-r text-center border-neutral-500">
                        {service.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {user.type === "PestEmployee" && (
            <div>
              {data.regularService?.regularService?.length > 0 && (
                <>
                  <h6 className="text-lg font-medium text-blue-700">
                    Last Regular Service Done
                  </h6>
                  <div className="overflow-y-auto my-3">
                    <table className="w-full border whitespace-nowrap border-neutral-500 bg-text">
                      <thead>
                        <tr className="h-8 w-full leading-none">
                          <th className="font-bold text-center border-neutral-500 border-2 px-3">
                            Date
                          </th>
                          <th className="font-bold text-center border-neutral-500 border-2 px-3">
                            Pest
                          </th>
                          <th className="font-bold text-center border-neutral-500 border-2 w-24 px-3">
                            Attended By
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="h-8 text-[14px] border-b border-neutral-500 hover:bg-slate-200">
                          <td className="px-3 border-r text-center border-neutral-500">
                            {dateFormat(data.regularService?.createdAt)}
                          </td>

                          <td className="px-3 border-r text-center border-neutral-500">
                            {data.regularService.regularService?.map(
                              (item) => item.name + ", "
                            )}
                          </td>
                          <td className="px-3 border-r text-center border-neutral-500">
                            <p
                              className={`inline-flex items-center rounded-md px-2 font-medium ring-1 ring-gray-300`}
                            >
                              {data.regularService.regularService[0].userName}
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <div className="flex justify-center items-center">
                {!regular ? (
                  <Button
                    label="Regular Service Update"
                    onClick={() => setRegular(true)}
                  />
                ) : (
                  <form
                    onSubmit={handleSubmit(submit)}
                    className="w-[70%] md:w-[40%]"
                  >
                    {data.location.service?.map((service, index) => (
                      <div key={index} className="mt-4">
                        <p className="text-center font-medium text-lg">
                          {service.label}
                        </p>
                        {fields.map((field) => {
                          return (
                            <div key={field.id}>
                              <Controller
                                name={`service[${index}].action`}
                                control={control}
                                render={({
                                  field: { onChange, value, ref },
                                }) => (
                                  <InputSelect
                                    options={serviceActions}
                                    onChange={onChange}
                                    value={value}
                                    label="Services Action"
                                  />
                                )}
                              />
                              <Controller
                                control={control}
                                name={`service[${index}].image`}
                                render={({
                                  field: { value, onChange, ...field },
                                }) => {
                                  return (
                                    <input
                                      {...field}
                                      onChange={(event) => {
                                        onChange(event.target.files[0]);
                                      }}
                                      type="file"
                                      id={`service[${index}].image`}
                                      className="mt-2"
                                      accept="image/*"
                                    />
                                  );
                                }}
                              />
                            </div>
                          );
                        })}
                        <hr className="h-px mt-5 mb-4 border-0 bg-gray-700" />
                      </div>
                    ))}
                    <div className="flex justify-center">
                      <Button
                        label="Submit"
                        type="submit"
                        height="h-9"
                        width="w-[45%]"
                        isLoading={regularLoading}
                        disabled={regularLoading}
                      />
                      <Button
                        label="Cancel"
                        color="bg-red-600"
                        height="h-9"
                        width="w-[45%]"
                        onClick={handleCancel}
                        disabled={regularLoading}
                      />
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
export default SingleLocation;
