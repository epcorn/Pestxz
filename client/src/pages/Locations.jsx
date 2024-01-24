import { saveAs } from "file-saver";
import { useSelector } from "react-redux";
import { AlertMessage, Button, Loading } from "../components";
import { useAllLocationsQuery } from "../redux/locationSlice";

const Locations = () => {
  const { user } = useSelector((store) => store.helper);

  const { data, isLoading, isFetching, error } = useAllLocationsQuery({
    id: user.role,
  });

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
                  <th className="font-bold text-center border-neutral-500 border-2 w-32 px-3">
                    Products
                  </th>
                  <th className="font-bold text-center border-neutral-500 border-2 w-28">
                    QR Code
                  </th>
                </tr>
              </thead>
              <tbody className="w-full">
                {data.locations?.map((location) => (
                  <tr
                    key={location._id}
                    className="h-10 text-sm leading-none bg-text border-b border-neutral-500 hover:bg-slate-200"
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
                        color="bg-green-600"
                        onClick={() =>
                          saveAs(location.qr, `QR-${location.location}`)
                        }
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
export default Locations;
