import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import { Loading, ProtectedRoute } from "./components";
import { Suspense } from "react";
import NotificationManager from "./components/NotificationManager";
import React from "react";
import Dashboard from './pages/Dashboard';
import Auditor from "./pages/Auditor";

// 1. Lazy load ALL page components individually
const Landing = React.lazy(() => import("./pages/Landing"));
const MainLayout = React.lazy(() => import("./pages/MainLayout"));
const QrScanner = React.lazy(() => import("./components/dashboard/QrScanner"));
const Complaints = React.lazy(() => import("./pages/Complaints"));
const SingleLocation = React.lazy(() => import("./pages/SingleLocation"));
const SingleComplaint = React.lazy(() => import("./pages/SingleComplaint"));
const SingleUnschedule = React.lazy(() => import("./pages/SingleUnschedule"));
const Clients = React.lazy(() => import("./pages/Clients"));
const Services = React.lazy(() => import("./pages/Services"));
const SingleClient = React.lazy(() => import("./pages/SingleClient"));
const Users = React.lazy(() => import("./pages/Users"));
const Reports = React.lazy(() => import("./pages/Reports"));
const Locations = React.lazy(() => import("./pages/Locations"));

const Layout = () => {
  return (
    <>
      <NotificationManager />
      <ToastContainer position="top-center" autoClose={2000} />
      <div>
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </div>
    </>
  );
};

const Router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index={true} path="/" element={<Landing />} />
      <Route element={<MainLayout />}>
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard/scan" element={<QrScanner />} />
          <Route index={true} path="dashboard/stats" element={<Dashboard />} />
          <Route path="dashboard/complaints" element={<Complaints />} />
          <Route path="/location/:id" element={<SingleLocation />} />
          <Route path="/complaint/:id" element={<SingleComplaint />} />
          <Route path="/unschedule/:id" element={<SingleUnschedule />} />
        </Route>
        <Route element={<ProtectedRoute roles={["Admin", "Supervisor", "TeamLeader", "BranchAdmin"]} />}>
          <Route path="dashboard/clients" element={<Clients />} />
          <Route path="dashboard/services" element={<Services />} />
          <Route path="dashboard/client/:id" element={<SingleClient />} />
        </Route>

        <Route element={<ProtectedRoute roles={["Admin", "ClientAdmin"]} />} >
          <Route path="dashboard/users" element={<Users />} />
          <Route path="dashboard/reports" element={<Reports />} />
          <Route path="dashboard/locations" element={<Locations />} />
        </Route>
        <Route element={<ProtectedRoute roles={["Admin", 'Auditor', "BranchAdmin"]} />}>
          <Route path="/audit" element={<Auditor />} />
        </Route>
        <Route path="*" element={<Navigate to={'/'} replace />} />
      </Route>
    </Route>
  )
);

function App() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error);
        });
    });
  }

  return <RouterProvider router={Router} />;
}

export default App;
