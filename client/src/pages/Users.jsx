import { AlertMessage, Button, Loading } from "../components";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser, toggleModal } from "../redux/helperSlice";
import { DeleteModal, UserModal } from "../components/modals";
import {
  useAllUserQuery,
  useDeleteUserMutation,
} from "../redux/adminSlice";
import { useState } from "react";
import { toast } from "react-toastify";
import RightsIcon from "../components/modals/RightsIcon";
import { useGetClientUsersQuery } from "../redux/userSlice";
import { useEffect } from "react";

const Users = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [userDetails, setUserDetails] = useState(null);
  const [selectedClient, setSelectedClient] = useState("");
  const { isModalOpen, user: loginUser } = useSelector(
    (store) => store.helper
  );

  const { data, isLoading, isFetching, error } =
    useAllUserQuery();
  const [deleteUser, { isLoading: deleteLoading }] =
    useDeleteUserMutation();
  const { data: clientUsers } = useGetClientUsersQuery(user?.client, { skip: user.role !== "ClientAdmin" })
  const handleUpdateUserModal = (user) => {
    if (user.client) {
      setUserDetails({
        ...user,
        client: { label: user?.client?.name, value: user?.client?._id, },
      });
    } else {
      setUserDetails({ ...user, });
    }

    dispatch(toggleModal({ name: "user", status: true, })
    );
  };
  console.log(data)

  const handleNewUserModal = () => {
    setUserDetails(null);
    dispatch(toggleModal({ name: "user", status: true, }));
  };

  const handleDelete = async () => {
    try {
      await deleteUser(isModalOpen.delete.id).unwrap();

      toast.success(
        `${isModalOpen.delete.name} deleted successfully`
      );

      dispatch(toggleModal({ name: "delete", status: { id: null, name: null, }, }));
    } catch (error) {
      console.log(error);
      toast.error("Error deleting user");
    }
  };
  // useEffect(() => {
  //   setClient(data)
  // }, [])
  console.log(selectedClient)

  const filteredUsers = selectedClient
    ? data?.filter((u) => selectedClient === "express" ? u?.type === "PestEmployee" : u?.client?.name === selectedClient)
    : data;


  return (
    <div className="p-4 md:p-6">
      {(isLoading || isFetching) ? (
        <Loading />
      ) : (
        error && (<AlertMessage> {error?.data?.msg || error.error}
        </AlertMessage>)
      )}

      {!error && data && (
        <div className="space-y-4">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Users Management
            </h1>

            {loginUser?.role === "Admin" && (
              <div>
                <Button
                  label="+ Add Employee"
                  onClick={handleNewUserModal}
                />

                {isModalOpen.user && (
                  <UserModal userDetails={userDetails} />
                )}
              </div>
            )}
          </div>

          {/* TABLE */}
          <div className=" overflow-x-auto border border-gray-200 rounded-lg bg-white">
            <table className="min-w-4xl w-full text-sm table-fixed">
              <thead className="bg-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Name
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Email
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Role
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-gray-600">

                    {user.role === "Admin" && <select
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                    >
                      <option value="">
                        {loginUser?.role === "Admin" ? "All clients" : "Client"}
                      </option>
                      <option value="express">Express Employee</option>
                      {Array.from(
                        new Set(data?.map((d) => d?.client?.name).filter(Boolean))
                      ).map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>}
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Rights
                  </th>

                  {loginUser?.role === "Admin" && (
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
            </table>

            <div className="overflow-auto min-w-4xl max-h-[500px]">

              <table className="table-fixed text-sm w-full">
                <tbody>
                  {filteredUsers?.map((item) => (
                    <tr
                      key={item._id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        {item?.name}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {item?.email}
                      </td>

                      <td className="px-4 py-3">
                        {user.role === "Admin" && <p className="grid ">
                          <>
                            {item?.role}
                          </>
                          <span className=" text-xs outline px-2 py-px text-gray-400 rounded-lg whitespace-nowrap w-fit">
                            {item?.client?.name || item?.type || "-"}
                          </span>
                        </p>}
                        {user.role === "ClientAdmin" && <p className="grid ">
                          {item?.role === "ClientAdmin" ? "Admin" : "Employee"}
                        </p>}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {item.client ? item?.client?.name : "Express Employee"}
                      </td>

                      <td className="px-4 py-3">
                        <RightsIcon
                          initialRights={item?.rights}
                        />
                      </td>

                      {/* ONLY ADMIN CAN SEE */}
                      {loginUser?.role === "Admin" && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateUserModal(item)
                              }
                              className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              Edit
                            </button>

                            {item?.role !== "Admin" && (
                              <DeleteModal
                                label=""
                                title="Delete"
                                handleDelete={handleDelete}
                                isLoading={deleteLoading}
                                id={{
                                  id: item._id,
                                  name: item.name,
                                }}
                              />
                            )}
                          </div>
                        </td>
                      )}
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