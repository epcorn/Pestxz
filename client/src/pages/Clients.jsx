import { Link } from "react-router-dom";
import { AlertMessage, Button, Loading } from "../components";
import { DeleteModal, NewClientModal } from "../components/modals";
import { useAllClientsQuery, useDeleteClientMutation } from "../redux/clientSlice";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { toggleModal } from "../redux/helperSlice";
import { MdAddCircle } from "react-icons/md";

const Clients = () => {
  const dispatch = useDispatch();
  const { isModalOpen } = useSelector((store) => store.helper);

  const { data, isLoading, isFetching, error } = useAllClientsQuery();
  const [deleteClient, { isLoading: deleteLoading }] = useDeleteClientMutation();

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
    <div className="max-w-7xl mx-auto px-0 md:px-3 lg:px-5 py-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Clients Registry</h1>

        </div>
        <NewClientModal />
      </div>

      {(isLoading || isFetching) ? (
        <div className="py-12 flex justify-center items-center">
          <Loading />
        </div>
      ) : error ? (
        <div className="my-4">
          <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
        </div>
      ) : data?.length > 0 ? (

        /* 4. MAIN DATA VIEW LIST MODULE CONTAINER */
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          <div className="hidden md:flex items-center bg-neutral-300 border-b border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-500 py-3 px-4 gap-4 text-center">
            <div className="w-56 text-left shrink-0">Client Name</div>
            <div className="flex-1 text-left">Address</div>
            <div className="w-30 shrink-0">Contract No.</div>
            <div className="w-44 shrink-0">Action</div>
          </div>

          {/* ELASTIC FLEX SECTIONS / AUTOMATED MOBILE STACK CARD GRID */}
          <div className="divide-y divide-neutral-200">
            {data?.map((client) => (
              <div
                key={client._id}
                className="flex flex-col md:flex-row md:items-center py-4 px-4 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors gap-3 md:gap-4"
              >
                {/* A. Client Name Block */}
                <div className="w-full md:w-56 flex justify-between md:block items-center shrink-0">
                  <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Client Name</span>
                  <span className="font-semibold text-neutral-900 md:font-normal">{client.name}</span>
                </div>

                {/* B. Dynamic Auto Wrapping Address Column */}
                <div className="w-full flex-1 flex flex-col md:block items-start justify-between min-w-0">
                  <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase mb-0.5">Address</span>
                  <p className="break-words text-neutral-600 text-left w-full text-xs md:text-sm line-clamp-2 md:line-clamp-none" title={client.address}>
                    {client.address}
                  </p>
                </div>

                {/* C. Monospaced Minimalist Contract Row */}
                <div className="w-full md:w-30 flex justify-between md:block md:text-center items-center shrink-0">
                  <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Contract No</span>
                  <span className="font-mono text-xs md:text-sm bg-neutral-50 md:bg-transparent px-2 py-0.5 md:p-0 rounded border border-neutral-100 md:border-none">
                    {client.contractNo || "—"}
                  </span>
                </div>


                <div className="w-full md:w-44 flex justify-between md:block md:text-center items-center shrink-0 pt-2.5 md:pt-0 border-t md:border-none border-neutral-100">
                  <span className="md:hidden text-xs font-semibold text-neutral-400 uppercase">Action</span>
                  <div className="flex justify-start md:justify-center items-center gap-2">
                    {client.name !== "EPCORN" ? (
                      <>
                        <Link to={`/dashboard/client/${client._id}`}>
                          <Button label="Details" small color="bg-neutral-800 text-white hover:bg-neutral-900" />
                        </Link>
                        <DeleteModal
                          label=""
                          title="Delete Client"
                          id={{ id: client._id, name: client.name }}
                          handleDelete={handleDelete}
                          isLoading={deleteLoading}
                        />
                      </>
                    ) : (
                      <span className="text-neutral-400 text-xs italic md:w-full md:inline-block md:text-center font-medium tracking-wide">
                        System Protected
                      </span>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      ) : (
        
        <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-xl bg-white">
          <p className="text-sm text-neutral-500">No client data found records inside registry.</p>
        </div>
      )}
    </div>
  );
};

export default Clients;
