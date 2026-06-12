import { toast, ToastContainer } from "react-toastify";
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
  SingleUnschedule
} from "./pages";
import { ProtectedRoute } from "./components";
import NewDashboard from "./pages/NewDashboard";
import Welcome from "./pages/OperatorDashboard";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { socket } from "./socket";
import NotificationManager from "./components/NotificationManager";
import QrScanner from "./components/dashboard/QrScanner";




const Layout = () => {
  return (
    <>
      <NotificationManager />
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
          <Route path="dashboard/stats" element={<NewDashboard />} />
          <Route path="dashboard/scan" element={<QrScanner />} />
          {/* <Route
              index={true}
              path="dashboard/stats"
              element={<Dashboard />}
            /> */}
          <Route path="dashboard/complaints" element={<Complaints />} />
          <Route path="/location/:id" element={<SingleLocation />} />
          <Route path="/complaint/:id" element={<SingleComplaint />} />
          <Route path="/unschedule/:id" element={<SingleUnschedule />} />
        </Route>
        <Route path="" element={<ProtectedRoute roles={["Admin", "Supervisor", "TeamLeader", "BranchAdmin"]} />}>
          <Route path="dashboard/clients" element={<Clients />} />
          <Route path="dashboard/services" element={<Services />} />
          <Route path="dashboard/client/:id" element={<SingleClient />} />
        </Route>

        <Route path="" element={<ProtectedRoute roles={["Admin", "ClientAdmin"]} />}
        >
          <Route path="dashboard/users" element={<Users />} />
          <Route path="dashboard/reports" element={<Reports />} />
          <Route path="dashboard/locations" element={<Locations />} />
        </Route>
      </Route>
    </Route>
  )
);
function App() {

  return <RouterProvider router={Router} />;
}

export default App;
