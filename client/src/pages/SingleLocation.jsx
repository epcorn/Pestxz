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
import AllScheduleService from "../components/single_location/AllScheduleService";
import { IoIosArrowDown } from "react-icons/io";
import { useGetSingleUserQuery } from "../redux/userSlice";
import AllPremise from "../components/single_location/AllPremise";
import UnScheduledList from "../components/single_location/UnScheduledList";
import UnscheduledForm from "../components/single_location/UnscheduledForm";
import CasualLists from "../components/single_location/casual/CasualLists";
import CasualForm from "../components/single_location/casual/CasualForm";
import Headers from "../components/Headers";
import ProductShow from "../components/single_location/ProductShow";
import ProductServiceForm from "../components/modals/ProductServiceForm";


const SingleLocation = () => {
  const { id } = useParams();
  const { user, isModalOpen } = useSelector((store) => store.helper);
  const [regular, setRegular] = useState(false);
  const [toggleLists, setToggleLists] = useState("")
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setShow(true)
      } else { setShow(false) }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const { data: DBUser } = useGetSingleUserQuery(user._id, { skip: !user?._id })
  const { data, isLoading, error } = useSingleLocationDetailsQuery(id);
  const [regularService, { isLoading: regularLoading }] =
    useRegularServiceMutation();

  const handleCancel = () => {
    setRegular(false);
    reset();
  };

  const servicesIds = data?.location?.service?.map(s => s.serviceId);
  console.log(data?.location?.product?.length)
  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}
      {data && (
        <div>
          <div className="bg-white z-10 shadow-md px-5 pb-3 mb-5">
            <Headers header={'Location'} user={DBUser} />
            <div className="py-1 border-neutral-200">
              {/* Location Details */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-neutral-700">
                {user.type === "PestEmployee" && <div>
                  <span className="font-bold text-neutral-900">Client Name:</span>{" "}
                  {data.client}
                </div>}
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
          </div>
          {/* {show && */}
          <div
            className={`bg-slate-700 z-[5] w-[calc(100dvw-1rem)] md:w-[calc(100dvw-2rem)] lg:w-[calc(100dvw-18.5rem)] fixed top-22 md:top-22 lg:top-22 left-1/2 -translate-x-1/2 lg:left-auto lg:right-4 lg:translate-x-0 flex items-center gap-5 p-2 shadow-lg rounded-b-lg transition-all duration-500 origin-top ${show
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 -translate-y-4 pointer-events-none"
              }`}

          >{data.client &&
            <p className="px-2 bg-white text-slate-800 rounded "><strong></strong> {data?.client}</p>}
            <p className="px-2 bg-white text-slate-800 rounded">
              <strong> </strong>
              {`${data.location.floor}, ${data.location.location}, ${data.location.subLocation}`}
            </p>
          </div>

          {/* } */}

          {/* TABLE */}
          {data?.location?.service?.length > 0 &&
            <div>
              <ServiceShow services={data?.location?.service} />
            </div>
          }
          {data?.location?.product?.length > 0 &&
            <div>
              <ProductShow products={data?.location?.product} />
            </div>
          }
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
          {
            (DBUser?.rights.scan_Unscheduled || user.role === "Operator") && (
              <>
                <Button
                  label="Unscheduled Work"
                  onClick={() => dispatch(toggleModal({
                    name: "unscheduled",
                    status: true,
                  }))} />

                {isModalOpen.unscheduled && <UnscheduledForm existing={servicesIds} type={'raise'} locationId={data.location._id} />}
              </>
            )}
          {
            (["PestEmployee"].includes(user?.type)) && (
              <>
                <Button
                  label="Casual Service"
                  onClick={() => dispatch(toggleModal({
                    name: "casual",
                    status: true,
                  }))} />

                {/* {isModalOpen?.casual && <CasualForm mode="create" name={"casual"} client={data?.location?.client} />} */}
                {isModalOpen?.casual &&
                  <RegularForm serviceData={data.location.service} id={data?.location?._id} locationName={data?.location?.floor} type={'casual'} setRegular={isModalOpen?.casual} />}
              </>
            )}

          <div className="text-xs md:text-sm font-bold flex gap-3 my-5 *:outline *:px-2 *:py-1 *:rounded-2xl *:cursor-pointer *:transition-all">
            <span className={`${toggleLists === "allComp" ? "bg-blue-600 text-white" : ""}`}
              onClick={() => setToggleLists(toggleLists === "allComp" ? "" : 'allComp')}>
              Complaints</span>
            <span className={`${toggleLists === "allReg" ? "bg-blue-600 text-white" : ""}`}
              onClick={() => setToggleLists(toggleLists === "allReg" ? "" : "allReg")}>Scheduled</span>
            <span
              className={`${toggleLists === "allUnsch" ? "bg-blue-600 text-white" : ""}`}
              onClick={() => setToggleLists(toggleLists === "allUnsch" ? "" : "allUnsch")}>Un-Scheduled</span>
            <span
              className={`${toggleLists === "allCasual" ? "bg-blue-600 text-white" : ""}`}
              onClick={() => setToggleLists(toggleLists === "allCasual" ? "" : "allCasual")}>Casual</span>
          </div>
          {/* divider */}
          <hr className="h-px my-4 border-0 bg-gray-700" />
          {toggleLists === "allComp" &&
            <div className="bg-red-100 p-px mt-5 rounded-t-2xl">
              <h2 className="text-xl font-bold px-5 my-2 flex justify-between items-center"
              >
                <span>All Complaints ({data.complaints?.length})</span> <IoIosArrowDown className={`${isModalOpen?.allComp ? "rotate-180" : ""} transition-all`} />
              </h2>
              {data.complaints?.length > 0 ? (
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
                </div>)
                : <p className="top-20 text-center">No Complaints found...</p>
              }
            </div>
          }

          {/* all regular services */}
          {toggleLists === "allReg" &&
            <div className="bg-blue-200 p-px rounded-t-2xl">
              <h2 className="text-xl font-bold px-5 my-2 flex justify-between items-center"
              >
                <span>All Scheduled Services Done({data?.regularService.length || 0})</span>
                <IoIosArrowDown className={`${isModalOpen?.allReg ? "rotate-180" : ""} transition-all`} />
              </h2>
              <AllScheduleService data={data?.regularService} />
            </div>
          }
          {toggleLists === "allUnsch" &&
            <div className="bg-blue-200 p-px rounded-t-2xl">
              <h2 className="text-base md:text-xl font-bold px-5 my-2 flex justify-between items-center"
              >
                <span>All Un-Scheduled Services({data?.unscheduled.length || 0})</span>
                <IoIosArrowDown className={`${isModalOpen?.allReg ? "rotate-180" : ""} transition-all`} />
              </h2>
              {!isLoading && <UnScheduledList work={data?.unscheduled || []} />}
            </div>
          }
          {toggleLists === "allCasual" &&
            <div className="bg-blue-200 p-px rounded-t-2xl">
              <h2 className="text-base md:text-xl font-bold px-5 my-2 flex justify-between items-center"
              >
                <span>All Casual Services({data?.casuals?.length || 0})</span>
                <IoIosArrowDown className={`${isModalOpen?.allCasual ? "rotate-180" : ""} transition-all`} />
              </h2>
              <CasualLists work={data?.casuals || []} />
            </div>
          }

          {/* product service form  */}
          {data?.location?.product?.length > 0 &&
            <ProductServiceForm products={data?.location?.product} />
          }
          {/* last regular service */}
          {DBUser && DBUser?.rights?.scan_Scheduled && (
            <div>
              {/* Form / Button Action Container */}
              <div className="flex justify-center items-center mt-5 pt-2">
                <div className="w-full bg-neutral-50 rounded-xl border border-neutral-200 shadow-inner">
                  <RegularForm serviceData={data?.location?.service} id={data?.location?._id} locationName={data?.location?.floor} type={'regular'} setRegular={setRegular} />
                </div>
              </div>
              {/* all premise service */}
              <div className="my-5 p-3 bg-slate-500 rounded-t-2xl">
                <h2 className="font-bold text-lg px-2">
                  All Premise Services
                </h2>
                <AllPremise />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
export default SingleLocation;

