import { AlertMessage, Button, Loading } from "../components";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser, toggleModal } from "../redux/helperSlice";
import { DeleteModal, UserModal } from "../components/modals";
import { useAllUserQuery, useDeleteUserMutation } from "../redux/adminSlice";
import { useState } from "react";
import { toast } from "react-toastify";
import RightsIcon from "../components/modals/RightsIcon";
import { useGetClientUsersQuery } from "../redux/userSlice";
import { useEffect } from "react";
import Headers from "../components/Headers";

const Users = () => {
  const [reveal, setReveal] = useState({ id: "", status: false })
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [userDetails, setUserDetails] = useState(null);
  const [selectedClient, setSelectedClient] = useState("");
  const { isModalOpen, user: loginUser } = useSelector((store) => store.helper);

  const { data, isLoading, isFetching, error } = useAllUserQuery();
  const [deleteUser, { isLoading: deleteLoading }] = useDeleteUserMutation();
  const { data: clientUsers } = useGetClientUsersQuery(user?.client, {
    skip: user.role !== "ClientAdmin",
  });

  const handleUpdateUserModal = (user) => {
    if (user.client) {
      setUserDetails({ ...user, client: { label: user?.client?.name, value: user?.client?._id } });
    } else {
      setUserDetails({ ...user });
    }
    dispatch(toggleModal({ name: "user", status: true }));
  };
  console.log(data);

  const handleNewUserModal = () => {
    setUserDetails(null);
    dispatch(toggleModal({ name: "user", status: true }));
  };

  const handleDelete = async () => {
    try {
      await deleteUser(isModalOpen.delete.id).unwrap();
      toast.success(`${isModalOpen.delete.name} deleted successfully`);
      dispatch(toggleModal({ name: "delete", status: { id: null, name: null } }));
    } catch (error) {
      console.log(error);
      toast.error("Error deleting user");
    }
  };

  const filteredUsers = selectedClient
    ? data?.filter((u) =>
      selectedClient === "express" ? u?.type === "PestEmployee" : u?.client?.name === selectedClient
    )
    : data;

  return (
    <div className="p-2 bg-gray-50 min-h-screen">
      {(isLoading || isFetching) ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}

      {!error && data && (
        <div className="space-y-6">
          {/* HEADER */}
          <Headers header={"User Management"} user={user} />

          {loginUser?.role === "Admin" && (
            <div>
              <Button label="+ Add User" onClick={handleNewUserModal} />
              {isModalOpen.user && <UserModal userDetails={userDetails} />}
            </div>
          )}

          {/* TABLE CARD */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-300 border-b border-gray-200 text-sm uppercase tracking-wide text-gray-700 ">
                    <th className="px-5 py-3.5 text-left font-semibold">Name</th>
                    {/* <th className="px-5 py-3.5 text-left font-semibold">Email</th> */}
                    <th className="px-5 py-3.5 text-left font-semibold whitespace-nowrap">Phone Number</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Role</th>

                    {user.role === "Admin" && (
                      <th className="px-5 py-3.5 text-left font-semibold">
                        <select
                          value={selectedClient}
                          onChange={(e) => setSelectedClient(e.target.value)}
                          className="text-xs font-medium bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="">
                            {loginUser?.role === "Admin" ? "All Clients" : "Client"}
                          </option>
                          <option value="express">Express Employee</option>
                          {Array.from(
                            new Set(data?.map((d) => d?.client?.name).filter(Boolean))
                          ).map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </th>
                    )}

                    <th className="px-5 py-3.5 text-left font-semibold">Rights</th>

                    {loginUser?.role === "Admin" && (
                      <th className="px-5 py-3.5 text-center font-semibold">Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-300 ">
                  {filteredUsers?.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors *:not-last:border-r *:not-last:border-gray-300">
                      {/* Name */}
                      <td className="px-5 py-3.5 flex flex-col">
                        <span className="font-medium whitespace-nowrap text-gray-800">{item?.name}
                        </span>
                        <span>{item.email}</span>
                      </td>

                      {/* Email */}
                      {/* <td className="px-5 py-3.5 text-gray-500">{item?.email}</td> */}

                      <td className="px-5 py-3.5 text-gray-500" onClick={() => setReveal({ name: item._id, status: true })} >{reveal.name === item._id ? item?.phone ? item?.phone : "No Number" : "**********"}</td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        {user.role === "Admin" ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-gray-700">{item?.role}</span>
                            {/* <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 whitespace-nowrap">
                              {item?.client?.name || item?.type || "—"}
                            </span> */}
                          </div>
                        ) : (
                          <span className="font-medium text-gray-700">
                            {item?.role === "ClientAdmin" ? "Admin" : "Employee"}
                          </span>
                        )}
                      </td>

                      {/* Client column (Admin only) */}
                      {user.role === "Admin" && (
                        <td className="px-5 py-3.5 text-gray-500">
                          {item?.type === "ClientEmployee"
                            ? item?.client?.name
                            : "Pest Employee"}
                        </td>
                      )}

                      {/* Rights */}
                      <td className="px-2 py-3.5">
                        <RightsIcon initialRights={item?.rights} />
                      </td>

                      {/* Actions (Admin only) */}
                      {loginUser?.role === "Admin" && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateUserModal(item)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                              Edit
                            </button>
                            {item?.role !== "Admin" && (
                              <DeleteModal
                                label=""
                                title="Delete"
                                handleDelete={handleDelete}
                                isLoading={deleteLoading}
                                id={{ id: item._id, name: item.name }}
                              />
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Empty state */}
              {filteredUsers?.length === 0 && (
                <div className="text-center py-16 text-gray-400 text-sm">
                  No users found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;