import { useEffect, useState } from "react";
import { AiOutlineMenuFold, AiOutlineMenuUnfold } from "react-icons/ai";
import { BsBarChartFill, BsDatabaseFillAdd } from "react-icons/bs";
import { FaBuilding, FaFileAlt, FaPowerOff, FaUser } from "react-icons/fa";
import { FaBug } from "react-icons/fa6";
import { MdLocationOn } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { useMatch, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../assets/logo12.png";
import { removeCredentials } from "../redux/helperSlice";
import { useLogoutMutation } from "../redux/userSlice";
import { useGetSingleClientQuery } from "../redux/clientSlice";
import { MdOutlineQrCodeScanner } from "react-icons/md";
import TickerTape from "./TickerTape";


const roles = ["Admin", "Operator", "Supervisor", "TeamLeader", "BranchAdmin", "PestAdmin", "ClientAdmin", "ClientEmployee"]
const navList = [
  {
    icon: <MdOutlineQrCodeScanner className="w-6 h-6 " />,
    name: "Scan",
    to: "/scan",
    role: roles,
  },
  {
    icon: <BsBarChartFill className="w-6 h-6 " />,
    name: "Dashboard",
    to: "/stats",
    role: ["Admin", "ClientAdmin", "Operator", "BranchAdmin"],
  },
  {
    icon: <FaBuilding className="w-6 h-6" />,
    name: "Clients",
    to: "/clients",
    role: ["Admin", "Supervisor", "TeamLeader", "BranchAdmin",],
  },
  {
    icon: <BsDatabaseFillAdd className="w-6 h-6" />,
    name: "Services",
    to: "/services",
    role: ["Admin", "Supervisor", "TeamLeader", "BranchAdmin", "PestAdmin",],
  },
  {
    icon: <FaBug className="w-6 h-6" />,
    name: "Complaints",
    to: "/complaints",
    role: ["Admin", "ClientAdmin", "ClientEmployee", "TeamLeader"],
  },
  {
    icon: <MdLocationOn className="w-6 h-6" />,
    name: "Locations",
    to: "/locations",
    role: ["ClientAdmin"],
  },
  {
    icon: <FaUser className="w-6 h-6" />,
    name: "Users",
    to: "/users",
    role: ["Admin", "ClientAdmin"],
  },
  {
    icon: <FaFileAlt className="w-6 h-6" />,
    name: "Reports",
    to: "/reports",
    role: ["Admin", "ClientAdmin"],
  },
];

const Sidebar = () => {
  const [show, setShow] = useState(false);
  const [active, setActive] = useState("");
  const dispatch = useDispatch();
  const match = useMatch("/:firstRoute/:secondRoute/*");
  const { secondRoute } = match.params;

  const { user } = useSelector((store) => store.helper);
  const navigate = useNavigate();

  const [logout, { isLoading }] = useLogoutMutation();
  const { data: client = {} } = useGetSingleClientQuery(user?.client, { skip: !user?.client });

  const handleLogout = async () => {
    try {
      const res = await logout().unwrap();
      dispatch(removeCredentials());
      toast.success(res?.msg);
      navigate("/");
    } catch (error) {
      console.log(error);
      toast.error(error?.data?.msg || error.error);
    }
  };

  useEffect(() => {
    setActive(`/${secondRoute}`);
  }, [secondRoute]);

  const handleNavigate = (to) => {
    setShow(!show);
    navigate(`/dashboard${to}`);
  };

  return (
    <aside className="antialiased">
      <nav className="fixed top-0 left-0 right-0 max-h-20 lg:left-40 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 py-3 md:px-6 px-3 transition-all duration-300">
        <div className="flex items-start justify-between w-full mx-auto">

          {/* Left Section: Mobile Menu & Client Context */}
          <div className="flex gap-4">
            {/* Side menu button */}
            <button
              onClick={() => setShow(!show)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              aria-label="Toggle menu"
            >
              <AiOutlineMenuUnfold className="w-9 h-9" />
            </button>

            {/* Client Name (Context-aware display) */}
            <div className="flex flex-col lg:pl-16 w-full overflow-hidden">
              {client?.name ? (
                <>
                  <strong className="text-xl md:text-2xl text-slate-800 leading-tight">
                    {client?.name}
                  </strong>
                  <p className="text-xs text-gray-400">
                    {client.address}
                  </p>
                  <div className="w-full pt-1 hidden lg:block">
                    <TickerTape />
                  </div>
                </>
              ) : (

                <div className="w-full overflow-hidden flex flex-col gap-1.5">

                  {/* Brand Header Stack */}
                  <div className="flex flex-col">
                    <strong className="h4 font-black text-slate-800 leading-tight line-clamp-1">
                      Express Pesticides Private Limited
                    </strong>
                    <span className="text-xs font-normal text-slate-500 tracking-wide">
                      Pest Management Division
                    </span>
                  </div>

                  <div className="absolute top-14 max-w-[80dvw] pt-1 hidden lg:block">
                    <TickerTape />
                  </div>

                </div>
              )}
            </div>

          </div>

          {/* Right Section: Brand Logo */}
          <div className="flex items-center gap-1 md:gap-3 bg-slate-50 pl-4 pr-3 py-1.5 rounded-xl border border-slate-100">
            <div className="hidden md:flex flex-col items-start justify-center order-2">
              <span className=" text-lg md:text-2xl font-extrabold tracking-tight text-slate-900 leading-none">
                PestXZ
              </span>
              <span className="text-[0.5rem] md:text-[0.6rem] font-medium uppercase tracking-wider text-slate-400 mt-1 leading-none">
                Powered by
              </span>
            </div>
            <img src={logo} className="h-7 md:h-10 w-auto object-contain order-1" alt="PestXZ Logo" />
          </div>

        </div>
        <div className="block lg:hidden absolute  left-0 right-0 top-[4rem] px-3 z-40">
          <TickerTape />
        </div>
      </nav>

      <aside
        className={`fixed top-[4rem] md:top-[4rem] lg:top-0 left-0 w-60 z-50 h-[calc(100dvh-4rem)] md:h-[calc(100dvh-4rem)] lg:h-dvh transition-transform pb-2 duration-300 border-r-2 bg-slate-800 border-gray-500 ${show
          ? "translate-x-0"
          : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Added h-full and removed absolute bottom from inside the list */}
        <div className="h-full flex flex-col pl-4 overflow-y-auto">

          {/* Navigation Links Group */}
          <div className="flex-1">
            <ul className="space-y-2 mt-5 lg:mt-20">
              {navList.map((item) => {
                return (
                  item.role.includes(user?.role) && (
                    <li
                      key={item.name}
                      className={`hover:bg-slate-950/50 rounded-l-lg pl-2 transition-colors ${active === item.to ? "bg-gray-950/50" : ""
                        }`}
                    >
                      <button
                        onClick={() => handleNavigate(item.to)}
                        className="flex items-center w-full p-2 text-base font-medium text-white"
                      >
                        {item.icon}
                        <span className="ml-3 text-xl">{item.name}</span>
                      </button>
                    </li>
                  )
                );
              })}
            </ul>
          </div>

          {/* Footer Group (Logout + Branding) stays pinned at the bottom */}
          <div className="space-y-3 pt-4 border-t border-slate-700/50">
            {/* Moved logout outside the main list */}
            <button
              onClick={handleLogout}
              className="w-full flex justify-center items-center py-2 font-medium text-xl tracking-wider text-sky-400 hover:text-red-500 transition-colors"
            >
              <FaPowerOff className="mr-2" />
              Logout
            </button>

            {/* Brand Logo Card */}
            <div className="w-full max-w-[180px] mx-auto flex items-center justify-center gap-3 px-4 py-2 rounded-xl border bg-slate-50 border-slate-100 shadow-sm">
              <div className="flex flex-col items-start justify-center order-2">
                <span className="text-sm font-extrabold tracking-tight text-slate-900 leading-none">
                  PestXZ
                </span>
                <span className="text-[0.5rem] md:text-[0.6rem] font-medium uppercase tracking-wider text-slate-400 mt-1 leading-none">
                  Powered by
                </span>
              </div>
              <img src={logo} className="h-5 w-auto object-contain order-1" alt="PestXZ Logo" />
            </div>
          </div>

        </div>
      </aside>
    </aside>
  );
};
export default Sidebar;
