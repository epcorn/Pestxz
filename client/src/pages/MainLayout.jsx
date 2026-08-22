import { Outlet } from "react-router-dom";
import { Sidebar } from "../components";

const MainLayout = () => {
  return (
    <main>
      <main className="p-2 md:px-5 pt-24 lg:ml-60 bg-white">
        <Sidebar />
        <Outlet />
      </main>
    </main>
  );
};

export default MainLayout;
