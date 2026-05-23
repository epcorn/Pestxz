import { AlertMessage, Button, Loading } from "../components";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser, toggleModal } from "../redux/helperSlice";
import { DeleteModal, UserModal } from "../components/modals";
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
    if (user.client) {
      setUserDetails({
        ...user,
        client: { label: user?.client.name, value: user?.client._id },
      });
    } else {
      setUserDetails({ ...user, role: "Admin" });
    }
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
    <div className="p-6 font-sans text-gray-800">
      {isLoading || isFetching ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}

      {!error && data && (
        <div className="space-y-4">
          {/* Top Header Section */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Users Management</h1>
            {user.role === "Admin" && (
              <div className="relative">
                <Button label="+ Add Employee" onClick={() => handleNewUserModal()} />
                {isModalOpen.user && <UserModal userDetails={userDetails} />}
              </div>
            )}
          </div>

          {/* Responsive Table Wrapper */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 bg-white text-left text-sm">
              {/* Table Headers */}
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">{loginUser.role === "ClientAdmin" ? "Department" : "Client"}</th>
                  <th className="px-6 py-3.5">Rights</th>
                  <th className="px-6 py-3.5">Actions</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-100">
                {data?.map((user) => (
                  <tr key={user._id} className="even:bg-gray-50/50 hover:bg-gray-100/70 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">{user?.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-600">{user.role}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">{user.type || "—"}</td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-gray-400">
                      <RightsIcon initialRights={user.rights}/>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 shadow-sm transition-all hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          onClick={() => handleUpdateUserModal(user)}
                        >
                          Change Password
                        </button>
                        {user.role !== "Admin" && (
                          <DeleteModal
                            label=""
                            title="Delete"
                            handleDelete={handleDelete}
                            isLoading={deleteLoading}
                            id={{ id: user._id, name: user.name }}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
