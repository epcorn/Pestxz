import { Link } from "react-router-dom";
import { AlertMessage, Button, ComplaintTable, Loading } from "../components";
import { useAllComplaintsQuery } from "../redux/serviceSlice";
import { dateFormat, progress } from "../utils/helperFunctions";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { toggleModal } from "../redux/helperSlice";
import { ComplaintModal } from "../components/modals";
import { AiOutlineClose, AiOutlineSearch } from "react-icons/ai";
import { useEffect, useState } from "react";
import { useAllLocationsQuery } from "../redux/locationSlice";
import { useAllClientsQuery } from "../redux/clientSlice";

const Complaints = () => {
  const [page, setPage] = useState(1);
  const [myClient, setMyClient] = useState(null)
  const [tempSearch, setTempSearch] = useState("");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState({ client: "", floor: "" });
  const dispatch = useDispatch();

  const { user, isModalOpen } = useSelector((store) => store.helper);
  const { data: clients = [] } = useAllClientsQuery({ skip: user.rights.raise });


  const { data: clientLocations, isLoading: locationLoading } =
    useAllLocationsQuery({
      id: user.type === "ClientEmployee" ? user.client : myClient
    },
      { skip: user.type === "ClientEmployee" ? !user?.client : !myClient }
    );

  const { data, isLoading, isFetching, error } = useAllComplaintsQuery({
    search,
    page,
    location: location?.floor || "All",
  });
  console.log(myClient)

  const pages = Array.from({ length: data?.pages }, (_, index) => index + 1);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(tempSearch);
  };

  const clearSearch = () => {
    setTempSearch("");
    setSearch("");
    setLocation({ client: "", floor: "" });
  };

  const complaints = data?.complaints?.filter(d => d.type !== "Regular")

  return (
    <>
      {isLoading || isFetching ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}
      <div className="md:flex flex-col justify-around">
        {/* heading */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-light text-slate-800">
            Hello, <span className="capitalize font-semibold text-sky-700">{user.name}</span>
          </h2>
          <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-medium tracking-wide bg-slate-100 text-slate-600 rounded-full border border-slate-200">
            {user.role}
          </span>
        </div>

        {/* search section  */}
        <div className="flex justify-between">
          <form onSubmit={handleSearch} className="flex items-center flex-wrap">
            <div className="flex items-center px-1 bg-white border w-full md:w-60 lg:w-80 rounded border-gray-300 mr-3">
              <AiOutlineSearch />
              <input
                type="text"
                className="py-1 md:py-1.5 pl-1 w-full focus:outline-none text-sm rounded text-gray-600 placeholder-gray-500"
                placeholder="Complaint number"
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
              />
              {tempSearch && (
                <button type="button" onClick={clearSearch}>
                  <AiOutlineClose color="red" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {/* <label htmlFor="">Select Floors</label> */}

              {user.role === "Admin" &&
                <select
                  value={location.client}
                  onChange={(e) => { setLocation(prev => ({ ...prev, client: e.target.value })); setMyClient(e.target.value) }}

                  className="mr-2 mt-0.5 w-40 py-0.5 h-8.5 px-2 border-2 rounded-md outline-none transition border-neutral-300 focus:border-black disabled:bg-slate-100"
                >
                  <option value="">--Select Clients--</option>
                  {clients?.map((client, index) => (
                    <option key={client._id} value={client._id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              }
              <select
                value={location.floor}
                onChange={(e) => setLocation(prev => ({ ...prev, floor: e.target.value }))}

                className="mr-2 mt-0.5 w-40 py-0.5 h-8.5 px-2 border-2 rounded-md outline-none transition border-neutral-300 focus:border-black disabled:bg-slate-100"
              >
                <option value="">--Select Floor--</option>
                {clientLocations?.floors.map((item, index) => (
                  <option key={index} value={item}>
                    {item}
                  </option>
                ))}
              </select>

            </div>

            <Button type="submit" label="Search" color="bg-black" height="h-8" />
          </form>
          {/* new complaint button  */}
        </div >
        {user.rights.raise &&
          <button
            className="px-4 py-2 w-fit ml-auto bg-blue-800 text-white rounded-lg"
            onClick={() =>
              dispatch(toggleModal({ name: "complaint", status: true }))
            }
          >New Complaint</button>
        }
      </div >
      {isModalOpen.complaint && <ComplaintModal locationId="New Complaint" />}

      {
        data && (
          <>
            <ComplaintTable data={complaints} user={user} />
            {pages.length > 1 && (
              <nav className="mb-4">
                <ul className="list-style-none flex justify-center mt-2">
                  {pages.map((item) => (
                    <li className="pr-1" key={item}>
                      <button
                        className={`relative block rounded px-3 py-1.5 text-sm transition-all duration-30  ${page === item ? "bg-blue-400" : "bg-neutral-700"
                          } text-white hover:bg-blue-400`}
                        onClick={() => setPage(item)}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </>
        )
      }
      {
        data?.complaints?.length < 1 && (
          <p className="text-center pt-2 text-red-600 font-semibold text-lg">
            No Complaint Found
          </p>
        )
      }
    </>
  );
};
export default Complaints;
