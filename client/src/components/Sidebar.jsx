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

const navList = [
  {
    icon: <BsBarChartFill className="w-6 h-6 " />,
    name: "Dashboard",
    to: "/stats",
    role: ["Admin", "ClientAdmin"],
  },
  {
    icon: <FaBuilding className="w-6 h-6" />,
    name: "Clients",
    to: "/clients",
    role: ["Admin"],
  },
  {
    icon: <BsDatabaseFillAdd className="w-6 h-6" />,
    name: "Services",
    to: "/services",
    role: ["Admin"],
  },
  {
    icon: <FaBug className="w-6 h-6" />,
    name: "Complaints",
    to: "/complaints",
    role: ["Admin", "ClientAdmin", "ClientEmployee", "PestEmployee"],
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
    role: ["Admin"],
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

  const handleLogout = async () => {
    try {
      const res = await logout().unwrap();
      dispatch(removeCredentials());
      toast.success(res.msg);
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
      <nav className="bg-slate-200 border-b-2 z-50 border-gray-500 py-2 lg:py-2.5 fixed top-0 left-0 lg:left-40 right-0">
        <div className="flex justify-between lg:justify-center items-center mx-5">
          <div className="lg:hidden">
            <button onClick={() => setShow(!show)}>
              {!show && <AiOutlineMenuUnfold className="w-9 h-9" />}
            </button>
          </div>
          <div className="flex items-center">
            <img src={logo} className="mr-2 h-10" alt="Logo" />
            <span className="text-center text-2xl font-semibold whitespace-nowrap">
              PestXZ
            </span>
          </div>
        </div>
      </nav>
      <aside
        className={`fixed top-0 left-0 w-60 z-50 h-screen transition-transform -translate-x-full border-r-2 bg-slate-700 border-gray-500 ${
          show ? "translate-x-0" : "lg:translate-x-0"
        }`}
      >
        {show && (
          <div className="flex justify-end">
            <AiOutlineMenuFold
              onClick={() => setShow(!show)}
              className="lg:hidden w-9 h-9 mt-3 mr-5 text-red-500"
            />
          </div>
        )}
        <div className="overflow-y-auto h-full">
          <ul className="space-y-4 mt-5 lg:mt-20">
            {navList.map((item) => {
              return (
                item.role.includes(user?.role) && (
                  <li
                    key={item.name}
                    className={`hover:bg-gray-800 px-3 ${
                      active === item.to && "bg-gray-800"
                    }`}
                  >
                    <button
                      onClick={() => handleNavigate(item.to)}
                      className="flex items-center p-2 text-base font-medium text-white rounded-lg "
                    >
                      {item.icon}
                      <span className="ml-3 text-xl">{item.name}</span>
                    </button>
                  </li>
                )
              );
            })}
            <li className="bottom-0 left-0 flex justify-center py-5 w-full">
              <button onClick={handleLogout}>
                <div className="flex justify-center items-center font-medium text-xl tracking-wider text-sky-400 hover:text-red-500">
                  <FaPowerOff className="mr-2" />
                  Logout
                </div>
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </aside>
  );
};
export default Sidebar;
