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
import RegularForm from "../components/modals/RegularForm";
import ServiceShow from "../components/single_location/ServiceShow";
import LastRecentService from "../components/single_location/LastRecentService";

const SingleLocation = () => {
  const { id } = useParams();

  const { user, isModalOpen } = useSelector((store) => store.helper);
  const [regular, setRegular] = useState(false);
  const dispatch = useDispatch();

  const { data, isLoading, error } = useSingleLocationDetailsQuery(id);
  const [regularService, { isLoading: regularLoading }] =
    useRegularServiceMutation();

  const handleCancel = () => {
    setRegular(false);
    reset();
  };

  console.log(data)
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
          <div>
            <ServiceShow services={data?.location?.service} />
          </div>
          {
            user.rights.raise && id && (
              <>
                <Button
                  label="Raise Complaint"
                  onClick={() => dispatch(toggleModal({
                    name: "complaint",
                    status: true,
                  }))} />

                {isModalOpen.complaint && (
                  <ComplaintModal
                    locationId={data?.location?._id}
                    mode="create"
                  />
                )}
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
                      <p className="text-[0.65rem] outline text-gray-500 rounded-xl w-fit md:mx-auto px-2 ">{user.role}</p>
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
          <LastRecentService data={data?.lastServices} />

          {/* last regular service */}
          {user.type === "PestEmployee" && (
            <div>
              {data.regularService?.regularService?.length > 0 && (
                <>
                  <h6 className="text-base font-semibold text-neutral-900 mb-3">
                    Last Regular Service
                  </h6>

                  <div className="my-4 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
                    {/* DESKTOP HEADER (Hidden on Mobile) */}
                    <div className="hidden md:grid grid-cols-14 bg-neutral-50 border-b border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-500 py-3 px-4 gap-4 text-center items-center">
                      <div className="col-span-2 text-left">Date</div>
                      <div className="col-span-2">Image</div>
                      <div className="col-span-6 text-left">Service Details</div>
                      <div className="col-span-2">Attended By</div>
                      <div className="col-span-2">status</div>
                    </div>

                    {/* SINGLE INTEGRATED LOOP GENERATING CONTROLLED DATA ROWS */}
                    <div className="divide-y divide-neutral-200">
                      {data.regularService.regularService.map((item, index) => (
                        <div
                          key={item._id || index}
                          className="grid grid-cols-1 md:grid-cols-14 gap-3 md:gap-4 items-center py-4 px-4 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
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
                          {/* status */}
                          <div className="col-span-1 md:col-span-2 flex justify-between md:block md:text-center items-center pt-2 md:pt-0 border-t md:border-none border-neutral-100">
                            <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Status</span>
                            <span className="inline-flex items-center rounded-full bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-600 border border-neutral-200">
                              {item.action}
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
                    label="Schedule Service Update"
                    onClick={() => setRegular(true)}
                  />
                ) : (
                  <div className="w-full bg-neutral-50 rounded-xl border border-neutral-200 shadow-inner">
                    {/* <SingleServiceForm
                      serviceData={data.location.service}
                      id={data?.location?._id} setRegular={setRegular}
                    /> */}
                    <RegularForm serviceData={data.location.service} id={data?.location?._id} locationName={data?.location?.floor} setRegular={setRegular} />
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

