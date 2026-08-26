import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useRouteError,
} from "react-router-dom";
import { Loading, ProtectedRoute } from "./components";
import { Suspense } from "react";
import NotificationManager from "./components/NotificationManager";
import React from "react";
// import Dashboard from './pages/Dashboard';
import Auditor from "./pages/Auditor";
import ErrorBoundary from "./components/ErrorBoundary";

// 1. Lazy load ALL page components individually
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
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

const RouteErrorFallback = () => {
  const error = useRouteError();
  console.error("Route Error", error)
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white border border-slate-300 rounded-lg shadow-lg p-6 text-center space-y-4">
        <h2 className="text-xl font-bold text-red-600">Navigation Error</h2>
        <p className="text-sm text-slate-600">
          {error?.statusText || error?.message || "Failed to load page."}
        </p>
        <button
          onClick={() => window.location.assign("/")}
          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-sm transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  )
}

const Layout = () => {
  return (
    <>
      <NotificationManager />
      <ToastContainer position="top-center" autoClose={2000} />
      <ErrorBoundary>
        <NotificationManager />
        <ToastContainer position="top-center" autoClose={2000} />
        <div>
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </div>
      </ErrorBoundary>
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
          <Route path="/auditor/form" element={<Auditor />} />
          <Route path="/auditor/client/:id" element={<Auditor />} />
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

  return (
    <ErrorBoundary>
      <RouterProvider router={Router} />
    </ErrorBoundary>
  );
}

export default App;
