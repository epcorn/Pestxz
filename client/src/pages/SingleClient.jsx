import { Link, useParams } from "react-router-dom";
import {
  DeleteModal,
  LocationModal,
  NewClientModal,
} from "../components/modals";
import {
  useAllLocationsQuery,
  useDeleteLocationMutation,
  useLazyAllLocationsQuery,
  useMakeQrDocxMutation,
  useQrCounterMutation,
} from "../redux/locationSlice";
import { Button, LoadingSpinner } from "../components";
import { FaEdit } from "react-icons/fa";
import { PiDownloadSimpleBold } from "react-icons/pi";
import { useDispatch, useSelector } from "react-redux";
import { toggleModal } from "../redux/helperSlice";
import { memo, useCallback, useMemo, useState } from "react";
import { MdAddCircle } from "react-icons/md";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import { useUpdateClientMutation } from "../redux/clientSlice";
import { useGetSingleUserQuery } from "../redux/userSlice";
import Pagination from "./Pagination";
import FormModal from "../components/modals/FormModal";

const isValidQr = (qrValue) => qrValue !== false && qrValue !== "false" && !!qrValue;

// ---------------------------------------------------------------------------
// Shared download helper: every "generate QR docx" flow does the same three
// things (call the mutation, saveAs the result, bump the counter). Pulling
// this out means a fix/change here applies to all three call sites instead
// of three separately-drifting copies.
// ---------------------------------------------------------------------------
async function downloadQrDocx({ makeQrDOCX, qrCountInc, qrs, client, filename, ids }) {
  if (!qrs || qrs.length === 0) {
    throw new Error("No valid QR codes found to download.");
  }
  const res = await makeQrDOCX({ qrs, client }).unwrap();
  saveAs(res?.qr, filename);
  if (ids !== undefined) {
    await qrCountInc(ids).unwrap();
  }
  return res;
}

