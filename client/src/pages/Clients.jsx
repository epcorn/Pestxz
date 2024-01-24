import { Link } from "react-router-dom";
import { AlertMessage, Button, Loading } from "../components";
import { DeleteModal, NewClientModal } from "../components/modals";
import {
  useAllClientsQuery,
  useDeleteClientMutation,
} from "../redux/clientSlice";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { toggleModal } from "../redux/helperSlice";

const Clients = () => {
  const dispatch = useDispatch();
  const { isModalOpen } = useSelector((store) => store.helper);

  const { data, isLoading, isFetching, error } = useAllClientsQuery();
  const [deleteClient, { isLoading: deleteLoading }] =
    useDeleteClientMutation();

  const handleDelete = async () => {
    try {
      await deleteClient(isModalOpen.delete.id).unwrap();
      toast.success(`${isModalOpen.delete.name} deleted successfully`);
      dispatch(
        toggleModal({ name: "delete", status: { id: null, name: null } })
      );
    } catch (error) {
      console.log(error);
      toast.error(error?.data?.msg || error.error);
    }
  };
  return (
    <>
      {isLoading || isFetching ? (
        <Loading />
      ) : (
        error && <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
      )}
      <div>
        <NewClientModal />
        <div className="overflow-y-auto my-4">
          <table className="w-full border whitespace-nowrap border-neutral-500 bg-text">
            <thead>
              <tr className="h-10 w-full text-md md:text-lg leading-none">
                <th className="font-bold text-center border-neutral-500 border-2 px-3">
                  Client Name
                </th>
                <th className="font-bold text-center border-neutral-500 border-2 px-3">
                  Address
                </th>
                <th className="font-bold text-center border-neutral-500 border-2 w-32 px-3">
                  Contract No
                </th>
                <th className="font-bold max-w-[100px] text-center border-neutral-500 border-2 w-40 px-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="w-full">
              {data?.map((client) => (
                <tr
                  key={client._id}
                  className="h-10 text-sm leading-none bg-text border-b border-neutral-500 hover:bg-slate-200"
                >
                  <td className="px-3 border-r font-normal border-neutral-500">
                    {client.name}
                  </td>
                  <td className="px-3 border-r font-normal border-neutral-500">
                    {client.address}
                  </td>
                  <td className="px-3 border-r font-normal text-center border-neutral-500">
                    {client.contractNo}
                  </td>
                  <td className="px-3 flex justify-center items-center border-r font-normal border-neutral-500">
                    {client.name !== "EPCORN" && (
                      <>
                        <Link to={`/dashboard/client/${client._id}`}>
                          <Button label="Details" />
                        </Link>
                        <DeleteModal
                          label="Delete"
                          title="Delete Client"
                          id={{ id: client._id, name: client.name }}
                          handleDelete={handleDelete}
                          isLoading={deleteLoading}
                        />
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
export default Clients;
