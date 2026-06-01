import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import { useSingleComplaintQuery } from "../redux/serviceSlice";
import { useGetSingleLocationQuery } from "../redux/locationSlice";
import { useGetSingleUserQuery } from "../redux/userSlice";
import { toggleModal } from "../redux/helperSlice";
import { AlertMessage, Button, Loading } from "../components";
import { ComplaintModal } from "../components/modals";
import ImagesModal from "../components/modals/ImagesModal";
import {
  dateFormat,
  nagative,
  positive,
  progress,
  progressBlink
} from "../utils/helperFunctions";

const SingleComplaint = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const [rating, setRating] = useState({ id: null, rating: null });
  const { user, isModalOpen } = useSelector((store) => store.helper);

  const { data, isLoading, error } = useSingleComplaintQuery(id);
  const { data: location, isLoading: locaLoading } = useGetSingleLocationQuery(
    data?.location,
    { skip: !data?.location }
  );
  const { data: DBUser } = useGetSingleUserQuery(
    user?._id,
    { skip: !user?._id }
  );

  // Auto-cleanup modals on unmount
  useEffect(() => {
    return () => {
      dispatch(toggleModal({ name: "complaint", status: false }));
    };
  }, [dispatch]);

  if (isLoading || locaLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <AlertMessage>{error?.data?.msg || error?.error || "Failed to load complaint data."}</AlertMessage>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-8 py-4 space-y-6">
      {/* COMPLAINT TOP CARD METADATA */}
      <div className="bg-neutral-50 rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap gap-x-6 gap-y-4 p-5 sm:p-6">

          {/* Client Name (Takes full width if present on mobile, 100% or balanced on desktop) */}
          {user.type === "PestEmployee" && (
            <div className="w-full lg:w-full border-b border-neutral-200/60 pb-3 mb-1 lg:mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">Client Name</span>
              <span className="text-lg font-bold text-neutral-900 break-all">
                {data?.complaintDetails?.clientName || "—"}
              </span>
            </div>
          )}

          {/* Complaint Number */}
          <div className="flex-1 min-w-[140px] sm:min-w-[180px]">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
              Complaint Number
            </span>
            <span className="text-base font-semibold text-neutral-900 break-all">
              {data?.complaintDetails?.number || "—"}
            </span>
          </div>

          {/* Status */}
          <div className="flex-1 min-w-[140px] sm:min-w-[180px]">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Status
            </span>
            <div>
              <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset uppercase tracking-wide ${progress(data?.complaintDetails?.status)}`}>
                {data?.complaintDetails?.status || "Unknown"}
              </span>
            </div>
          </div>

          {/* Raised By */}
          <div className="flex-1 min-w-[140px] sm:min-w-[180px]">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
              Raised By
            </span>
            <span className="text-base font-medium text-neutral-800">
              {data?.complaintDetails?.userName || "—"}
            </span>
          </div>

          {/* Reopen Count */}
          {user.type === "PestEmployee" && (
            <div className="flex-1 min-w-[140px] sm:min-w-[180px]">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Reopen Count
              </span>
              <div>
                <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-800 ring-1 ring-inset ring-neutral-300 uppercase tracking-wide">
                  {data?.complaintDetails?.reopenCount || "0"}
                </span>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="flex-1 min-w-[140px] sm:min-w-[180px]">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
              Location
            </span>
            <span className="text-sm text-neutral-700 block leading-relaxed font-medium">
              {[location?.location?.floor, location?.location?.location, location?.location?.subLocation]
                .filter(Boolean)
                .join(", ") || "N/A"}
            </span>
          </div>

          {/* Requested Service */}
          <div className="flex-1 min-w-[140px] sm:min-w-[180px]">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Requested Service
            </span>
            <div className="flex flex-wrap gap-1.5">
              {data?.complaintDetails?.service?.map((service, index) => (
                <span key={index} className="bg-white text-neutral-800 border border-neutral-200 text-xs font-semibold px-2.5 py-0.5 rounded-md shadow-xs">
                  {service}
                </span>
              ))}
            </div>
          </div>

          {/* Comment (Forces itself onto a clean, unified bottom line with minimal gap) */}
          <div className="w-full mt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Comment
            </span>
            <span className="text-sm text-neutral-600 block italic leading-relaxed bg-white border border-neutral-200 p-3 rounded-lg shadow-xs">
              {data?.complaintDetails?.comment || "No comments shared."}
            </span>
          </div>

        </div>
      </div>

      {/* COMPLAINT TIMELINE / LOGS UPDATE */}
      {data?.complaintUpdate?.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          {/* Desktop Table Header */}
          <div className="hidden md:flex items-center bg-neutral-100 border-b border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-600 py-3 px-4 gap-4 text-center">
            <div className="w-32 text-left shrink-0">Date</div>
            <div className="w-24 shrink-0">Image</div>
            <div className="flex-1 text-left">Operator Comment</div>
            <div className="w-36 shrink-0">Updated By</div>
            <div className="w-28 shrink-0">Status</div>
          </div>

          {/* Timeline Items */}
          <div className="divide-y divide-neutral-800">
            {data.complaintUpdate.map((complaint, i) => (
              <div
                key={complaint?._id || i}
                className="flex flex-col md:flex-row md:items-center py-4 px-4 text-sm text-neutral-700 hover:bg-neutral-50/70 transition-colors gap-4"
              >
                {/* 1. Date */}
                <div className="w-full md:w-32 flex justify-between md:block items-center shrink-0">
                  <span className="md:hidden text-xs font-bold text-neutral-400 uppercase tracking-wider">Date</span>
                  <span className="text-neutral-600 font-medium md:font-normal">{dateFormat(complaint?.date)}</span>
                </div>

                {/* 2. Image */}
                <div className="w-full md:w-24 flex justify-between md:block md:text-center items-center shrink-0">
                  <span className="md:hidden text-xs font-bold text-neutral-400 uppercase tracking-wider">Image</span>
                  <div onClick={(e) => e.stopPropagation()}>
                    {complaint?.image?.length > 0 ? (
                      <div className="relative inline-block">
                        <Button
                          label={`Show (${complaint.image.length})`}
                          small
                          height="h-7"
                          color="bg-green-600 text-xs text-white px-2.5 py-0.5 rounded-md hover:bg-green-700 transition"
                          onClick={() => dispatch(toggleModal({ name: `PEImages-${i}`, status: true }))}
                        />
                        {isModalOpen[`PEImages-${i}`] && (
                          <ImagesModal image={complaint.image} name={`PEImages-${i}`} />
                        )}
                      </div>
                    ) : (
                      <span className="text-neutral-300 text-xs">—</span>
                    )}
                  </div>
                </div>

                {/* 3. Operator Comment */}
                <div className="w-full flex-1 flex flex-col md:block items-start justify-between min-w-0">
                  <span className="md:hidden text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Comment</span>
                  <p className="break-words text-neutral-800 text-left w-full whitespace-pre-wrap leading-relaxed">{complaint?.comment || "No comment available."}</p>
                </div>

                {/* 4. Updated By */}
                <div className="w-full md:w-36 flex justify-between md:block md:text-center items-center shrink-0">
                  <span className="md:hidden text-xs font-bold text-neutral-400 uppercase tracking-wider">Updated By</span>
                  <span className="font-medium md:font-normal truncate max-w-[180px] inline-block md:block text-neutral-700">{complaint?.userName || "System"}</span>
                </div>

                {/* 5. Status Badge */}
                <div className="w-full md:w-28 flex justify-between md:block md:text-center items-center shrink-0">
                  <span className="md:hidden text-xs font-bold text-neutral-400 uppercase tracking-wider">Status</span>
                  <div className="flex items-center justify-end md:justify-center">
                    <span className={`inline-flex relative items-center rounded-full px-2.5 py-0.5 text-xs font-bold border uppercase tracking-wide leading-normal ${progress(complaint?.status)}`}>
                      {complaint?.status}
                      {i === data.complaintUpdate.length - 1 && (
                        <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-ping ${progressBlink(complaint?.status)}`}></span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS AREA */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {/* Update Form Button Trigger */}
        {user?.type === "PestEmployee" &&
          ["Open", "Reopen", "In Progress"].includes(data?.complaintDetails?.status) && (
            <>
              <Button
                label="Update Complaint"
                onClick={() => dispatch(toggleModal({ name: "complaint", status: true }))}
              />
              <ComplaintModal locationId={data?._id} mode="update" />
            </>
          )}

        {/* Review Approval Actions Trigger */}
        {DBUser?.rights?.close &&
          ["Close Req", "Close"].includes(data?.complaintDetails?.status) &&
          !data?.complaintDetails?.finalClosed && (
            <>
              <Button
                label={`Review Request (${data?.complaintDetails?.reopenCount || 0}/3)`}
                onClick={() => dispatch(toggleModal({ name: "complaint", status: true }))}
              />
              <ComplaintModal locationId={data?._id} mode="review" />
            </>
          )}
      </div>
    </div>
  );
};

export default SingleComplaint;