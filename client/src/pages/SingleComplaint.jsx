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

  console.log(location)
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

          <div className="grid grid-cols-4">
            <div className="col-span-3">
              <div className="grid grid-cols-2 mb-2">
                <p className="flex flex-col md:flex-row md:gap-1"><strong>Complaint Number: </strong> <span>{data.complaintDetails.number}</span></p>
                <div className="lg:pr-10">
                  <strong className="pr-2 hidden md:inline-flex">Status: </strong>
                  <span
                    className={`inline-flex items-center rounded-md px-2 font-medium ring-1 ring-gray-300
                      ${progress(data.complaintDetails.status)} `}
                  >
                    {data.complaintDetails.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2">
                <h4 className="*:block"><strong>Raised By: </strong> <span>{data.complaintDetails.userName}</span></h4>
                <h4 className="*:block"><strong>Location: </strong>
                  <span>{location?.location.floor || ""}, {location?.location.location || ""},</span>
                  <span>{location?.location.subLocation || ""}</span>
                </h4>
              </div>
              <div className="grid grid-cols-2">
                <h4 className="flex flex-col"><strong>Requested service: </strong>
                  {data.complaintDetails.service?.map((service, index) => (
                    <span key={index}>{service}</span>
                  ))}</h4>
                <h4 className="flex flex-col"><strong>Comment: </strong> <span>{data.complaintDetails.comment}</span></h4>
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
            <div className="">
              <img src={`${location?.location.qr}`} alt={location?.location.location} className="h-44 text-center" />
              {/* for svg qr*/}
              {/* <div
                className="h-44 w-auto [&>svg]:h-full [&>svg]:w-auto [&>svg]:max-w-full"
                dangerouslySetInnerHTML={{ __html: decodeBase64Svg(location?.location?.qr) }}
              /> */}
              {/* <Button type="button" onClick={() => navigate(`/location/${location?.location._id}`)} small={true} label={'Go to Location'} /> */}
            </div>
          </div>
          <div className="overflow-y-auto my-4">
            <table className="w-full border whitespace-nowrap border-neutral-500 bg-text">
              <thead>
                <tr className="h-8 w-full leading-none">
                  <th className="font-bold text-center border-neutral-500 w-40 border-2 px-3">
                    Date
                  </th>
                  <th className="font-bold text-center border-neutral-500 border-2 px-3">
                    Image
                  </th>
                  <th className="font-bold text-center border-neutral-500 border-2 px-3">
                    Operator Comment
                  </th>
                  <th className="font-bold text-center border-neutral-500 border-2 w-32 px-3">
                    Updated By
                  </th>
                  <th className="font-bold text-center border-neutral-500 w-40 border-2 px-3">
                    Status
                  </th>
                  {user.role === "ClientAdmin" || user.role === "ClientEmployee" ?
                    <th className="font-bold text-center border-neutral-500 w-40 border-2 px-3">
                      Feedback
                    </th> : ""
                  }
                </tr>
              </thead>
              <tbody>
                {data.complaintUpdate?.map((complaint, i) => (
                  <tr
                    key={complaint._id}
                    className="h-8 text-[14px] border-b border-neutral-500 hover:bg-slate-200"
                  >
                    <td className="px-3 border-r text-center border-neutral-500">
                      {dateFormat(complaint.date)}
                    </td>
                    <td className="px-3 border-r text-center border-neutral-500">
                      {complaint.image.length > 0 &&
                        < Button
                          label={`Show(${complaint.image.length})`}
                          small
                          height="h-7"
                          color="bg-green-600 text-xs"
                          onClick={() =>
                            dispatch(toggleModal({
                              name: `PEImages-${i}`, status: true
                            }))
                          }
                        />}
                      {isModalOpen[`PEImages-${i}`] && <ImagesModal image={complaint.image} name={`PEImages-${i}`} />}

                    </td>
                    <td className="px-3 border-r text-center border-neutral-500">
                      {complaint.comment}
                    </td>
                    <td className="px-3 border-r text-center border-neutral-500">
                      {complaint.userName}
                    </td>
                    <td className="px-3 border-r text-center border-neutral-500">
                      <span
                        className={`inline-flex items-center rounded-md px-2 font-medium ring-1 ring-gray-300
                      ${progress(complaint.status)} `}
                      >
                        {complaint.status}
                      </span>
                    </td>
                    {user.role === "ClientAdmin" || user.role === "ClientEmployee" ?
                      <td className="px-3 border-r text-center border-neutral-500 ">
                        <div className={`flex justify-around items-center`}>
                          <button
                            className={`"cursor-pointer ${positive(rating, complaint._id)}`}
                            type="button"
                            onClick={() => setRating({ id: complaint._id, rating: true })}
                          >
                            <FaThumbsUp />
                          </button>
                          <button
                            className="cursor-pointer" onClick={() => setRating({ id: complaint._id, rating: null })}>or</button>
                          <button
                            className={`"cursor-pointer ${nagative(rating, complaint._id)}`}
                            type="button"
                            onClick={() => setRating({ id: complaint._id, rating: false })}>
                            <FaThumbsDown />
                          </button>
                        </div>
                      </td> : ""}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {user.rights.scan_scheduled &&
            data.complaintDetails.status !== "Close" && (
              <>
                <Button
                  label="Update"
                  onClick={() =>
                    dispatch(toggleModal({ name: "complaint", status: true }))
                  }
                />
                <ComplaintModal locationId={data._id} />
              </>
            )}
        </div>
      )}
    </div>
  );
};
export default SingleComplaint;
