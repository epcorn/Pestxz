import { useNavigate, useParams } from "react-router-dom";
import { useSingleComplaintQuery } from "../redux/serviceSlice";
import { AlertMessage, Button, Loading } from "../components";
import { dateFormat, decodeBase64Svg, nagative, positive, progress } from "../utils/helperFunctions";
import { useSelector, useDispatch } from "react-redux";
import { ComplaintModal } from "../components/modals";
import { toggleModal } from "../redux/helperSlice";
import { useGetSingleLocationQuery } from "../redux/locationSlice";
import ImagesModal from "../components/modals/ImagesModal";
import { FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import { useState } from "react";

const SingleComplaint = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState('')
  const { user, isModalOpen } = useSelector((store) => store.helper);
  const dispatch = useDispatch();
  const { id } = useParams();

  const { data, isLoading, error } = useSingleComplaintQuery(id);
  const { data: location, isLoading: locaLoading } = useGetSingleLocationQuery(data?.location, { skip: !data?.location });


  console.log(data)
  return (
    <div>
      {isLoading ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}
      {data && (
        <div>
          {/* <div className="mb-6 text-center">
            <h2 className="text-2xl font-light text-slate-800">
              Hello, <span className="capitalize font-semibold text-sky-700">{user.name}</span>
            </h2>
            <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-medium tracking-wide bg-slate-100 text-slate-600 rounded-full border border-slate-200">
              {user.role}
            </span>
          </div> */}

          <div className="">
            <div className="">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6 p-4 bg-white/60 rounded-lg">
                {/* Column 1: Metadata */}
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="font-bold text-gray-700 block mb-0.5">Complaint Number</span>
                    <span className="text-gray-600 break-all">{data.complaintDetails.number}</span>
                  </div>

                  <div>
                    <span className="font-bold text-gray-700 block mb-1">Status</span>
                    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ring-gray-300 ${progress(data.complaintDetails.status)}`}>
                      {data.complaintDetails.status}
                    </span>
                  </div>
                </div>

                {/* Column 2: People & Location */}
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="font-bold text-gray-700 block mb-0.5">Raised By</span>
                    <span className="text-gray-600">{data.complaintDetails.userName}</span>
                  </div>

                  <div className="text-sm">
                    <span className="font-bold text-gray-700 block mb-0.5">Location</span>
                    <span className="text-gray-600 block">
                      {[location?.location.floor, location?.location.location, location?.location.subLocation]
                        .filter(Boolean)
                        .join(", ") || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Column 3: Details (Spans full width on mobile, enters 3rd column on large screens) */}
                <div className="col-span-2 lg:col-span-1 grid grid-cols-2 lg:block gap-4">
                  <div className="text-sm">
                    <span className="font-bold text-gray-700 block mb-0.5">Requested Service</span>
                    <div className="flex flex-wrap gap-1">
                      {data.complaintDetails.service?.map((service, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="font-bold text-gray-700 block mb-0.5">Comment</span>
                    <span className="text-gray-600 block italic">
                      {data.complaintDetails.comment || "No comments."}
                    </span>
                  </div>
                </div>
              </div>


              {/* <div>
                <strong>Images: </strong>{" "}
                <div className="flex space-x-5">
                  {data.complaintDetails.image.map((image) => (
                    <img key={image} src={image} className="w-40 h-40" />
                  ))}
                </div>
              </div> */}
            </div>
            {/* right side  */}
            {/* <div className=""> */}
            {/* <img src={`${location?.location.qr}`} alt={location?.location.location} className="h-44 text-center" /> */}
            {/* for svg qr*/}
            {/* <div
                className="h-44 w-auto [&>svg]:h-full [&>svg]:w-auto [&>svg]:max-w-full"
                dangerouslySetInnerHTML={{ __html: decodeBase64Svg(location?.location?.qr) }}
              /> */}
            {/* <Button type="button" onClick={() => navigate(`/location/${location?.location._id}`)} small={true} label={'Go to Location'} /> */}
            {/* </div> */}
          </div>
          {data.complaintUpdate?.length > 0 && (
            <div className="my-4 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">

              {/* DESKTOP HEADER (Hidden on Mobile) */}
              <div className="hidden md:flex items-center bg-neutral-50 border-b border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-500 py-3 px-4 gap-4 text-center">
                <div className="w-28 text-left shrink-0">Date</div>
                <div className="w-20 shrink-0">Image</div>
                <div className="flex-1 text-left">Operator Comment</div>
                <div className="w-32 shrink-0">Updated By</div>
                <div className="w-24 shrink-0">Status</div>
                {/* {(user.role === "ClientAdmin" || user.role === "ClientEmployee") && (
        <div className="w-28 shrink-0">Feedback</div>
      )} */}
              </div>

              {/* LIST OF ITEMS / MOBILE CARDS */}
              <div className="divide-y divide-neutral-200">
                {data.complaintUpdate?.map((complaint, i) => (
                  <div
                    key={complaint._id}
                    className="flex flex-col md:flex-row md:items-center py-4 px-4 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors gap-3 md:gap-4"
                  >
                    {/* 1. Date */}
                    <div className="w-full md:w-28 flex justify-between md:block items-center shrink-0">
                      <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Date</span>
                      <span className="text-neutral-500 md:text-neutral-700">{dateFormat(complaint.date)}</span>
                    </div>

                    {/* 2. Image Trigger */}
                    <div className="w-full md:w-20 flex justify-between md:block md:text-center items-center shrink-0">
                      <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Image</span>
                      <div>
                        {complaint.image.length > 0 ? (
                          <Button
                            label={`Show (${complaint.image.length})`}
                            small
                            height="h-7"
                            color="bg-green-600 text-xs text-white px-2 py-0.5 rounded"
                            onClick={() => dispatch(toggleModal({ name: `PEImages-${i}`, status: true }))}
                          />
                        ) : (
                          <span className="text-neutral-400 text-xs">—</span>
                        )}
                        {isModalOpen[`PEImages-${i}`] && <ImagesModal image={complaint.image} name={`PEImages-${i}`} />}
                      </div>
                    </div>

                    {/* 3. Operator Comment */}
                    <div className="w-full flex-1 flex flex-col md:block items-start justify-between min-w-0">
                      <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase mb-0.5">Comment</span>
                      <p className="break-words text-neutral-800 text-left w-full whitespace-pre-wrap">{complaint.comment}</p>
                    </div>

                    {/* 4. Updated By */}
                    <div className="w-full md:w-32 flex justify-between md:block md:text-center items-center shrink-0">
                      <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Updated By</span>
                      <span className="font-medium md:font-normal truncate max-w-[150px] inline-block md:block">{complaint.userName}</span>
                    </div>

                    {/* 5. Status */}
                    <div className="w-full md:w-24 flex justify-between md:block md:text-center items-center shrink-0">
                      <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Status</span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${progress(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>

                    {/* 6. Feedback Actions */}
                    {/* {(user.role === "ClientAdmin" || user.role === "ClientEmployee") && (
            <div className="w-full md:w-28 flex justify-between md:block md:text-center items-center shrink-0 pt-2.5 md:pt-0 border-t md:border-none border-neutral-100">
              <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Feedback</span>
              <div className="flex justify-start md:justify-center items-center gap-1">
                <button
                  className={`cursor-pointer text-base p-1 transition-transform active:scale-95 ${positive(rating, complaint._id)}`}
                  type="button"
                  onClick={() => setRating({ id: complaint._id, rating: true })}
                >
                  <FaThumbsUp />
                </button>
                <button
                  className="cursor-pointer text-xs text-neutral-400 hover:text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200" 
                  type="button"
                  onClick={() => setRating({ id: complaint._id, rating: null })}
                >
                  Clear
                </button>
                <button
                  className={`cursor-pointer text-base p-1 transition-transform active:scale-95 ${nagative(rating, complaint._id)}`}
                  type="button"
                  onClick={() => setRating({ id: complaint._id, rating: false })}
                >
                  <FaThumbsDown />
                </button>
              </div>
            </div>
          )} */}

                  </div>
                ))}
              </div>
            </div>
          )}
          {data.complaintDetails.status !== "Close Req" && data.complaintDetails.status !== "Close" && user.type === "PestEmployee" && (
            <>
              <Button
                label="Update"
                onClick={() =>
                  dispatch(toggleModal({ name: "complaint", status: true, }))}
              />
              <ComplaintModal locationId={data._id} mode="update"
              />
            </>
          )}

          {user.role === "ClientAdmin" &&
            data.complaintDetails.status === "Close Req" &&
            !data.complaintDetails.finalClosed && (
              <>
                <Button
                  label={`Review Request (${data.complaintDetails.reopenCount || 0}/3)`}
                  onClick={() =>
                    dispatch(
                      toggleModal({
                        name: "complaint",
                        status: true,
                      })
                    )
                  }
                />

                <ComplaintModal
                  locationId={data._id}
                  mode="review"
                />
              </>
            )}
        </div>
      )
      }
    </div >
  );
};
export default SingleComplaint;
