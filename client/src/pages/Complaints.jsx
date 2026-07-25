import { Link } from "react-router-dom";
import { AlertMessage, Button, ComplaintTable, InputSelect, Loading } from "../components";
import { useAllComplaintsQuery, useAssignWorkMutation } from "../redux/serviceSlice";
import { dateFormat, progress } from "../utils/helperFunctions";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { toggleModal } from "../redux/helperSlice";
import { ComplaintModal } from "../components/modals";
import { AiOutlineClose, AiOutlineSearch } from "react-icons/ai";
import { useEffect, useRef, useState } from "react";
import { useAllLocationsQuery } from "../redux/locationSlice";
import { useAllClientsQuery } from "../redux/clientSlice";
import { useAllUserQuery } from "../redux/adminSlice";
import { toast } from "react-toastify";
import Select from "react-select";
import Headers from "../components/Headers";
import { useGetSingleUserQuery } from "../redux/userSlice";
import { socket } from "../socket";
import Pagination from "./Pagination";
import { IoIosArrowDown } from "react-icons/io";


const Complaints = () => {
  const [page, setPage] = useState(() => sessionStorage.getItem("complaintPage") || 1);
  const [myClient, setMyClient] = useState(null)
  const [tempSearch, setTempSearch] = useState("");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState({ client: "", floor: "" });
  const dispatch = useDispatch();

  const { user, isModalOpen } = useSelector((store) => store.helper);
  const { data: DBuser } = useGetSingleUserQuery(user._id, { skip: !user._id });
  const { data: clientsData = [] } = useAllClientsQuery();
  const clients = clientsData?.clients || []
  const { data: clientLocations, isLoading: locationLoading } =
    useAllLocationsQuery({
      id: user.type === "ClientEmployee" ? user.client : myClient
    },
      { skip: user.type === "ClientEmployee" ? !user?.client : !myClient, }
    );

  const { data, isLoading, isFetching, error } = useAllComplaintsQuery({
    search,
    page,
    client: location.client || "",
    location: location?.floor || "All",
  });

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
  const complaints = data?.complaints?.filter(d => d?.type !== "Regular") ?? []

  return (
    <>
      {isLoading || isFetching ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}
      <div className="h-[calc(100dvh-6.8rem)] flex flex-col">
        <div className="md:flex flex-col justify-around">
          {/* heading */}
          <Headers header={'Complaints'} user={user} />
          {/* search section  */}
          <div className="">
            <form onSubmit={handleSearch} className="flex flex-wrap ">
              <div className="flex items-center px-1 bg-white border max-w-52 rounded border-gray-500 mr-3">
                <AiOutlineSearch />
                <input
                  type="text"
                  className="py-1 pl-1 w-full focus:outline-none text-sm rounded text-gray-600 placeholder-gray-500"
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
              {/* <label htmlFor="">Select Floors</label> */}
              {user.type === "PestEmployee" &&
                <select
                  value={location?.client}
                  onChange={(e) => { setLocation(prev => ({ ...prev, client: e.target.value })); setMyClient(e.target.value) }}

                  className="mr-2 mt-0.5 w-40 py-0.5 h-8.5 px-2 border-2 rounded-md outline-none transition border-neutral-300 focus:border-black disabled:bg-slate-100 bg-white"
                >
                  <option value="">Client Name</option>
                  {clients?.map((client, index) => (
                    <option key={client._id} value={client._id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              }
              {/* <select
                value={location.floor}
                onChange={(e) => setLocation(prev => ({ ...prev, floor: e.target.value }))}
                size={5}
                className="mr-2 mt-0.5 w-40 py-0.5 h-8.5 px-2 border-2 rounded-md outline-none transition border-neutral-300 focus:border-black disabled:bg-slate-100 bg-white fixed-height-select"
              >
                <option value="">Location</option>
                {clientLocations?.floors.map((item, index) => (
                  <option key={index} value={item}>
                    {item}
                  </option>
                ))}
              </select> */}
              <>
                <FloorSelect value={location?.floor} onChange={(val) => setLocation(prev => ({ ...prev, floor: val }))} floors={clientLocations?.floors} />
              </>


              <Button type="submit" label="Search" color="bg-black" height="h-8" />
              {DBuser && DBuser.rights.raise &&
                <button
                  className="px-4 py-2 w-fit ml-auto bg-blue-800 text-white rounded-lg"
                  onClick={() =>
                    dispatch(toggleModal({ name: "complaint", status: true }))
                  }
                >New Complaint</button>
              }
            </form>
            {/* new complaint button  */}
          </div >
        </div >
        {isModalOpen.complaint && <ComplaintModal mode={"create"} />}
        {data && (
          <>
            <ComplaintTable data={complaints} user={user} />

            <Pagination page={page} setPage={setPage} totalPages={data?.pages} sessionKey="complaintPage" />
          </>
        )}
      </div >
    </>
  );
};
export default Complaints;

const FloorSelect = ({ value, onChange, floors }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative mr-2 mt-0.5 w-40" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex outline-2 outline-neutral-300 rounded-md bg-white items-center pr-2 w-full">

        <div className="w-full py-0.5 h-8.5 px-2 focus:outline-0 rounded-md  transition bg-white text-left"
        >
          {value || "Location"}
        </div>
        <IoIosArrowDown />

      </button>

      {open && (
        <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto border-2 border-neutral-300 rounded-md bg-white shadow-lg">
          <li
            onClick={() => { onChange(""); setOpen(false); }}
            className="px-2 py-1 cursor-pointer hover:bg-neutral-100 text-gray-400"
          >
            Location
          </li>
          {floors?.map((item, index) => (
            <li
              key={index}
              onClick={() => { onChange(item); setOpen(false); }}
              className="px-2 py-1 cursor-pointer hover:bg-neutral-100"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export function AssignWork({ complaintId, currentAssgndVal = null, show }) {
  const { user } = useSelector((store) => store.helper);
  const { data: users } = useAllUserQuery(undefined, { skip: user.role !== "Admin" });
  const [assignWork] = useAssignWorkMutation();

  const operators = users?.filter(u => u.role === "Operator")?.map(op => ({
    label: op.name, value: op._id,
  })) || [];

  const defaultValue = operators.find(op => op.label === currentAssgndVal) || null;

  const handleOperatorChange = async (selectedOption) => {
    if (!selectedOption) return;
    try {
      const data = {
        value: selectedOption.value,
        label: selectedOption.label,
        complaintId: complaintId
      };
      const res = await assignWork(data).unwrap();
      show({ id: "", status: false });
      socket.emit("complaint-assigned", {
        user: user.name,
        status: selectedOption.value,
        url: res.url,
      })
      toast.success("Successfully assigned operator!");
    } catch (error) {
      show({ id: "", status: false });
      if (error.status === 403) return toast.warn(error.data.msg);
      toast.error("Failed to assign operator");
    }
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '32px',
      height: '32px',
      fontSize: '13px',
      borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      '&:hover': { borderColor: '#3b82f6' },
      borderRadius: '0.375rem',
    }),
    valueContainer: (base) => ({ ...base, padding: '0 8px' }),
    indicatorsContainer: (base) => ({ ...base, height: '30px' }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menu: (base) => ({
      ...base,
      fontSize: '13px',
      borderRadius: '0.375rem',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // shadow-md
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'transparent',
      color: state.isSelected ? '#fff' : '#374151',
      cursor: 'pointer',
      padding: '6px 12px',
      '&:active': { backgroundColor: '#3b82f6' },
    }),
  };

  return (
    <div
      className="absolute left-0 -top-2 mt-1 bg-white rounded-md shadow-lg border border-gray-100 min-w-[150px] z-0 p-1"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="hidden text-[10px] uppercase font-bold tracking-wider text-gray-400 px-2 py-1 select-none">
        Assign Operator
      </div>
      <Select
        options={operators}
        defaultValue={defaultValue}
        onChange={handleOperatorChange}
        placeholder="Select..."
        styles={customStyles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        isSearchable={true}
        autoFocus={true}
      />
    </div>
  );
}
