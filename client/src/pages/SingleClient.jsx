import { Link, useParams } from "react-router-dom";
import { DeleteModal, LocationModal, NewClientModal } from "../components/modals";
import {
  useAllLocationsQuery,
  useDeleteLocationMutation,
  useLazyBackFillSchedulesQuery,
} from "../redux/locationSlice";
import { AlertMessage, Button, Loading } from "../components";
import { FaEdit } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { toggleModal } from "../redux/helperSlice";
import { useState } from "react";
import { MdAddCircle } from "react-icons/md";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import { useUpdateClientMutation } from "../redux/clientSlice";

const SingleClient = () => {
  const { isModalOpen } = useSelector((store) => store.helper);
  const [locationDetails, setLocationDetails] = useState({});
  const [clientDetails, setClientDetails] = useState(null)
  const dispatch = useDispatch();
  const { id } = useParams();

  const { data, isLoading, isFetching, error } = useAllLocationsQuery({ id });
  const [deleteLocation, { isLoading: deleteLoading }] =
    useDeleteLocationMutation();
  const [updateClient, { isLoading: updateLoading }] =
    useUpdateClientMutation();
  const [triggerBackFill, { data: backfill, isLoading: backFillLoading }] = useLazyBackFillSchedulesQuery()

  // handle edit model
  const handleEditModal = (location) => {
    setLocationDetails(location);
    dispatch(toggleModal({ name: "location", status: true }));
  };
  // add new model
  const handleNewModal = () => {
    setLocationDetails(null);
    dispatch(toggleModal({ name: "location", status: true }));
  };

  console.log(data)
  const handleDelete = async () => {
    try {
      await deleteLocation(isModalOpen.delete.id).unwrap();
      toast.success(`${isModalOpen.delete.name} deleted successfully`);
      dispatch(
        toggleModal({ name: "delete", status: { id: null, name: null } })
      );
    } catch (error) {
      console.log(error);
      toast.error(error?.data?.msg || error.error);
    }
  };

  const services = data?.locations?.map(loc => loc.service || []) || []

  const handleBackfill = async () => {
    const res = await triggerBackFill().unwrap()
    toast.success(res.msg || "Done");
  }

  return (
    <>
      {isLoading || isFetching ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}
      {!error && data?.client && (
        <div>
          <div className="py-5 border-b border-neutral-200">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-5">

                  <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                    {data.client.name}
                  </h2>

                  <button
                    type="button"
                    className="text-base font-normal cursor-pointer"
                    onClick={() => {
                      setClientDetails(data.client);

                      dispatch(
                        toggleModal({
                          name: "newClient",
                          status: true,
                        })
                      );
                    }}
                  >
                    <FaEdit className="text-blue-700" />
                  </button>
                  {isModalOpen.newClient && (
                    <NewClientModal
                      update
                      id={data.client._id}
                      clientDetails={clientDetails}
                    />
                  )}
                </div>


                {/* Meta Information Row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-1.5 text-sm text-neutral-500">
                  <div>
                    <span className="font-medium text-neutral-700">Contract No:</span> {data.client.contractNo}
                  </div>
                  <span className="hidden sm:inline text-neutral-300">&middot;</span>
                  <div>
                    <span className="font-medium text-neutral-700">Email:</span> {data.client.email}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-700">Phone:</span> {data.client.phone}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-700">Contract Start Date:</span> {data.client.startDate}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-700">Contract Period:</span> {data.client.endDate}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0">
                <Button
                  height="h-10"
                  color="bg-green-600 hover:bg-green-700 text-white transition-colors"
                  label={
                    <div className="flex items-center gap-1 px-1">
                      <MdAddCircle className="w-5 h-5" />
                      <span>New Location</span>
                    </div>
                  }
                  onClick={handleNewModal}
                />
                {isModalOpen.location && (
                  <LocationModal
                    clientId={id}
                    locationDetails={locationDetails}
                  />
                )}
              </div>
            </div>

            {/* Address Section */}
            <div className="text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
              <span className="font-semibold text-neutral-800 mr-1">Address:</span>
              {data.client.address}
            </div>
          </div>

          <div>
            <Button label={'Add schedules'} onClick={handleBackfill}
              isLoading={backFillLoading} disabled={backFillLoading} />

          </div>

          <div className="overflow-y-auto my-4">
            <table className="w-full border whitespace-nowrap border-neutral-500 bg-text">
              <thead>
                <tr className="h-10 w-full text-md md:text-lg leading-none">
                  <th className="font-bold text-center border-neutral-500 border-2 px-3">
                    Floor
                  </th>
                  <th className="font-bold text-center border-neutral-500 border-2 px-3">
                    Location
                  </th>
                  <th className="font-bold text-center border-neutral-500 border-2 w-32 px-3">
                    Services
                  </th>
                  {/* <th className="font-bold text-center border-neutral-500 border-2 w-32 px-3">
                    Products
                  </th> */}
                  <th className="font-bold text-center border-neutral-500 border-2 w-28">
                    QR Codes
                  </th>
                  <th className="font-bold max-w-25 text-center border-neutral-500 border-2 px-2">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="w-full">
                {data.locations?.map((location) => (
                  <tr
                    key={location._id}
                    className="h-9 text-sm leading-none bg-text border-b border-neutral-500 hover:bg-slate-200"
                  >
                    <td className="px-3 border-r font-normal border-neutral-500">
                      <Link to={`/location/${location?._id}`}>
                        {location.floor}
                      </Link>
                    </td>
                    <td className="px-3 border-r font-normal border-neutral-500">
                      {location.location}, {location.subLocation}
                    </td>
                    <td className="px-3 border-r font-normal text-center border-neutral-500">
                      {location.service?.map((item) => item.serviceName).join(", ")}
                    </td>
                    <td className="border-r font-normal text-center border-neutral-500">
                      <Button
                        label="Download"
                        small
                        height="h-7"
                        onClick={() =>
                          saveAs(location.qr, `QR-${location.location}`)
                        }
                      />
                    </td>
                    <td className="flex items-center justify-center h-9 space-x-3 font-normal text-center border-neutral-500">
                      <button
                        type="button"
                        onClick={() => handleEditModal(location)}
                      >
                        <FaEdit className="h-5 w-5 text-indigo-600" />
                      </button>
                      <DeleteModal
                        title="Delete Location"
                        description="this location"
                        handleDelete={handleDelete}
                        isLoading={deleteLoading}
                        id={{
                          id: location._id,
                          name: `${location.location}, ${location.subLocation}`,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};
export default SingleClient;
