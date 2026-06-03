import { saveAs } from "file-saver";
import { useDispatch, useSelector } from "react-redux";
import { AlertMessage, Button, Loading } from "../components";
import { FaEdit } from "react-icons/fa";
import { useAllLocationsQuery, useDeleteLocationMutation } from "../redux/locationSlice";
import { MdAddCircle } from "react-icons/md";
import { toggleModal } from "../redux/helperSlice";
import { DeleteModal, LocationModal } from "../components/modals";
import { useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { useAllUserQuery } from "../redux/adminSlice";
import ImagesModal from "../components/modals/ImagesModal";

const Locations = () => {
  const [selectFloor, setSelectFloor] = useState([])
  const [locationDetails, setLocationDetails] = useState({});
  const dispatch = useDispatch();
  const { user, isModalOpen } = useSelector((store) => store.helper);
  const [deleteLocation, { isLoading: deleteLoading }] = useDeleteLocationMutation();
  const { data, isLoading, isFetching, error } = useAllLocationsQuery({
    id: user?.type,
  }, { skip: user?.role !== "ClientAdmin" }
  );
  const { data: clientusers } = useAllUserQuery();
  console.log(data)

  const client = data?.client;
  return (
    <>
      {isLoading || isFetching ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}

      {!error && data && (
        <div>
          <h2 className="text-center text-2xl text-sky-700 font-semibold">
            {client.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 my-5 mx-2">
            <div>
              <h6 className="">
                <strong>Contract No: </strong>{" "}
                <span className="text-sm">{client.contractNo}</span>
              </h6>
              <h6 className="">
                <strong>Service Period: </strong> <span className="text-sm">{client.servicePeriod} Months</span>
              </h6>
              <h6 className="">
                <strong>Email: </strong> <span className="text-sm">{client.email}</span>
              </h6>
            </div>
            <div>
              <div className="flex justify-between flex-wrap">
                <h6 className="">
                  <strong>Start Date: </strong> <span className="text-sm">{client.startDate}</span>
                </h6>
                <h6 className="">
                  <strong>End Date: </strong> <span className="text-sm">{client.endDate}</span>
                </h6>
              </div>
              <h6 className="">
                <strong>Address: </strong> <span className="text-sm">{client.address}</span>
              </h6>
            </div>
          </div>

          <div className="overflow-y-auto my-4">
            <table className="w-full border whitespace-nowrap border-neutral-500 bg-text">
              <thead>
                <tr className="h-9 w-full text-md md:text-lg leading-none">
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
                  <th className="font-bold text-center border-neutral-500 border-2 w-32 px-3 hidden">
                    Assign
                  </th>
                  <th className="font-bold text-center border-neutral-500 border-2 w-28">
                    QR Code
                  </th>
                </tr>
              </thead>

              {/* FIXED CONDITIONAL LAYOUT LOGIC */}
              {!data?.locations || data.locations.length === 0 ? (
                <tbody className="w-full">
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-20 text-sm font-medium text-neutral-500"
                    >
                      No locations available
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="w-full">
                  {data?.locations.map((location) => (
                    <tr
                      key={location._id}
                      className="h-10 text-sm leading-none bg-text border-b border-neutral-500 hover:bg-slate-200"
                    >
                      <td className="px-3 border-r font-normal border-neutral-500 hover:text-cyan-700">
                        <Link to={`/location/${location._id}`}>
                          <Button label={location.floor}/>
                        </Link>
                      </td>
                      <td className="px-3 border-r font-normal border-neutral-500">
                        {location.location}, {location.subLocation}
                      </td>
                      <td className="px-3 border-r font-normal text-center border-neutral-500">
                        {location.service?.map((item) => item.serviceName).join(", ")}
                      </td>
                      <td className="px-3 border-r font-normal text-center border-neutral-500 hidden">
                        <select name="" id="" className="text-center">
                          <option value="NA">---Select---</option>
                          {clientusers?.map(u => (
                            <option key={u._id} value={u._id}>{u.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="border-r font-normal text-center border-neutral-500">
                        {user.type !== "ClientEmployee" ?
                          <Button
                            label="Download"
                            small
                            height="h-7"
                            color="bg-green-600"
                            onClick={() =>
                              saveAs(location.qr, `QR-${location.location}`)
                            }
                          />
                          :
                          <>
                            <Button
                              label="Image"
                              onClick={() => dispatch(toggleModal({
                                name: "qrimage",
                                status: true,
                              }))} />

                            {isModalOpen.qrimage && (
                              <ImagesModal image={location.qr} name={"qrimage"} />
                            )}
                          </>
                        }
                      </td>

                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default Locations;
