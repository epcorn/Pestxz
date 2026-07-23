import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import { Loading, ProtectedRoute } from "./components";
import { useSelector } from "react-redux";
import { useEffect, Suspense } from "react";
import { socket } from "./socket";
import NotificationManager from "./components/NotificationManager";
import React from "react";

// 1. Lazy load ALL page components individually
const Landing = React.lazy(() => import("./pages/Landing"));
const MainLayout = React.lazy(() => import("./pages/MainLayout"));
const QrScanner = React.lazy(() => import("./components/dashboard/QrScanner"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
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
        {/* 2. Wrap Outlet in Suspense to prevent loading crashes */}
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
      <Route path="" element={<MainLayout />}>
        <Route path="" element={<ProtectedRoute />}>
          <Route path="dashboard/scan" element={<QrScanner />} />
          <Route index={true} path="dashboard/stats" element={<Dashboard />} />
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

        <Route path="" element={<ProtectedRoute roles={["Admin", "ClientAdmin"]} />} > 
          <Route path="dashboard/users" element={<Users />} />
          <Route path="dashboard/reports" element={<Reports />} />
          <Route path="dashboard/locations" element={<Locations />} />
        </Route>
      </Route>
    </Route>
  )
);

function App() {
  // Service Worker registration logic remains identical
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
