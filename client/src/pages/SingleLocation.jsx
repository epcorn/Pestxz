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
import { IoIosArrowDown } from "react-icons/io";
import { useGetSingleUserQuery } from "../redux/userSlice";
import AllPremise from "../components/single_location/AllPremise";


const SingleLocation = () => {
  const { id } = useParams();

  const { user, isModalOpen } = useSelector((store) => store.helper);
  const [regular, setRegular] = useState(false);
  const dispatch = useDispatch();

  const { data: DBUser } = useGetSingleUserQuery(user._id, { skip: !user?._id })
  const { data, isLoading, error } = useSingleLocationDetailsQuery(id);
  const [regularService, { isLoading: regularLoading }] =
    useRegularServiceMutation();

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
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-light text-slate-800">
              Hello, <span className="capitalize font-semibold text-sky-700">{user.name}</span>
            </h2>
            <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-medium tracking-wide bg-slate-100 text-slate-600 rounded-full border border-slate-200">
              {user.role}
            </span>
          </div>
          <div className="py-1 border-b border-neutral-200">
            {/* Location Details */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-neutral-700">
              <div>
                <span className="font-bold text-neutral-900">Client Name:</span>{" "}
                {data.client}
              </div>
              <div>
                <span className="font-bold text-neutral-900">Floor:</span>{" "}
                {data.location.floor}
              </div>
              <div>
                <span className="font-bold text-neutral-900">Location:</span>{" "}
                {data.location.location}
              </div>
              <div className="">
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
            DBUser?.rights.raise && id && (
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
          <div className="bg-red-100 p-px mt-5 rounded-t-2xl">
            <h2 className="text-xl font-bold px-5 my-2 flex justify-between items-center"
              onClick={() => dispatch(toggleModal({ name: "allComp", status: !isModalOpen?.allComp }))}>
              <span>All Complaints ({data.complaints?.length})</span> <IoIosArrowDown className={`${isModalOpen?.allComp ? "rotate-180" : ""} transition-all`} />
            </h2>
            {isModalOpen.allComp && data.complaints?.length > 0 && (
              <div className="mb-1 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm ">
                {/* DESKTOP HEADER (Hidden on Mobile) */}
                <div className="hidden md:grid grid-cols-12 bg-neutral-100 border-b border-neutral-200 text-sm font-bold uppercase tracking-wider text-neutral-600 py-3 px-4 text-center">
                  <div className="col-span-2 text-left">Complaint No.</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-4 text-left">Service</div>
                  <div className="col-span-2">Raised By</div>
                  <div className="col-span-2">Status</div>
                </div>

                {/* ROWS / CARDS LIST */}
                <div className="divide-y divide-neutral-200">
                  {data.complaints?.map((complaint) => (
                    <Link
                      key={complaint._id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-0 items-center py-4 px-4 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      to={`/complaint/${complaint._id}`}
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
                        <span>{complaint?.complaintDetails?.userName}</span>
                        {/* <p className="text-[0.65rem] outline text-gray-500 rounded-xl w-fit md:mx-auto px-2 ">{user.role}</p> */}
                      </div>

                      {/* 5. Status */}
                      <div className="col-span-1 md:col-span-2 flex justify-between md:block md:text-center items-center mt-1 md:mt-0">
                        <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Status:</span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${progress(complaint.complaintDetails.status)}`}>
                          {complaint.complaintDetails.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* divider */}
          <hr className="h-px my-4 border-0 bg-gray-700" />
          {/* all regular services */}
          <div className="bg-blue-200 p-px rounded-t-2xl">
            <h2 className="text-xl font-bold px-5 my-2 flex justify-between items-center"
              onClick={() => dispatch(toggleModal({ name: "allReg", status: !isModalOpen?.allReg }))}>
              <span>All Scheduled Services Done({data?.regularService.length})</span>
              <IoIosArrowDown className={`${isModalOpen?.allReg ? "rotate-180" : ""} transition-all`} />
            </h2>
            {isModalOpen?.allReg &&
              <LastRecentService data={data?.regularService} />
            }
          </div>

          {/* last regular service */}
          {user.type === "PestEmployee" && (
            <div>
              {/* Form / Button Action Container */}
              <div className="flex justify-center items-center mt-5 pt-2">
                <div className="w-full bg-neutral-50 rounded-xl border border-neutral-200 shadow-inner">
                  <RegularForm serviceData={data.location.service} id={data?.location?._id} locationName={data?.location?.floor} setRegular={setRegular} />
                </div>
              </div>
              {/* all premise service */}
              {/* <div className="my-5 p-3 bg-slate-500 rounded-t-2xl">
                <h2 className="font-bold text-lg px-2">
                  All Premise Services
                </h2>
                <AllPremise data={data}/>
              </div> */}
            </div>
          )}
        </div>
      )}
    </>
  );
};
export default SingleLocation;

