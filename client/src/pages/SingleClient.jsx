import { Link, useParams } from "react-router-dom";
import { DeleteModal, LocationModal, NewClientModal } from "../components/modals";
import {
  useAllLocationsQuery,
  useDeleteLocationMutation,
  useLazyAllLocationsQuery,
  useLazyBackFillSchedulesQuery,
  useMakeQrDocxMutation,
  useQrCounterMutation,
} from "../redux/locationSlice";
import { AlertMessage, Button, Loading } from "../components";
import { FaEdit } from "react-icons/fa";
import { PiDownloadSimpleBold } from "react-icons/pi";
import { useDispatch, useSelector } from "react-redux";
import { toggleModal } from "../redux/helperSlice";
import { useState } from "react";
import { MdAddCircle } from "react-icons/md";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import { useUpdateClientMutation } from "../redux/clientSlice";
import { useGetSingleUserQuery } from "../redux/userSlice";
import Pagination from "./Pagination";

const SingleClient = () => {
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: false, text: "" })
  const { isModalOpen, user } = useSelector((store) => store.helper);
  const [locationDetails, setLocationDetails] = useState({});
  const [clientDetails, setClientDetails] = useState(null)
  const [selectedQr, setSelectedQr] = useState([])
  const dispatch = useDispatch();
  const { id } = useParams();

  const { data: me } = useGetSingleUserQuery(user._id, { skip: !user._id })
  const limit = 15;
  const { data, isLoading, isFetching, error } = useAllLocationsQuery({ id, limit, page });
  const [triggerFetchAll] = useLazyAllLocationsQuery(); //for all qr docx
  const [deleteLocation, { isLoading: deleteLoading }] =
    useDeleteLocationMutation();
  const [updateClient, { isLoading: updateLoading }] =
    useUpdateClientMutation();
  const [qrCountInc] = useQrCounterMutation();
  const [makeQrDOCX] = useMakeQrDocxMutation();
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


  const handleQrDownload = async (id, location) => {
    try {
      console.log(id, location)
      await qrCountInc(id).unwrap();

      saveAs(location?.qr, `QR-${location.location}`);
    } catch (error) {
      throw new Error("download error");
    }
  }

  const handleDownloadAll = async () => {
    let qrs = [];
    let ids = [];
    const isValidQr = (qrValue) => {
      return qrValue !== false && qrValue !== "false" && !!qrValue;
    };
    const downloadPromise = (async () => {
      if (selectedQr.length > 0) {
        const validSelection = selectedQr.filter(s => isValidQr(s.qr));
        qrs = validSelection.map(s => s.qr);
        ids = validSelection.map(s => s.id);
      } else {
        const response = await triggerFetchAll({ id }).unwrap();

        if (!response?.locations || response.locations.length === 0) {
          throw new Error("No locations found for this client.");
        }

        const validLocations = response.locations.filter(l => isValidQr(l.qr));
        qrs = validLocations.map(l => l.qr);
        ids = validLocations.map(l => l._id);
      }

      if (qrs.length === 0) {
        throw new Error("No valid QR codes found to download.");
      }

      const payload = { qrs: qrs, client: data?.clientName || "Client" };

      // Execute database increments & Docx creation
      await qrCountInc(ids).unwrap();
      const res = await makeQrDOCX(payload).unwrap();

      saveAs(res?.qr, `${data?.clientName || "Client"}-Location.docx`);
      return data?.clientName || "Client";
    })();

    // Bind promise to toast notification
    toast.promise(
      downloadPromise,
      {
        pending: 'Fetching all locations & generating QR File, please wait...',
        success: {
          render({ data: clientName }) {
            return `File Downloaded for ${clientName}!!!`;
          },
          autoClose: 3000,
        },
        error: {
          render({ data: err }) {
            console.error(err);
            return err?.message || "Failed to generate or download the QR document.";
          }
        }
      }
    );
  };

  const pages = Array.from({ length: data?.pages }, (_, index) => index + 1);


  return (
    <>
      {isLoading || isFetching ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}
      {!error && data?.client && (
        <div className="max-h-full overflow-auto flex flex-col">
          <div className="border-b border-neutral-200 max-h-full ">
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
                  {data?.client?.startDate &&
                    <div>
                      <span className="font-medium text-neutral-700">Contract Start Date:</span> {typeof data?.client?.startDate === "string" ? data?.client?.startDate.split("T")[0] || "" : new Date(data?.client?.startDate)?.toISOString().split("T")[0] || ""}
                    </div>
                  }
                  <div>
                    <span className="font-medium text-neutral-700">Contract Period:</span> {data.client?.servicePeriod} Months
                  </div>
                  {data?.client?.endDate &&
                    <div>
                      <span className="font-medium text-neutral-700">Contract End Date:</span> {typeof data?.client?.endDate === "string" ? data?.client?.endDate.split("T")[0] || "" : new Date(data?.client?.endDate).toISOString().split("T")[0] || ""}
                    </div>
                  }
                  <div>
                    <span className="font-medium text-neutral-700">Preferred Day:</span> {data.client.prefDay}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-700">Preferred Time:</span> {data.client.prefTime}
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


          {/* for testing purpose  */}
          <div className="hidden">
            <Button label={'Add schedules'} onClick={handleBackfill}
              isLoading={backFillLoading} disabled={backFillLoading} />
          </div>

          <div className="overflow-auto border border-neutral-300 rounded-lg max-h-[500px] my-2">
            <table className="w-full border-collapse whitespace-nowrap bg-white">
              <thead className="sticky top-0 bg-gray-300 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">
                <tr className="h-10 text-sm md:text-base text-neutral-800">
                  <th className="font-bold text-center border border-neutral-300 px-3">
                    Sr No
                  </th>
                  <th className="font-bold text-center border border-neutral-300 px-3 min-w-26">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          if (selectedQr.length === 0) return;
                          setSelectedQr([]);
                        }}
                      >
                        {selectedQr.length > 0 ? "Deselect" : "Select"}
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-blue-700 text-white hover:bg-blue-800 transition-colors"
                        onClick={handleDownloadAll}
                      >
                        <PiDownloadSimpleBold className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                  <th className="font-bold text-center border border-neutral-300 px-3">
                    Floor
                  </th>
                  <th className="font-bold text-left border border-neutral-300 px-4">
                    Location
                  </th>
                  <th className="font-bold text-center border border-neutral-300 w-32 px-3">
                    Services / [Products]
                  </th>
                  <th className="font-bold text-center border border-neutral-300 w-28 px-3">
                    Location Qr / Product Qr
                  </th>
                  <th className="font-bold text-center border border-neutral-300 px-4">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {data.locations?.map((location, i) => (
                  <tr
                    key={location._id}
                    className="h-11 text-sm bg-white hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-3 border border-neutral-200 font-medium text-neutral-500 text-center">
                      {(page - 1) * limit + (i + 1)}
                    </td>
                    <td className="px-3 border border-neutral-200 text-center">
                      <input
                        type="checkbox"
                        name={location.floor}
                        id={location.floor}
                        checked={selectedQr.some(item => item.id === location._id)}
                        onChange={() =>
                          setSelectedQr(prev =>
                            prev.some(item => item.id === location._id)
                              ? prev.filter(item => item.id !== location._id)
                              : [...prev, { qr: location.qr, id: location._id }]
                          )}
                        className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 border border-neutral-200 text-center">
                      <Link to={`/location/${location?._id}`}>
                        <Button label={location.floor} small={true} />
                      </Link>
                    </td>
                    <td className="px-4 border border-neutral-200 text-left text-neutral-700">
                      <span className="font-medium">{location.location}</span>
                      {location.subLocation && <span className="text-neutral-500 text-xs block">{location.subLocation}</span>}
                    </td>
                    <td className="px-3 border border-neutral-200 text-center leading-relaxed text-neutral-600">
                      <span className="font-semibold">
                        {location.service?.map((item) => item.serviceName).join(", ") || "-"}
                      </span>
                      {location.product && location.product.length !== 0 && (
                        <div className="text-sm text-neutral-500 font-semibold mt-0.5">
                          [{location.product?.map((item) => item.productName).join(", ")}]
                        </div>
                      )}
                    </td>
                    <td className="px-3 border border-neutral-200 text-center">
                      <div className="flex justify-center items-center gap-1">
                        <Button
                          label={<span className="flex items-center gap-1"><PiDownloadSimpleBold /> {location?.qrCount}</span>}
                          small
                          height="h-7"
                          onClick={() => handleQrDownload(location?._id, location)}
                        />
                        <span className="text-neutral-300">|</span>
                        <div className={location.product.length > 0 ? "" : "opacity-40 pointer-events-none"}>
                          <Button
                            label={<span className="flex items-center gap-1"><PiDownloadSimpleBold /> ~</span>}
                            small
                            height="h-7"
                            onClick={() => { dispatch(toggleModal({ name: `${location._id}_product`, status: true })) }}
                          />
                        </div>
                        {isModalOpen[`${location._id}_product`] && location.product.length > 0 &&
                          <ProductQrModal data={location?.product} dispatch={dispatch} toggleModal={toggleModal} modalKey={`${location._id}_product`} />
                        }
                      </div>
                    </td>
                    <td className="px-4 border border-neutral-200 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleEditModal(location)}
                          className="hover:scale-105 transition-transform"
                        >
                          <FaEdit className="h-5 w-5 text-indigo-600 hover:text-indigo-800" />
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} setPage={setPage} totalPages={data?.pages} />
        </div>
      )}
    </>
  );
};
export default SingleClient;


function ProductQrModal({ data, dispatch, toggleModal, modalKey }) {
  return (
    <div className="fixed inset-0 bg-black/30 h-full w-full z-50 content-center">
      <div className="bg-white p-3 max-w-md mx-auto ">
        <h3 className="text-lg font-semibold text-center mx-auto my-2 mb-4 border-b flex items-center justify-between"><span>Products Qr Download</span> <span className="text-red-600 outline inline-block w-5 h-5 leading-none rounded-full text-sm content-center " onClick={() => dispatch(toggleModal({ name: modalKey, status: false }))}>X</span></h3>
        {data?.map((d, i) => (
          <div key={d._id} className="grid grid-cols-5 items-center" data-url={d?.qr}>
            <p className="">{i + 1}</p>
            <p className="col-span-2">{d.productName}</p>
            <p>{d.serialNo}</p>
            <Button
              label={<span className="flex items-center gap-1"><PiDownloadSimpleBold /> 0</span>}
              small
              height="h-7"
              onClick={() => saveAs(d?.qr, `QR-${d.serialNo}.jpg`)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}