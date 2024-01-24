import { useParams } from "react-router-dom";
import { useSingleComplaintQuery } from "../redux/serviceSlice";
import { AlertMessage, Button, Loading } from "../components";
import { dateFormat, progress } from "../utils/helperFunctions";
import { useSelector, useDispatch } from "react-redux";
import { ComplaintModal } from "../components/modals";
import { toggleModal } from "../redux/helperSlice";

const SingleComplaint = () => {
  const { user } = useSelector((store) => store.helper);
  const dispatch = useDispatch();
  const { id } = useParams();

  const { data, isLoading, error } = useSingleComplaintQuery(id);

  return (
    <div>
      {isLoading ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}
      {data && (
        <div>
          <div className="flex justify-between md:block">
            <p>Complaint Number: {data.complaintDetails.number}</p>
            <div>
              <span className="pr-2 hidden md:inline-flex">Status:</span>
              <span
                className={`inline-flex items-center rounded-md px-2 font-medium ring-1 ring-gray-300
                      ${progress(data.complaintDetails.status)} `}
              >
                {data.complaintDetails.status}
              </span>
            </div>
          </div>
          <h4>Raised By: {data.complaintDetails.userName}</h4>
          <h4>Pest: {data.complaintDetails.service?.join(", ")}</h4>
          <h4>Comment: {data.complaintDetails.comment}</h4>
          <div>
            Images:{" "}
            <div className="flex space-x-5">
              {data.complaintDetails.image.map((image) => (
                <img key={image} src={image} className="w-40 h-40" />
              ))}
            </div>
          </div>
          <div className="overflow-y-auto my-4">
            <table className="w-full border whitespace-nowrap border-neutral-500 bg-text">
              <thead>
                <tr className="h-8 w-full leading-none">
                  <th className="font-bold text-center border-neutral-500 w-40 border-2 px-3">
                    Date
                  </th>
                  <th className="font-bold text-center border-neutral-500 w-40 border-2 px-3">
                    Status
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
                </tr>
              </thead>
              <tbody>
                {data.complaintUpdate?.map((complaint) => (
                  <tr
                    key={complaint._id}
                    className="h-8 text-[14px] border-b border-neutral-500 hover:bg-slate-200"
                  >
                    <td className="px-3 border-r text-center border-neutral-500">
                      {dateFormat(complaint.date)}
                    </td>
                    <td className="px-3 border-r text-center border-neutral-500">
                      <span
                        className={`inline-flex items-center rounded-md px-2 font-medium ring-1 ring-gray-300
                      ${progress(complaint.status)} `}
                      >
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-3 border-r text-center border-neutral-500">
                      <Button
                        label="Download"
                        small
                        height="h-7"
                        color="bg-green-600"
                      />
                    </td>
                    <td className="px-3 border-r text-center border-neutral-500">
                      {complaint.comment}
                    </td>
                    <td className="px-3 border-r text-center border-neutral-500">
                      {complaint.userName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {user.type === "PestEmployee" &&
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
