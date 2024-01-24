import { AiOutlineDelete } from "react-icons/ai";
import { MdDeleteForever } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import Button from "../Button";
import { toggleModal } from "../../redux/helperSlice";

const DeleteModal = ({ title, handleDelete, isLoading, id, label }) => {
  const { isModalOpen } = useSelector((store) => store.helper);
  const dispatch = useDispatch();

  return (
    <>
      <button
        className={
          label &&
          `bg-red-600 flex rounded-lg hover:opacity-80 px-2 items-center h-8`
        }
        onClick={() => dispatch(toggleModal({ name: "delete", status: id }))}
      >
        <MdDeleteForever
          className={`w-6 h-6 mr-0.5  ${label ? "text-white" : "text-red-600"}`}
        />
        <span className="text-white text-[15px] font-semibold">{label}</span>
      </button>
      <div
        className={`fixed inset-0 z-50 flex justify-center items-center  transition-colors ${
          isModalOpen.delete.id ? "visible bg-black/20" : "invisible"
        }`}
      >
        <div
          className={`bg-white rounded-xl shadow p-5 transition-all ${
            isModalOpen.delete.id
              ? "scale-100 opacity-100"
              : "scale-125 opacity-0"
          }`}
        >
          <AiOutlineDelete className="text-red-500 mx-auto w-10 h-10" />
          <div className="mx-auto my-1">
            <h3 className="text-lg font-black text-gray-800 text-center">
              {title}
            </h3>
            <p className="text-sm text-gray-700 pt-4">
              Are you sure do you want to delete{" "}
              <b>{isModalOpen.delete.name}?</b>
            </p>
          </div>
          <div className="flex pt-2">
            <Button
              label="Delete"
              color="bg-red-600"
              onClick={handleDelete}
              disabled={isLoading}
              isLoading={isLoading}
              width="w-full"
            />
            <Button
              label="Cancel"
              color="bg-slate-500"
              onClick={() =>
                dispatch(
                  toggleModal({
                    name: "delete",
                    status: { id: null, name: null },
                  })
                )
              }
              disabled={isLoading}
              width="w-full"
            />
          </div>
        </div>
      </div>
    </>
  );
};
export default DeleteModal;
