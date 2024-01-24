import { useParams } from "react-router-dom";
import { DeleteModal, LocationModal } from "../components/modals";
import {
  useAllLocationsQuery,
  useDeleteLocationMutation,
} from "../redux/locationSlice";
import { AlertMessage, Button, Loading } from "../components";
import { FaEdit } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { toggleModal } from "../redux/helperSlice";
import { useState } from "react";
import { MdAddCircle } from "react-icons/md";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";

const SingleClient = () => {
  const { isModalOpen } = useSelector((store) => store.helper);
  const [locationDetails, setLocationDetails] = useState({});
  const dispatch = useDispatch();
  const { id } = useParams();
  const { data, isLoading, isFetching, error } = useAllLocationsQuery({ id });
  const [deleteLocation, { isLoading: deleteLoading }] =
    useDeleteLocationMutation();

  const handleEditModal = (location) => {
    setLocationDetails(location);
    dispatch(toggleModal({ name: "location", status: true }));
  };

  const handleNewModal = () => {
    setLocationDetails(null);
    dispatch(toggleModal({ name: "location", status: true }));
  };

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

  return (
    <>
      {isLoading || isFetching ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}
      {!error && data?.client && (
        <div>
          <h2 className="text-center text-2xl text-sky-700 font-semibold">
            {data.client.name}
          </h2>
          <div className="grid md:grid-cols-2 my-5 mx-2">
            <h6 className="">Address: {data.client.address}</h6>
            <div className="flex md:justify-center space-x-4">
              <h6 className="text-center">
                Contract No: {data.client.contractNo}
              </h6>
              <h6 className="text-center">Email: {data.client.email}</h6>
            </div>
          </div>
          <div className="flex justify-between">
            <div>
              <Button
                height="h-10"
                color="bg-green-600"
                label={
                  <div className="flex items-center">
                    <MdAddCircle className="w-6 h-6 pr-1" /> New Location
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
                  <th className="font-bold text-center border-neutral-500 border-2 w-32 px-3">
                    Products
                  </th>
                  <th className="font-bold text-center border-neutral-500 border-2 w-28">
                    QR Codes
                  </th>
                  <th className="font-bold max-w-[100px] text-center border-neutral-500 border-2 px-2">
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
                      {location.floor}
                    </td>
                    <td className="px-3 border-r font-normal border-neutral-500">
                      {location.location}, {location.subLocation}
                    </td>
                    <td className="px-3 border-r font-normal text-center border-neutral-500">
                      {location.service.map((item) => item.label + ", ")}
                    </td>
                    <td className="px-3 border-r font-normal text-center border-neutral-500">
                      {location.product.map((item) => item.label + ", ")}
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
