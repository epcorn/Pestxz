import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../assets/logo1.png";
import { Button } from "../components";
import { setCredentials } from "../redux/helperSlice";
import { useLoginMutation } from "../redux/userSlice";

const roleRoutes = {
  Admin: "/dashboard/stats",
  PestAdmin: "/dashboard/stats",
  ClientAdmin: "/dashboard/stats",

  TeamLeader: "/dashboard/services",
  BranchAdmin: "/dashboard/services",
  Supervisor: "/dashboard/services",
  Operator: "/dashboard/scan",
  ClientEmployee: "/dashboard/scan"
};

const Landing = () => {
  const { user, locationId } = useSelector((store) => store.helper);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [login, { isLoading }] = useLoginMutation();
  // 🔥 single navigation handler
  const handleNavigation = (userData) => {
    if (locationId) {
      navigate(`/location/${locationId}`);
      return;
    }

    const route =
      roleRoutes[userData?.role] || "/dashboard/scan";

    navigate(route);
  };

  // 🔥 redirect if already logged in
  useEffect(() => {
    if (!user) return;
    handleNavigation(user);
  }, [user]);

  const submitLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await login(form).unwrap();
      dispatch(setCredentials(res));
      toast.success(`Welcome ${res.name}`);
      setForm({ email: "", password: "" });
      
      handleNavigation(res);
    } catch (error) {
      toast.error(error?.data?.msg || error?.error || "Login failed");
    }
  };

  return (
    <section className="bg-gray-400 bg-opacity-10 bg-[url('https://res.cloudinary.com/djc8opvcg/image/upload/v1701669902/samples/Caravela_Beach_Resort_eukgag.jpg')] bg-cover bg-center bg-no-repeat bg-blend-multiply">
      <div className="mx-auto flex flex-col items-center justify-center px-6 py-8 h-screen">

        <div className="max-w-sm rounded-lg shadow bg-black/10 sm:max-w-md xl:p-0 backdrop-blur-xs outline-2 outline-white/50">
          <div className="space-y-4 p-6 sm:p-8">
            {/* Logo */}
            <div className="flex justify-center">
              <img className="w-40" src={logo} alt="logo" />
            </div>
            <h1 className="text-center text-xl font-bold text-white md:text-2xl">
              Sign in to your account
            </h1>
            <form className="space-y-4" onSubmit={submitLogin}>
              {/* Email */}
              <div>
                <label className="mb-1 block text-white font-medium">
                  Email
                </label>
                <input
                  className="w-full py-1 px-2 border rounded-md outline-none text-white placeholder:text-white/30 focus:border-white"
                  placeholder="jon@doe.com"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
              {/* Password */}
              <div>
                <label className="mb-1 block text-white font-medium">
                  Password
                </label>
                <input
                  className="w-full py-1 px-2 border rounded-md outline-none text-white placeholder:text-white/30 focus:border-white"
                  placeholder="••••••••"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
              </div>

              <Button
                type="submit"
                label="Log in"
                isLoading={isLoading}
                disabled={isLoading}
                width="w-full"
              />

            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Landing;