import { Outlet } from "react-router-dom";
import { Sidebar } from "../components";

const MainLayout = () => {
  return (
    <main>
      <main className="p-2 md:p-5 pt-16 md:pt-16 lg:pt-20 lg:ml-60 h-auto">
        <Sidebar />
        <Outlet />
      </main>
    </main>
  );
};

export default MainLayout;
