import { Link } from "react-router-dom";
import { AlertMessage, Button, Loading } from "../components";
import { DeleteModal, NewClientModal } from "../components/modals";
import { useAllClientsQuery, useDeleteClientMutation } from "../redux/clientSlice";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { toggleModal } from "../redux/helperSlice";
import { MdAddCircle } from "react-icons/md";
import Headers from "../components/Headers";
import { useState } from "react";

const Clients = () => {
  const dispatch = useDispatch();
  const { isModalOpen, user } = useSelector((store) => store.helper);
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, error } = useAllClientsQuery({limit:10, page:1});
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

  const pages = Array.from({ length: data?.pages }, (_, index) => index + 1);
  console.log(pages)
  return (
    <div className="max-w-7xl mx-auto px-0 pb-6 max-h-full overflow-auto">
      <div className="sticky top-0 bg-slate-100">
      <Headers header={"Client Registry"} user={user} />
      </div>

      <NewClientModal />
      {(isLoading || isFetching) ? (
        <div className="py-12 flex justify-center items-center">
          <Loading />
        </div>
      ) : error ? (
        <div className="my-4">
          <AlertMessage>{error?.data?.msg || error.error}</AlertMessage>
        </div>
      ) : data?.clients?.length > 0 ? (

        /* 4. MAIN DATA VIEW LIST MODULE CONTAINER */
        <div className="overflow-hidden rounded-lg border border-neutral-400 bg-white shadow-sm max-h-full">
          <div className="hidden md:flex items-center bg-neutral-300 border-b border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-500 py-3 px-4 gap-4 text-center">
            <div className="w-56 text-left shrink-0">Client Name</div>
            <div className="flex-1 text-left">Address</div>
            <div className="w-30 shrink-0">Contract No.</div>
            <div className="w-44 shrink-0">Action</div>
          </div>

          {/* ELASTIC FLEX SECTIONS / AUTOMATED MOBILE STACK CARD GRID */}
          <div className="divide-y divide-neutral-700 overflow-y-auto max-h-full">
            {data?.clients?.map((client) => (
              <div
                key={client._id}
                className="flex flex-col md:flex-row md:items-center py-4 px-4 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors gap-3 md:gap-4"
              >
                {/* A. Client Name Block */}
                <div className="w-full md:w-56 flex flex-col md:block shrink-0">
                  <span className="md:hidden text-xs font-bold underline text-black uppercase">Client Name</span>
                  <span className="font-semibold text-neutral-500 ml-3 md:font-bold">{client.name}</span>
                </div>

                {/* B. Dynamic Auto Wrapping Address Column */}
                <div className="w-full flex-1 flex flex-col md:block items-start justify-between min-w-0">
                  <span className="md:hidden text-xs font-bold underline text-black uppercase">Address</span>
                  <p className="break-words text-neutral-600 font-bold text-left ml-3 w-full text-xs md:text-sm line-clamp-2 md:line-clamp-none" title={client.address}>
                    {client.address}
                  </p>
                </div>

                {/* C. Monospaced Minimalist Contract Row */}
                <div className="w-full md:w-30 flex flex-col md:block md:text-center shrink-0">
                  <span className="md:hidden text-xs font-bold text-black uppercase">Contract No</span>
                  <span className="font-mono text-xs md:text-sm bg-neutral-50 md:bg-transparent px-2 py-0.5 md:p-0 rounded border border-neutral-300 ml-3 md:border-none w-fit ">
                    {client.contractNo || "—"}
                  </span>
                </div>

                <div className="w-full md:w-44 flex justify-between md:block md:text-center items-center shrink-0 pt-2.5 md:pt-0 border-t md:border-none border-neutral-100">
                  <span className="md:hidden text-xs font-bold text-black uppercase">Action</span>
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

      {pages?.length > 0 && (
        <nav className="mb-1">
          <ul className="list-style-none flex justify-center mt-2">
            {pages.map((item) => (
              <li className="pr-1" key={item}>
                <button
                  className={`relative block rounded px-3 py-1.5 text-sm transition-all duration-30  ${page === item ? "bg-blue-400" : "bg-neutral-700"
                    } text-white hover:bg-blue-400`}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
};

export default Clients;
