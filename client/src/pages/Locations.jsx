import { saveAs } from "file-saver";
import { useDispatch, useSelector } from "react-redux";
import { AlertMessage, Button, Loading, LoadingSpinner } from "../components";
import { useAllLocationsQuery } from "../redux/locationSlice";
import { toggleModal } from "../redux/helperSlice";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAllUserQuery } from "../redux/adminSlice";
import ImagesModal from "../components/modals/ImagesModal";
import Headers from "../components/Headers";
import Pagination from "./Pagination";
import { GetSchedulesForLocation } from "./SingleClient";

const Locations = () => {
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();
  const { user, isModalOpen } = useSelector((store) => store.helper);

  const limit = 30;
  const { data, isLoading, isFetching, error } = useAllLocationsQuery(
    { id: user?.type, limit: limit, page },
    { skip: user?.role !== "ClientAdmin" }
  );
  const { data: clientusers } = useAllUserQuery();

  // if (isLoading || isFetching) return <Loading />;
  if (error) return <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>;
  if (!data) return null;

  const client = data.client || {};

  return (
    <div className="px-4 pb-2 max-w-7xl max-h-full mx-auto text-gray-800 antialiased overflow-y-auto flex flex-col scroll-smooth ">
      {/* Top Header Row */}
      <div className="border-b border-gray-200">
        <Headers header="Location Management" user={user} />
      </div>

      {/* Contract Details Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 border border-gray-200 rounded text-sm">
        <div className="space-y-1">
          <p><strong>Contract No:</strong> {client.contractNo}</p>
          <p><strong>Service Period:</strong> {client.servicePeriod} Months</p>
          <p><strong>Email:</strong> {client.email}</p>
        </div>
        <div className="space-y-1">
          <p><strong>Start Date:</strong> {new Date(client?.startDate).toISOString().split("T")[0]}</p>
          <p><strong>End Date:</strong> {new Date(client?.endDate).toISOString().split("T")[0]}</p>
          <p><strong>Address:</strong> {client.address}</p>
        </div>
      </div>

      {/* Main Table Interface */}
      <div className="overflow-x-auto border border-gray-200 rounded mb-4">
        <table className="w-full text-left text-sm border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-300 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider sticky top-0 text-gray-600">
              <th className="p-3 border-r border-gray-200 w-32">Floor</th>
              <th className="p-3 border-r border-gray-200">Location</th>
              <th className="p-3 border-r border-gray-200">Status</th>
              <th className="p-3 border-r border-gray-200">Services & [Products]</th>
              <th className="p-3 text-center w-36">QR Code</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {!data.locations || data.locations.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-gray-400 font-medium">
                  No locations available.
                </td>
              </tr>
            ) : (isLoading || isFetching) ? <tr>
              <td colSpan={4} className="h-52 text-center">
                <div className="flex justify-center items-center h-full w-full">
                  <LoadingSpinner />
                </div>
              </td>
            </tr>
              : (
                data.locations.map((location) => (
                  <tr key={location._id} className="hover:bg-gray-50 transition-colors">
                    {/* Floor Link Cell */}
                    <td className="p-3 border-r border-gray-200 font-medium">
                      <Link to={`/location/${location._id}`} className="block">
                        <Button label={location.floor} small color="bg-blue-600 text-white" />
                      </Link>
                    </td>

                    {/* Location Strings Cell */}
                    <td className="p-3 border-r border-gray-200 vertical-align-middle">
                      <span className="font-semibold">{location.location}</span>
                      {location.subLocation && <span className="text-gray-500 text-xs block">{location.subLocation}</span>}
                    </td>

                    <td className="p-3 border-r border-gray-200 leading-relaxed">
                      <GetSchedulesForLocation service={location?.service} />
                    </td>

                    {/* Linked Parameters Info Items */}
                    <td className="p-3 border-r border-gray-200 leading-relaxed">
                      <div className="text-gray-700">
                        {location.service?.map((item) => item.serviceName).join(", ") || "—"}
                      </div>
                      {location.product && location.product.length > 0 && (
                        <div className="text-sm text-gray-700 font-semibold mt-1">
                          [{location.product.map((p) => p.productName).join(", ")}]
                        </div>
                      )}
                    </td>

                    {/* Dynamic Action Trigger Buttons */}
                    <td className="p-3 text-center">
                      {user.type !== "ClientEmployee" ? (
                        <Button
                          label="Download"
                          small
                          height="h-7"
                          color="bg-emerald-600 text-white"
                          onClick={() => saveAs(location.qr, `QR-${location.location}`)}
                        />
                      ) : (
                        <>
                          <Button
                            label="View Image"
                            small
                            height="h-7"
                            color="bg-gray-600 text-white"
                            onClick={() => dispatch(toggleModal({ name: "qrimage", status: true }))}
                          />
                          {isModalOpen.qrimage && (
                            <ImagesModal image={location.qr} name="qrimage" />
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>

      {/* Structural Pagination Layout Row */}
      <div className="pt-2">
        <Pagination page={page} setPage={setPage} totalPages={data?.pages} />
      </div>
    </div>
  );
};

export default Locations;