import { useEffect, useState } from "react";
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
import {
  dateFormat,
  decodeBase64Svg,
  progress,
} from "../utils/helperFunctions";
import SingleServiceForm from "../components/SingleServiceForm";
import ImagesModal from "../components/modals/ImagesModal";

const SingleLocation = () => {
  const { id } = useParams();
  const { user, isModalOpen } = useSelector((store) => store.helper);
  const [regular, setRegular] = useState(false);
  const dispatch = useDispatch();

  const { data, isLoading, error } = useSingleLocationDetailsQuery(id);
  const [regularService, { isLoading: regularLoading }] =
    useRegularServiceMutation();

  console.log(data);


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

  const { fields } = useFieldArray({ name: "service", control });

  // const submit = async (value) => {
  //   if (value.service.filter((item) => item.action).length < 1) {
  //     return toast.error("One service action is required");
  //   }

  //   const form = new FormData();

  //   form.append("name", "NA");
  //   form.append("action", "NA");
  //   form.append("upload", false);
  //   for (let i = 0; i < value.service.length; i++) {
  //     const item = value.service[i];
  //     if (item.image && !item.action)
  //       return toast.error("Action is required");
  //     if (item.action) {
  //       form.append("name", data.location?.service[i]?.serviceName);
  //       form.append("action", item.action.label);
  //       form.append("upload", item.image ? true : false);
  //       if (item.image instanceof File || item.image instanceof Blob) {
  //         form.append("images", item.image);
  //       } else {
  //         form.append("images", "");
  //       }
  //     }
  //   }
  //   for (let pair of form.entries()) {
  //     console.log(pair[0], pair[1])
  //   }
  //   try {
  //     const res = await regularService({ id, form }).unwrap();
  //     toast.success(res.msg);
  //     reset();
  //     setRegular(false);
  //   } catch (error) {
  //     console.log(error);
  //     toast.error(error?.data?.msg || error.error);
  //   }
  // };

  const handleCancel = () => {
    setRegular(false);
    reset();
  };

  // const rawSvg = decodeBase64Svg(data?.location.qr);

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}
      {data && (
        <div>
          <div className="py-1 border-b border-neutral-200">
            {/* Header Section */}
            <div className="mb-4 text-center">
              <h2 className="text-xl font-bold text-neutral-900">
                {data.client}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {user.name} &middot; {user.role}
              </p>
            </div>

            {/* Location Details */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-neutral-700">
              <div>
                <span className="font-bold text-neutral-900">Floor:</span>{" "}
                {data.location.floor}
              </div>
              <div>
                <span className="font-bold text-neutral-900">Location:</span>{" "}
                {data.location.location}
              </div>
              <div className="col-span-2">
                <span className="font-bold text-neutral-900">
                  Sub Location:
                </span>{" "}
                {data.location.subLocation}
              </div>
            </div>
          </div>

          {/* TABLE */}

          <div className="border border-gray-400 rounded overflow-hidden">
            {/* HEADER */}
            <div className={`grid ${(user.role === "ClientAdmin" || user.role === "ClientEmployee") ? "grid-cols-2" : "grid-cols-5"} bg-gray-100 font-semibold text-sm`}>
              <div className="border-r border-gray-400 px-1 py-1 md:px-2 md:py-2">Service</div>

              {user.role !== "ClientAdmin" && user.role !== "ClientEmployee" && (
                <>
                  <div className="border-r border-gray-400 px-2 py-2">Scope</div>
                  <div className="border-r border-gray-400 px-2 py-2">Consumable</div>
                  <div className="border-r border-gray-400 px-2 py-2">Calibration</div>
                </>
              )}

              <div className="px-2 md:py-2 py-1">Frequency</div>
            </div>

            {/* BODY */}
            {data.location.service?.map((s, index) => (
              <div key={index} className={`grid ${(user.role === "ClientAdmin" || user.role === "ClientEmployee") ? "grid-cols-2" : "grid-cols-5"} text-sm border-t border-gray-300`}>
                <div className="border-r border-gray-300 px-1 py-1 md:px-2 md:py-2">
                  {s.serviceName}
                </div>

                {user.role !== "ClientAdmin" && user.role !== "ClientEmployee" && (
                  <>
                    <div className="border-r border-gray-300 px-2 py-2">
                      {s.scopeName}
                    </div>
                    <div className="border-r border-gray-300 px-2 py-2">
                      {s.consumableName}
                    </div>
                    <div className="border-r border-gray-300 px-2 py-2">
                      {s.calibration || "-"}
                    </div>
                  </>
                )}

                <div className="px-2 md:py-2 py-1 capitalize">
                  {s.frequency}
                </div>
              </div>
            ))}
          </div>


          {/* QR svg*/}
          {/* <div className="ml-auto pr-2 md:pr-5">
              <img src={`data:image/svg+xml;base64,${rawSvg}`} alt="" className="h-40 ml-auto block" />
            </div> */}

          {user.rights.raise && (
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
            <div className="my-4 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">

              {/* DESKTOP HEADER (Hidden on Mobile) */}
              <div className="hidden md:grid grid-cols-12 bg-neutral-50 border-b border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-600 py-3 px-4 text-center">
                <div className="col-span-2 text-left">Complaint No.</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-4 text-left">Service</div>
                <div className="col-span-2">Raised By</div>
                <div className="col-span-2">Status</div>
              </div>

              {/* ROWS / CARDS LIST */}
              <div className="divide-y divide-neutral-200">
                {data.complaints?.map((complaint) => (
                  <div
                    key={complaint._id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-0 items-center py-4 px-4 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    {/* 1. Complaint Number */}
                    <div className="col-span-1 md:col-span-2 flex justify-between md:block items-center">
                      <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">No:</span>
                      <Link
                        to={`/complaint/${complaint._id}`}
                        className="text-blue-600 font-medium hover:underline"
                      >
                        {complaint.complaintDetails.number}
                      </Link>
                    </div>

                    {/* 2. Date */}
                    <div className="col-span-1 md:col-span-2 flex justify-between md:block md:text-center items-center">
                      <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Date:</span>
                      <span className="text-neutral-500 md:text-neutral-700">{dateFormat(complaint.createdAt)}</span>
                    </div>

                    {/* 3. Service */}
                    <div className="col-span-1 md:col-span-4 flex justify-between md:block items-center">
                      <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Service:</span>
                      <span className="truncate max-w-[200px] md:max-w-none text-right md:text-left">
                        {complaint.complaintDetails.service?.join(", ")}
                      </span>
                    </div>

                    {/* 4. Raised By */}
                    <div className="col-span-1 md:col-span-2 flex justify-between md:block md:text-center items-center">
                      <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">By:</span>
                      <span>{complaint.complaintDetails.userName}</span>
                    </div>

                    {/* 5. Status */}
                    <div className="col-span-1 md:col-span-2 flex justify-between md:block md:text-center items-center mt-1 md:mt-0">
                      <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Status:</span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${progress(complaint.complaintDetails.status)}`}>
                        {complaint.complaintDetails.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <hr className="h-px my-4 border-0 bg-gray-700" />
          {data?.lastServices?.length > 0 && (
            <div className="my-6">
              {/* Clean, Classic Header */}
              <h6 className="text-base font-semibold text-neutral-900 mb-3 text-center md:text-left">
                Last {data?.lastServices?.length} Recent Services
              </h6>

              {/* Main Container */}
              <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">

                {/* DESKTOP HEADER (Hidden on Mobile) */}
                <div className="hidden md:flex items-center bg-neutral-50 border-b border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-500 py-3 px-4 gap-4 text-center">
                  <div className="w-36 text-left shrink-0">Type</div>
                  <div className="w-32 shrink-0">Date</div>
                  <div className="flex-1 text-left">Pest Details</div>
                  <div className="flex-1 text-left">Attend by</div>
                  <div className="w-28 shrink-0">Status</div>
                </div>

                {/* ROWS / MOBILE CARDS LIST */}
                <div className="divide-y divide-neutral-200">
                  {data.lastServices?.map((service) => (
                    <div
                      key={service.id}
                      className="flex flex-col md:flex-row md:items-center py-4 px-4 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors gap-3 md:gap-4"
                    >
                      {/* 1. Type */}
                      <div className="w-full md:w-36 flex justify-between md:block items-center shrink-0">
                        <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Type</span>
                        <span className="font-semibold text-neutral-900 md:font-normal">{service.type}</span>
                      </div>

                      {/* 2. Date */}
                      <div className="w-full md:w-32 flex justify-between md:block md:text-center items-center shrink-0">
                        <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Date</span>
                        <span className="text-neutral-500 md:text-neutral-700">{dateFormat(service.date)}</span>
                      </div>

                      {/* 3. Pest Details */}
                      <div className="w-full flex-1 flex flex-col md:block items-start justify-between min-w-0">
                        <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase mb-0.5">Pest Details</span>
                        <div className="flex flex-wrap items-center gap-1.5 text-neutral-800">
                          <span className="font-medium text-neutral-900">{service.pest[0]?.name}</span>
                          {service.pest[0]?.scope && (
                            <>
                              <span className="text-neutral-300">|</span>
                              <span className="text-neutral-500 text-xs bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded">
                                {service.pest[0]?.scope}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 4. Status */}
                      <div className="w-full md:w-28 flex justify-between md:block md:text-center items-center shrink-0 pt-2 md:pt-0 border-t md:border-none border-neutral-100">
                        <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Status</span>
                        <span className="inline-flex items-center rounded-full bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-600 border border-neutral-200">
                          {service.action}
                        </span>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* last regular service */}
          {user.type === "PestEmployee" && (
            <div>
              {data.regularService?.regularService?.length > 0 && (
                <>
                  <h6 className="text-base font-semibold text-neutral-900 mb-3">
                    Last Regular Service Done
                  </h6>

                  <div className="my-4 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
                    {/* DESKTOP HEADER (Hidden on Mobile) */}
                    <div className="hidden md:grid grid-cols-12 bg-neutral-50 border-b border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-500 py-3 px-4 gap-4 text-center items-center">
                      <div className="col-span-2 text-left">Date</div>
                      <div className="col-span-2">Image</div>
                      <div className="col-span-6 text-left">Service Details</div>
                      <div className="col-span-2">Attended By</div>
                    </div>

                    {/* SINGLE INTEGRATED LOOP GENERATING CONTROLLED DATA ROWS */}
                    <div className="divide-y divide-neutral-200">
                      {data.regularService.regularService.map((item, index) => (
                        <div
                          key={item._id || index}
                          className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center py-4 px-4 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                        >
                          {/* 1. Date (Shows only once per entry row) */}
                          <div className="col-span-1 md:col-span-2 flex justify-between md:block items-center">
                            <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Date</span>
                            <span className="text-neutral-500 md:text-neutral-700">
                              {dateFormat(data.regularService?.createdAt)}
                            </span>
                          </div>

                          {/* 2. Image Button Trigger */}
                          <div className="col-span-1 md:col-span-2 flex justify-between md:block md:text-center items-center">
                            <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Image</span>
                            <div>
                              {item.image ? (
                                <>
                                  <Button
                                    label="Show"
                                    small
                                    height="h-7"
                                    color="bg-green-600 text-xs text-white px-3 py-0.5 rounded transition-colors hover:bg-green-700"
                                    onClick={() => dispatch(toggleModal({ name: `PEImage-${index}`, status: true }))}
                                  />
                                  {isModalOpen[`PEImage-${index}`] && (
                                    <ImagesModal image={item.image} name={`PEImage-${index}`} />
                                  )}
                                </>
                              ) : (
                                <span className="text-neutral-400 text-xs">—</span>
                              )}
                            </div>
                          </div>

                          {/* 3. Pest / Service Details Inline Track */}
                          <div className="col-span-1 md:col-span-6 flex flex-col md:block items-start justify-between min-w-0">
                            <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase mb-1">Service Details</span>
                            <div className="flex flex-wrap items-center gap-1.5 text-neutral-700 w-full">
                              <span className="font-semibold text-neutral-900">{item.serviceName}</span>
                              <span className="text-neutral-300">|</span>
                              <span>{item.scopeName}</span>
                              <span className="text-neutral-300">•</span>
                              <span className="text-neutral-500">{item.consumableName}</span>
                              <span className="text-neutral-300">•</span>
                              <span className="text-xs bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-200">
                                Cal: {item.calibration} ({item.usedCalibration})
                              </span>
                            </div>
                          </div>

                          {/* 4. Attended By Column */}
                          <div className="col-span-1 md:col-span-2 flex justify-between md:block md:text-center items-center pt-2 md:pt-0 border-t md:border-none border-neutral-100">
                            <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Attended By</span>
                            <span className="inline-flex items-center rounded-full bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-600 border border-neutral-200">
                              {item.userName || data.regularService.regularService[0]?.userName}
                            </span>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Form / Button Action Container */}
              <div className="flex justify-center items-center mt-5 pt-2">
                {!regular ? (
                  <Button
                    label="Regular Service Update"
                    onClick={() => setRegular(true)}
                  />
                ) : (
                  <div className="w-full bg-neutral-50 p-4 rounded-xl border border-neutral-200 shadow-inner">
                    <SingleServiceForm
                      serviceData={data.location.service}
                      id={data?.location?._id}
                    />
                  </div>
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

// <form
//   onSubmit={handleSubmit(submit)}
//   className="w-[70%] md:w-[40%]"
// >
//   {data.location.service?.map((service, index) => (
//     <div key={index} className="mt-4">

//       <p className="text-center font-medium text-lg">
//         {service.serviceName}
//       </p>

//       <Controller
//         name={`service[${index}].action`}
//         control={control}
//         render={({ field: { onChange, value } }) => (
//           <InputSelect
//             options={serviceActions}
//             onChange={onChange}
//             value={value}
//             label={`Service Action - ${service.serviceName}`}
//           />
//         )}
//       />

//       <Controller
//         control={control}
//         name={`service.${index}.image`}
//         defaultValue={null}
//         render={({ field: { onChange, ref } }) => (
//           <input
//             ref={ref}
//             type="file"
//             className="mt-2"
//             accept="image/*"
//             onChange={(e) => {
//               onChange(e.target.files[0]);
//             }}
//           />
//         )}
//       />

//       <hr className="h-px mt-5 mb-4 border-0 bg-gray-700" />
//     </div>
//   ))}
//   <div className="flex justify-center">
//     <Button
//       label="Submit"
//       type="submit"
//       height="h-9"
//       width="w-[45%]"
//       isLoading={regularLoading}
//       disabled={regularLoading}
//     />
//     <Button
//       label="Cancel"
//       color="bg-red-600"
//       height="h-9"
//       width="w-[45%]"
//       onClick={handleCancel}
//       disabled={regularLoading}
//     />
//   </div>
// </form>