const SingleClient = () => {
  const [page, setPage] = useState(() => {
    const savedPage = sessionStorage.getItem("clientLocationPage");
    return savedPage ? Number(savedPage) : 1;
  });
  const { isModalOpen, user } = useSelector((store) => store.helper);
  const [locationDetails, setLocationDetails] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [selectedQr, setSelectedQr] = useState([]);
  const dispatch = useDispatch();
  const { id } = useParams();

  useGetSingleUserQuery(user._id, { skip: !user._id });
  const limit = 30;
  const { data, error } = useAllLocationsQuery({ id, limit, page });
  const [triggerFetchAll, { isLoading: fetchAllLoading }] = useLazyAllLocationsQuery();
  const [deleteLocation, { isLoading: deleteLoading }] = useDeleteLocationMutation();
  const [makeQrDOCX, { isLoading: docQrLoading }] = useMakeQrDocxMutation();
  const [qrCountInc] = useQrCounterMutation();

  // O(1) membership checks in the table instead of an O(n) `.some()` per row.
  const selectedQrIds = useMemo(
    () => new Set(selectedQr.map((s) => s.id)),
    [selectedQr],
  );

  const handleEditModal = useCallback(
    (location) => {
      setLocationDetails(location);
      dispatch(toggleModal({ name: "location", status: true }));
    },
    [dispatch],
  );

  const handleNewModal = useCallback(() => {
    setLocationDetails(null);
    dispatch(toggleModal({ name: "location", status: true }));
  }, [dispatch]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteLocation(isModalOpen.delete.id).unwrap();
      toast.success(`${isModalOpen.delete.name} deleted successfully`);
      dispatch(toggleModal({ name: "delete", status: { id: null, name: null } }));
    } catch (error) {
      console.error(error);
      toast.error(error?.data?.msg || error.error);
    }
  }, [deleteLocation, dispatch, isModalOpen.delete]);

  const toggleSelectedQr = useCallback((location) => {
    setSelectedQr((prev) =>
      prev.some((item) => item.id === location._id)
        ? prev.filter((item) => item.id !== location._id)
        : [...prev, { qr: location.qr, id: location._id }],
    );
  }, []);

  const handleQrDownload = useCallback(
    async (locationId, location) => {
      try {
        await downloadQrDocx({
          makeQrDOCX,
          qrCountInc,
          qrs: [location.qr],
          client: data?.clientName,
          filename: `QR-${data?.clientName}-${location.location}.docx`,
          ids: locationId,
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to download QR code.");
      }
    },
    [makeQrDOCX, qrCountInc, data?.clientName],
  );

  const handleDownloadAll = useCallback(
    (target) => {
      const downloadPromise = (async () => {
        let qrs = [];
        let ids = [];

        if (selectedQr.length > 0) {
          const validSelection = selectedQr.filter((s) => isValidQr(s.qr));
          qrs = validSelection.map((s) => s.qr);
          ids = validSelection.map((s) => s.id);
        } else {
          const { client } = await triggerFetchAll({ id: `${id}l` }).unwrap();
          if (!client?.locations || client.locations.length === 0) {
            throw new Error("No locations found for this client.");
          }

          if (target === "product") {
            const validLocations = client.locations.filter((l) => l.product?.length);
            qrs = validLocations.flatMap((l) => l.product.map((pr) => pr.qr));
            ids = validLocations.map((l) => l._id);
          }
          if (target === "regular") {
            const validLocations = client.locations.filter(
              (l) => l.service?.length > 0 && isValidQr(l.qr),
            );
            qrs = validLocations.map((l) => l.qr);
            ids = validLocations.map((l) => l._id);
          }
        }

        const clientName = data?.clientName || "Client";
        await downloadQrDocx({
          makeQrDOCX,
          qrCountInc,
          qrs,
          client: clientName,
          filename: `${clientName}-Location.docx`,
          ids,
        });

        setSelectedQr([]);
        return clientName;
      })();

      toast.promise(downloadPromise, {
        pending: "Fetching all locations & generating QR File, please wait...",
        success: { render: () => "File Downloaded Successfully!", autoClose: 3000 },
        error: {
          render({ data: err }) {
            console.error(err);
            return err?.message || "Failed to generate or download the QR document.";
          },
        },
      });
    },
    [selectedQr, triggerFetchAll, id, data?.clientName, makeQrDOCX, qrCountInc],
  );

  return (
    <>
      {!error && data?.client && (
        <div className="max-h-full overflow-auto flex flex-col">
          <div className="border-b border-neutral-200 max-h-full ">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-1">
              <div>
                <div className="flex items-center gap-5">
                  <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                    {data.client.name}
                  </h2>

                  <button
                    type="button"
                    aria-label="Edit client"
                    className="text-base font-normal cursor-pointer"
                    onClick={() => {
                      setClientDetails(data.client);
                      dispatch(toggleModal({ name: "newClient", status: true }));
                    }}>
                    <FaEdit className="text-blue-700" />
                  </button>
                  {isModalOpen.newClient && (
                    <NewClientModal update id={data.client._id} clientDetails={clientDetails} />
                  )}
                </div>

                {/* Meta Information Row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-1.5 text-sm text-neutral-500">
                  <div>
                    <span className="font-medium text-neutral-700">Contract No:</span>{" "}
                    {data.client.contractNo}
                  </div>
                  <span className="hidden sm:inline text-neutral-300">&middot;</span>
                  <div>
                    <span className="font-medium text-neutral-700">Email:</span>{" "}
                    {data.client.email}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-700">Phone:</span>{" "}
                    {data.client.phone}
                  </div>
                  {data?.client?.startDate && (
                    <div>
                      <span className="font-medium text-neutral-700">Contract Start Date:</span>{" "}
                      {formatDate(data.client.startDate)}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-neutral-700">Contract Period:</span>{" "}
                    {data.client?.servicePeriod} Months
                  </div>
                  {data?.client?.endDate && (
                    <div>
                      <span className="font-medium text-neutral-700">Contract End Date:</span>{" "}
                      {formatDate(data.client.endDate)}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-neutral-700">Preferred Day:</span>{" "}
                    {data.client.prefDay}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-700">Preferred Time:</span>{" "}
                    {data.client.prefTime}
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
                  <LocationModal clientId={id} locationDetails={locationDetails} />
                )}
              </div>
            </div>

            {/* Address Section */}
            <div className="text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
              <span className="font-semibold text-neutral-800 mr-1">Address:</span>
              {data.client.address}
            </div>
          </div>

          {isModalOpen.allqr && (
            <QRDownload
              dispatch={dispatch}
              handleDownloadAll={handleDownloadAll}
              docQrLoading={docQrLoading}
              fetchAllLoading={fetchAllLoading}
            />
          )}

          <div className="overflow-auto border border-neutral-300 rounded-lg max-h-[500px] my-2">
            <table className="w-full border-collapse whitespace-nowrap bg-white">
              <thead className="sticky top-0 bg-gray-300 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">
                <tr className="h-10 text-sm md:text-base text-neutral-800">
                  <th className="font-bold text-center border border-neutral-300 px-3">Sr No</th>
                  <th className="font-bold text-center border border-neutral-300 px-3 min-w-26">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-800"
                        onClick={() => selectedQr.length > 0 && setSelectedQr([])}>
                        {selectedQr.length > 0 ? "Deselect" : "Select"}
                      </button>
                      <button
                        aria-label="Download all QR codes"
                        className="px-2 py-1 rounded bg-blue-700 text-white hover:bg-blue-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={docQrLoading}
                        onClick={() => dispatch(toggleModal({ name: "allqr", status: true }))}>
                        <PiDownloadSimpleBold className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                  <th className="font-bold text-center border border-neutral-300 px-3">Floor</th>
                  <th className="font-bold text-left border border-neutral-300 px-4">
                    Location ({data.totalLocations})
                  </th>
                  <th className="font-bold text-center border border-neutral-300 w-32 px-3">
                    Services / [Products]
                  </th>
                  <th className="font-bold text-center border border-neutral-300 w-28 px-3">
                    Today's Service Status
                  </th>
                  <th className="font-bold text-center border border-neutral-300 w-28 px-3">
                    Loc Qr / Product Qr
                  </th>
                  <th className="font-bold text-center border border-neutral-300 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {data.locations?.map((location, i) => (
                  <LocationRow
                    key={location._id}
                    location={location}
                    index={(page - 1) * limit + (i + 1)}
                    isSelected={selectedQrIds.has(location._id)}
                    onToggleSelect={toggleSelectedQr}
                    onEdit={handleEditModal}
                    onDelete={handleDelete}
                    onDownloadQr={handleQrDownload}
                    deleteLoading={deleteLoading}
                    dispatch={dispatch}
                    isModalOpen={isModalOpen}
                    makeQrDOCX={makeQrDOCX}
                    clientName={data?.clientName}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            setPage={setPage}
            totalPages={data?.pages}
            sessionKey="clientLocationPage"
          />
        </div>
      )}
    </>
  );
};
export default SingleClient;

function formatDate(value) {
  const d = typeof value === "string" ? value : value?.toISOString?.();
  return d ? d.split("T")[0] : "";
}

// ---------------------------------------------------------------------------
// Extracted + memoized row: previously every row was inline JSX inside the
// parent's .map(), so toggling ANY checkbox (which updates `selectedQr` in
// the parent) re-rendered every row in the table. Memoizing the row means
// only the row(s) whose props actually changed re-render.
// ---------------------------------------------------------------------------
const LocationRow = memo(function LocationRow({
  location,
  index,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onDownloadQr,
  deleteLoading,
  dispatch,
  isModalOpen,
  makeQrDOCX,
  clientName,
}) {
  const hasProducts = (location.product?.length ?? 0) > 0;
  const productModalKey = `${location._id}_product`;

  return (
    <tr className="h-11 text-sm bg-white hover:bg-slate-50 transition-colors">
      <td className="px-3 border border-neutral-200 font-medium text-neutral-500 text-center">
        {index}
      </td>
      <td className="px-3 border border-neutral-200 text-center">
        <input
          type="checkbox"
          aria-label={`Select ${location.location}`}
          checked={isSelected}
          onChange={() => onToggleSelect(location)}
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
        {location.subLocation && (
          <span className="text-neutral-500 text-xs block">{location.subLocation}</span>
        )}
      </td>
      <td className="px-3 border border-neutral-200 text-center leading-relaxed text-neutral-600">
        <span className="font-semibold">
          {location.service?.map((item) => item.serviceName).join(", ") || "-"}
        </span>
        {hasProducts && (
          <div className="text-sm text-neutral-500 font-semibold mt-0.5">
            [{location.product.map((item) => item.productName).join(", ")}]
          </div>
        )}
      </td>
      <td className="px-3 border border-neutral-200 text-center">
        <GetSchedulesForLocation service={location?.service} />
      </td>
      <td className="px-3 border border-neutral-200 text-center">
        <div className="flex justify-center items-center gap-1">
          <Button
            label={
              <span className="flex items-center gap-1">
                <PiDownloadSimpleBold /> {location?.qrCount}
              </span>
            }
            small
            height="h-7"
            onClick={() => onDownloadQr(location._id, location)}
          />
          <span className="text-neutral-300">|</span>
          <div className={hasProducts ? "" : "opacity-40 pointer-events-none"}>
            <Button
              label={
                <span className="flex items-center gap-1">
                  <PiDownloadSimpleBold /> ~
                </span>
              }
              small
              height="h-7"
              onClick={() => dispatch(toggleModal({ name: productModalKey, status: true }))}
            />
          </div>
          {isModalOpen[productModalKey] && hasProducts && (
            <ProductQrModal
              data={location}
              dispatch={dispatch}
              toggleModal={toggleModal}
              makeQrDOCX={makeQrDOCX}
              modalKey={productModalKey}
              clientName={clientName}
            />
          )}
        </div>
      </td>
      <td className="px-4 border border-neutral-200 text-center">
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label={`Edit ${location.location}`}
            onClick={() => onEdit(location)}
            className="hover:scale-105 transition-transform">
            <FaEdit className="h-5 w-5 text-indigo-600 hover:text-indigo-800" />
          </button>
          <DeleteModal
            title="Delete Location"
            description="this location"
            handleDelete={onDelete}
            isLoading={deleteLoading}
            id={{ id: location._id, name: `${location.location}, ${location.subLocation}` }}
          />
        </div>
      </td>
    </tr>
  );
});

function ProductQrModal({ data, dispatch, toggleModal, makeQrDOCX, modalKey, clientName }) {
  const [qrCountInc] = useQrCounterMutation();
  const [downloading, setDownloading] = useState({ id: null, loading: false });

  const handleDownloadSingle = async (qrUrl, product) => {
    try {
      setDownloading({ id: product._id, loading: true });
      await downloadQrDocx({
        makeQrDOCX,
        qrCountInc,
        qrs: [qrUrl],
        client: `${data.floor}, ${data.location}, ${data.subLocation}`,
        filename: `${clientName || "Client"}-${product.serialNo}.docx`,
        ids: undefined, // per-product QR count isn't tracked at product granularity today
      });
      toast.success(`Downloaded QR for ${product.serialNo}`);
    } catch (error) {
      console.error(error);
      toast.error(error?.data?.msg || "Failed to download QR code.");
    } finally {
      setDownloading({ id: null, loading: false });
    }
  };

  const handleDownloadAllLocProducts = () => {
    const validProducts = data.product?.filter((p) => p.qr);
    if (!validProducts || validProducts.length === 0) {
      toast.info("No valid product QRs found to download.");
      return;
    }

    setDownloading({ id: "all", loading: true });

    const downloadPromise = downloadQrDocx({
      makeQrDOCX,
      qrCountInc,
      qrs: validProducts.map((p) => p.qr),
      client: `${data.floor}, ${data.location}, ${data.subLocation}`,
      filename: `${clientName || "Client"}-${data.location || "Location"}-Products.docx`,
      ids: undefined,
    }).finally(() => setDownloading({ id: null, loading: false }));

    toast.promise(downloadPromise, {
      pending: "Generating combined product QR file, please wait...",
      success: "All location product QRs downloaded successfully!",
      error: {
        render({ data: err }) {
          console.error(err);
          return err?.data?.msg || "Failed to generate bulk product QR document.";
        },
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-neutral-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50 select-none">
          <h3 className="text-lg font-bold text-neutral-800">Products QR Download</h3>
          <button
            type="button"
            aria-label="Close"
            className="text-neutral-400 hover:text-red-600 transition-colors text-lg font-bold w-6 h-6 flex items-center justify-center leading-none rounded-full border border-neutral-300 hover:border-red-600 focus:outline-none"
            onClick={() => dispatch(toggleModal({ name: modalKey, status: false }))}>
            &times;
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-900 line-clamp-2 break-words">
                {data.floor}, {data.location}
                {data.subLocation && ` (${data.subLocation})`}
              </p>
            </div>
            <Button
              label={
                <span className="flex items-center gap-1.5 font-semibold">
                  {downloading.id === "all" && downloading.loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PiDownloadSimpleBold className="w-4 h-4" />
                  )}
                  <span>Download All</span>
                </span>
              }
              small
              disabled={downloading.loading}
              color="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleDownloadAllLocProducts}
            />
          </div>

          <div className="border border-neutral-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto divide-y divide-neutral-100">
            {data.product?.length > 0 &&
              data.product.map((prod, i) => (
                <div
                  key={prod._id}
                  className="grid grid-cols-12 items-center gap-2 p-3 text-sm hover:bg-neutral-50 transition-colors">
                  <span className="col-span-1 text-center font-medium text-neutral-400">{i + 1}</span>
                  <div className="col-span-6 min-w-0">
                    <p className="font-semibold text-neutral-800 truncate">{prod.productName}</p>
                    {prod.versionName && (
                      <span className="text-xs text-neutral-500 block truncate">{prod.versionName}</span>
                    )}
                  </div>
                  <span className="col-span-3 text-xs font-mono bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded text-center truncate">
                    {prod.serialNo || "N/A"}
                  </span>
                  <div className="col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(prod.qr, prod)}
                      disabled={downloading.loading}
                      className="p-1.5 rounded-md hover:bg-neutral-200 text-neutral-600 hover:text-blue-600 transition-all border border-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                      title={`Download QR for ${prod.serialNo}`}>
                      {downloading.id === prod._id && downloading.loading ? (
                        <LoadingSpinner />
                      ) : (
                        <PiDownloadSimpleBold className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GetSchedulesForLocation({ service, date = undefined }) {

  const todayISO = useMemo(
    () => (date ? new Date(date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]),
    [date],
  );

  const dates = useMemo(
    () => service?.flatMap((ser) => ser?.schedule?.filter((sch) => sch?.date?.split("T")[0] === todayISO)) ?? [],
    [service, todayISO],
  );

  const completed = dates.filter((d) => d?.completed && d.status === "Done");
  const missed = dates.filter((d) => d?.status === "Missed"); // was `dates.filter` without `?.` — crashed when dates was undefined

  return (
    <div>
      {completed.length}/{dates.length}{" "}
      <span className="text-red-600 font-semibold">{missed.length > 0 ? missed.length : ""}</span>
    </div>
  );
}

function QRDownload({ dispatch, handleDownloadAll, docQrLoading, fetchAllLoading }) {
  const formbody = (
    <div className={`outline m-1 grid grid-cols-2 gap-3 p-5 ${docQrLoading ? "cursor-not-allowed" : ""}`}>
      <h3 className="text-2xl font-semibold col-span-full">Select which Qr to download</h3>
      <div>
        <button
          className="bg-blue-500 px-2 py-1 rounded-lg flex items-center gap-2 text-white disabled:cursor-not-allowed"
          disabled={docQrLoading || fetchAllLoading}
          onClick={(e) => {
            e.preventDefault();
            handleDownloadAll("regular");
          }}>
          Regular Qr <PiDownloadSimpleBold />
        </button>
      </div>
      <div>
        <button
          className="bg-blue-500 px-2 py-1 rounded-lg flex items-center gap-2 text-white disabled:cursor-not-allowed"
          disabled={docQrLoading || fetchAllLoading}
          onClick={(e) => {
            e.preventDefault();
            handleDownloadAll("product");
          }}>
          Product Qr <PiDownloadSimpleBold />
        </button>
      </div>
    </div>
  );
  return (
    <FormModal
      formBody={formbody}
      open={"allqr"}
      submitLabel={''}
      onSubmit={(e) => e.preventDefault()}
      handleClose={() => dispatch(toggleModal({ name: "allqr", status: false }))}
    />
  );
}