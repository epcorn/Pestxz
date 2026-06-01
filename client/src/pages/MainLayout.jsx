import { Outlet } from "react-router-dom";
import { Sidebar } from "../components";

const MainLayout = () => {
  return (
    <main>
      <main className="p-2 md:p-5 pt-20 md:pt-20 lg:pt-20 lg:ml-60 h-auto">
        <Sidebar />
        <Outlet />
      </main>
    </main>
  );
};

export default MainLayout;
