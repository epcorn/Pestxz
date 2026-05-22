import { AlertMessage, Button, Loading } from "../components";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser, toggleModal } from "../redux/helperSlice";
import { DeleteModal, UserModal } from "../components/modals";
import { RiLockPasswordFill } from "react-icons/ri";
import { useAllUserQuery, useDeleteUserMutation } from "../redux/adminSlice";
import { useState } from "react";
import { toast } from "react-toastify";
import RightsIcon from "../components/modals/RightsIcon";

const Users = () => {
  const dispatch = useDispatch();
  const [toggle, setToggle] = useState('PestEmployee');
  const [userDetails, setUserDetails] = useState(null);
  const { isModalOpen, user: loginUser } = useSelector((store) => store.helper);

  const { data, isLoading, isFetching, error } = useAllUserQuery();
  const [deleteUser, { isLoading: deleteLoading }] = useDeleteUserMutation();
  const user = useSelector(selectCurrentUser);

  const handleSelect = (e) => {
    const { value } = e.target;
    setToggle(value);
  };

  const handleUpdateUserModal = (user) => {
    if (user.client)
      setUserDetails({
        ...user,
        client: { label: user?.client.name, value: user?.client._id },
      });
    else
      setUserDetails({
        ...user, role: "Admin"
      });
    dispatch(toggleModal({ name: "user", status: true }));
  };

  const handleNewUserModal = () => {
    setUserDetails(null);
    dispatch(toggleModal({ name: "user", status: true }));
  };

  const handleDelete = async () => {
    try {
      await deleteUser(isModalOpen.delete.id).unwrap();
      toast.success(`${isModalOpen.delete.name} deleted successfully`);
      dispatch(
        toggleModal({ name: "delete", status: { id: null, name: null } })
      );
    } catch (error) {
      console.log(error);
      toast.error("Error");
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {isLoading || isFetching ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}

      {!error && data && (
        <div className="space-y-4">
          {/* COMPACT HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-lg shadow-sm border border-slate-100 gap-3">
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                Users, Management
              </h1>
            </div>

            {user.role === "Admin" && (
              <div className="w-full sm:w-auto">
                <Button
                  label="+ Add Employee"
                  height="h-8"
                  className="w-full sm:w-auto px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shadow-sm"
                  onClick={() => handleNewUserModal()}
                />
                {isModalOpen.user && <UserModal userDetails={userDetails} />}
              </div>
            )}
          </div>

          {/* COMPACT TABLE */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">
                      {loginUser.role === "ClientAdmin" ? "Department" : "Client"}
                    </th>
                    <th className="py-2.5 px-4 text-center">Rights</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {data?.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-2 px-4 font-medium text-slate-900">
                        {user?.name}
                      </td>
                      <td className="py-2 px-4 text-slate-400">
                        {user.email}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${user.role === 'Admin'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-slate-500">
                        {user.type || "—"}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex justify-center scale-90 origin-center">
                          <RightsIcon userId={user._id} initialRights={user?.rights} />
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            title="Change Password"
                            onClick={() => handleUpdateUserModal(user)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors border border-transparent"
                          >
                            <RiLockPasswordFill size={15} />
                          </button>

                          {user.role !== "Admin" && (
                            <div className="text-red-500 hover:text-red-700 transition-colors scale-90">
                              <DeleteModal
                                label=""
                                title="Delete"
                                handleDelete={handleDelete}
                                isLoading={deleteLoading}
                                id={{ id: user._id, name: user.name }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
