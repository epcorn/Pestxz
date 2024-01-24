import { Outlet } from "react-router-dom";
import { Sidebar } from "../components";

const MainLayout = () => {
  return (
    <main>
      <main className="p-4 pt-20 lg:ml-60 h-auto">
        <Sidebar />
        <Outlet />
      </main>
    </main>
  );
};

export default MainLayout;
