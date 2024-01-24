import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";

import {
  Clients,
  Complaints,
  Dashboard,
  Landing,
  Locations,
  MainLayout,
  Reports,
  Services,
  SingleClient,
  SingleComplaint,
  SingleLocation,
  Users,
} from "./pages";
import { ProtectedRoute } from "./components";

function App() {
  const Layout = () => {
    return (
      <>
        <ToastContainer position="top-center" autoClose={2000} />
        <div>
          <Outlet />
        </div>
      </>
    );
  };

  const Router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Layout />}>
        <Route index={true} path="/" element={<Landing />} />
        <Route path="" element={<MainLayout />}>
          <Route path="" element={<ProtectedRoute />}>
            <Route
              index={true}
              path="dashboard/stats"
              element={<Dashboard />}
            />
            <Route path="dashboard/complaints" element={<Complaints />} />
            <Route path="/location/:id" element={<SingleLocation />} />
            <Route path="/complaint/:id" element={<SingleComplaint />} />
          </Route>

          <Route path="" element={<ProtectedRoute roles={["Admin"]} />}>
            <Route path="dashboard/clients" element={<Clients />} />
            <Route path="dashboard/services" element={<Services />} />
            <Route path="dashboard/client/:id" element={<SingleClient />} />
          </Route>

          <Route
            path=""
            element={<ProtectedRoute roles={["Admin", "ClientAdmin"]} />}
          >
            <Route path="dashboard/users" element={<Users />} />
            <Route path="dashboard/reports" element={<Reports />} />
            <Route path="dashboard/locations" element={<Locations />} />
          </Route>
        </Route>
      </Route>
    )
  );

  return <RouterProvider router={Router} />;
}

export default App;
