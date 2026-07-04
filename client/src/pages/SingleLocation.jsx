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

  const tabs = [
    { key: "allComp", label: "Complaints" },
    { key: "allReg", label: "Scheduled" },
    { key: "allUnsch", label: "Un-Scheduled" },
    { key: "allCasual", label: "Casual" },
  ];

  return (
    <>
      {isLoading && <Loading />}
      {!isLoading && error && (
        <div className="px-5">
          <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
        </div>
      )}

      {data && (
        <div className="pb-10">

          {/* ===== HEADER ===== */}
          <div className="bg-white z-10 shadow-sm px-5 pb-4 mb-6 rounded-b-2xl">
            <Headers header={'Location'} user={DBUser} />

            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {user.type === "PestEmployee" && (
                <div className="bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200">
                  <p className="text-[11px] uppercase tracking-wide text-neutral-400 font-semibold">Client</p>
                  <p className="text-neutral-800 font-medium truncate">{data.client}</p>
                </div>
              )}
              <div className="bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200">
                <p className="text-[11px] uppercase tracking-wide text-neutral-400 font-semibold">Floor</p>
                <p className="text-neutral-800 font-medium truncate">{data.location.floor}</p>
              </div>
              <div className="bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200">
                <p className="text-[11px] uppercase tracking-wide text-neutral-400 font-semibold">Location</p>
                <p className="text-neutral-800 font-medium truncate">{data.location.location}</p>
              </div>
              <div className="bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200">
                <p className="text-[11px] uppercase tracking-wide text-neutral-400 font-semibold">Sub Location</p>
                <p className="text-neutral-800 font-medium truncate">{data.location.subLocation}</p>
              </div>
            </div>
          </div>

          {/* ===== FLOATING STICKY SUMMARY BAR (unchanged behavior) ===== */}
          <div
            className={`bg-slate-700 z-[5] w-[calc(100dvw-1rem)] md:w-[calc(100dvw-2rem)] lg:w-[calc(100dvw-18.5rem)] fixed top-22 md:top-22 lg:top-22 left-1/2 -translate-x-1/2 lg:left-auto lg:right-4 lg:translate-x-0 flex items-center gap-3 p-2 shadow-lg rounded-b-lg transition-all duration-500 origin-top ${show
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 -translate-y-4 pointer-events-none"
              }`}
          >
            {data.client && (
              <p className="px-3 py-1 bg-white text-slate-800 rounded-md text-sm font-medium">
                {data?.client}
              </p>
            )}
            <p className="px-3 py-1 bg-white text-slate-800 rounded-md text-sm">
              {`${data.location.floor}, ${data.location.location}, ${data.location.subLocation}`}
            </p>
          </div>

          <div className="px-0 space-y-6">

            {/* ===== SERVICE / PRODUCT TABLES ===== */}
            {(data?.location?.service?.length > 0 || data?.location?.product?.length > 0) && (
              <div className="space-y-4">
                {data?.location?.service?.length > 0 && (
                  <ServiceShow services={data?.location?.service} />
                )}
                {data?.location?.product?.length > 0 && (
                  <ProductShow products={data?.location?.product} />
                )}
              </div>
            )}

            {/* ===== ACTION BUTTONS ===== */}
            <div className="flex flex-wrap gap-3 bg-white fixed right-0 opacity-25 hover:opacity-100 transition-all duration-200 z-99 bottom-0">
              {DBUser?.rights?.raise && id && (
                <Button
                  label="Raise Complaint"
                  onClick={() => dispatch(toggleModal({
                    name: "complaint",
                    status: true,
                  }))} />
              )}

              {(DBUser?.rights.scan_Unscheduled || user.role === "Operator") && (
                <Button
                  label="Unscheduled Work"
                  onClick={() => dispatch(toggleModal({
                    name: "unscheduled",
                    status: true,
                  }))} />
              )}

              {(["PestEmployee"].includes(user?.type)) && (
                <Button
                  label="Casual Service"
                  onClick={() => dispatch(toggleModal({
                    name: "casual",
                    status: true,
                  }))} />
              )}
            </div>

            {/* modals tied to the buttons above (logic unchanged) */}
            {DBUser?.rights.raise && id && isModalOpen.complaint && (
              <ComplaintModal
                locationId={data?.location?._id}
                mode="create"
              />
            )}
            {(DBUser?.rights.scan_Unscheduled || user.role === "Operator") && isModalOpen.unscheduled && (
              <UnscheduledForm existing={servicesIds} type={'raise'} locationId={data.location._id} />
            )}
            {(["PestEmployee"].includes(user?.type)) && isModalOpen?.casual && (
              <RegularForm serviceData={data?.location?.service} id={data?.location?._id} locationName={data?.location?.floor} type={'casual'} setRegular={isModalOpen?.casual} />
            )}

            {/* ===== TABS ===== */}
            <div>
              <div className="flex flex-wrap gap-2 text-xs md:text-sm font-semibold border-b border-neutral-200 pb-3">
                {tabs.map(({ key, label }) => (
                  <span
                    key={key}
                    onClick={() => setToggleLists(toggleLists === key ? "" : key)}
                    className={`px-4 py-1.5 rounded-full cursor-pointer transition-all ${toggleLists === key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-blue-100 text-neutral-600 hover:bg-blue-200"
                      }`}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* ===== TAB CONTENT ===== */}
              <div className="mt-4">
                {toggleLists === "allComp" && (
                  <div className="bg-white rounded-2xl border border-red-100 overflow-hidden shadow-sm">
                    <h2 className="text-lg font-bold px-5 py-3 bg-red-50 flex justify-between items-center">
                      <span>All Complaints ({data.complaints?.length})</span>
                      <IoIosArrowDown className={`${isModalOpen?.allComp ? "rotate-180" : ""} transition-all`} />
                    </h2>

                    {data.complaints?.length > 0 ? (
                      <div>
                        <div className="hidden md:grid grid-cols-12 bg-neutral-100 border-b border-neutral-200 text-sm font-bold uppercase tracking-wider text-neutral-600 py-3 px-4 text-center">
                          <div className="col-span-2 text-left">Complaint No.</div>
                          <div className="col-span-2">Date</div>
                          <div className="col-span-4 text-left">Service</div>
                          <div className="col-span-2">Raised By</div>
                          <div className="col-span-2">Status</div>
                        </div>

                        <div className="divide-y divide-neutral-200">
                          {data.complaints?.map((complaint) => (
                            <Link
                              key={complaint._id}
                              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-0 items-center py-4 px-4 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                              to={`/complaint/${complaint._id}`}
                            >
                              <div className="col-span-1 md:col-span-2 flex justify-between md:block items-center">
                                <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">No:</span>
                                <span className="text-blue-600 font-medium hover:underline">
                                  {complaint.complaintDetails.number}
                                </span>
                              </div>

                              <div className="col-span-1 md:col-span-2 flex justify-between md:block md:text-center items-center">
                                <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Date:</span>
                                <span className="text-neutral-500 md:text-neutral-700">{dateFormat(complaint.createdAt)}</span>
                              </div>

                              <div className="col-span-1 md:col-span-4 flex justify-between md:block items-center">
                                <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Service:</span>
                                <span className="truncate max-w-[200px] md:max-w-none text-right md:text-left">
                                  {complaint.complaintDetails.service?.join(", ")}
                                </span>
                              </div>

                              <div className="col-span-1 md:col-span-2 flex justify-between md:block md:text-center items-center">
                                <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">By:</span>
                                <span>{complaint?.complaintDetails?.userName}</span>
                              </div>

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
                    ) : (
                      <p className="text-center text-neutral-500 py-6">No Complaints found...</p>
                    )}
                  </div>
                )}

                {toggleLists === "allReg" && (
                  <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
                    <h2 className="text-lg font-bold px-5 py-3 bg-blue-50 flex justify-between items-center">
                      <span>All Scheduled Services Done ({data?.regularService.length || 0})</span>
                      <IoIosArrowDown className={`${isModalOpen?.allReg ? "rotate-180" : ""} transition-all`} />
                    </h2>
                    <div className="p-2">
                      <AllScheduleService data={data?.regularService} />
                    </div>
                  </div>
                )}

                {toggleLists === "allUnsch" && (
                  <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
                    <h2 className="text-base md:text-lg font-bold px-5 py-3 bg-blue-50 flex justify-between items-center">
                      <span>All Un-Scheduled Services ({data?.unscheduled.length || 0})</span>
                      <IoIosArrowDown className={`${isModalOpen?.allReg ? "rotate-180" : ""} transition-all`} />
                    </h2>
                    <div className="p-2">
                      {!isLoading && <UnScheduledList work={data?.unscheduled || []} />}
                    </div>
                  </div>
                )}

                {toggleLists === "allCasual" && (
                  <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
                    <h2 className="text-base md:text-lg font-bold px-5 py-3 bg-blue-50 flex justify-between items-center">
                      <span>All Casual Services ({data?.casuals?.length || 0})</span>
                      <IoIosArrowDown className={`${isModalOpen?.allCasual ? "rotate-180" : ""} transition-all`} />
                    </h2>
                    <div className="p-2">
                      <CasualLists work={data?.casuals || []} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ===== PRODUCT SERVICE FORM ===== */}
            {DBUser?.rights?.scan_Scheduled && data?.location?.product?.length > 0 && (
              <ProductServiceForm products={data?.location?.product} />
            )}

            {/* ===== REGULAR SERVICE FORM + PREMISE HISTORY ===== */}
            {DBUser && DBUser?.rights?.scan_Scheduled && (
              <div className="space-y-6">
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 shadow-inner p-1">
                  <RegularForm serviceData={data?.location?.service} id={data?.location?._id} locationName={data?.location?.floor} type={'regular'} setRegular={setRegular} />
                </div>

                <div className="bg-slate-500 rounded-2xl p-4">
                  <h2 className="font-bold text-lg text-white px-1 mb-2">
                    All Premise Services
                  </h2>
                  <AllPremise />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
export default SingleLocation;