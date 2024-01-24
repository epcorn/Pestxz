import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { useParams } from "react-router-dom";
import { setLocation } from "../redux/helperSlice";

const ProtectedRoute = ({ roles }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.helper);

  useEffect(() => {
    dispatch(setLocation({ id }));
  }, [id]);

  if (user) {
    if (roles && !roles.includes(user.role))
      return <Navigate to="/dashboard/stats" />;
    return <Outlet />;
  } else return <Navigate to="/" />;
};
export default ProtectedRoute;
