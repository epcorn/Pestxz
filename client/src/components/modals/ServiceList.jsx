import React, { useEffect, useState } from "react";
import InputSelect from "../InputSelect";
import {
  useDeleteServiceMutation,
  useUpdateServiceMutation,
} from "../../redux/adminSlice";
import { toast } from "react-toastify";

function ServiceList({
  selectedScope,
  selectedService,
  setSelectedScope,
  setSelectedService,
  dispatch,
  toggleModal,
  rights,
}) {
  const [toggleInput, setToggleInput] = useState({
    type: "",
    id: null,
  });

  // USED FOR TOUCH DEVICES / IPAD
  const [toggleHover, setToggleHover] = useState(null);

  const [updateService] = useUpdateServiceMutation();

  const [deleteService] = useDeleteServiceMutation();

  const handleClick = (data) => {
    setToggleInput({
      type: data.type,
      id: data.id,
    });
  };
  useEffect(() => {
    const handleEscClose = (e) => {
      if (e.key === "Escape") {
        dispatch(
          toggleModal({
            name: "service",
            status: false,
          })
        );

        setSelectedService(null);
        setSelectedScope(null);
      }
    };

    window.addEventListener("keydown", handleEscClose);

    return () => {
      window.removeEventListener("keydown", handleEscClose);
    };
  }, [dispatch, toggleModal, setSelectedService, setSelectedScope]);

  return (
    <div className="fixed inset-0 w-full h-full grid place-items-center bg-black/70 z-50 p-3">
      <div className="bg-white p-2 grid grid-cols-1 md:grid-cols-2 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* CLOSE BUTTON */}
        <div className="col-span-full ml-auto mb-2">
          <button
            className="outline h-6 w-6 grid place-items-center aspect-square rounded-full text-red-500 cursor-pointer"
            onClick={() => {
              dispatch(toggleModal({ name: "service", status: false, }));
              setSelectedService(null);
              setSelectedScope(null);
            }}
          >
            ✕
          </button>
        </div>

        {/* SCOPES */}
        {selectedService && (
          <div className="rounded p-3 bg-white">
            <h2 className="font-semibold mb-3 capitalize flex items-center gap-3 justify-between">
              <span>
                {selectedService.serviceName} → Scopes
              </span>

              <button
                className="shrink-0 w-6 h-6 grid place-items-center bg-green-200 text-green-600 rounded-full cursor-pointer hover:scale-110 transition"
                onClick={(e) => {
                  e.stopPropagation();

                  handleClick({
                    id: selectedService._id,
                    type: "scope",
                  });
                }}
              >
                +
              </button>
            </h2>

            <div className="grid gap-2">
              {toggleInput.type === "scope" && (
                <AddNewInput
                  type={toggleInput.type}
                  id={selectedService._id}
                  updateService={updateService}
                  setToggleInput={setToggleInput}
                />
              )}

              {selectedService.scopes.map((scope) => (
                <div
                  key={scope._id}
                  onClick={() => {
                    setSelectedScope(scope);

                    // TOUCH DEVICE SUPPORT
                    setToggleHover((prev) =>
                      prev === scope._id ? null : scope._id
                    );
                  }}
                  className="relative border rounded px-3 py-2 cursor-pointer transition hover:bg-gray-50"
                >
                  {scope.scopeName}

                  {toggleHover === scope._id && (
                    <RemoveService
                      id={scope._id}
                      serviceId={selectedService._id}
                      deleteService={deleteService}
                      type={"scope"}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONSUMABLES */}
        {selectedScope && (
          <div className="border-l p-3">
            <div className="font-semibold mb-3 capitalize flex items-center gap-3">
              <span>
                {selectedScope.scopeName} → Consumables
              </span>

              <button
                className="shrink-0 w-6 h-6 bg-green-200 text-green-600 rounded-full cursor-pointer hover:scale-110 transition"
                onClick={(e) => {
                  e.stopPropagation();

                  handleClick({
                    type: "consumable",
                    id: selectedScope._id,
                  });
                }}
              >
                +
              </button>
            </div>

            <div className="grid gap-2">
              {toggleInput.type === "consumable" && (
                <AddNewInput
                  type={toggleInput?.type}
                  id={selectedScope?._id}
                  updateService={updateService}
                  setToggleInput={setToggleInput}
                />
              )}

              {selectedScope.consumables.map((item) => (
                <div
                  key={item._id}
                  onClick={() =>
                    setToggleHover((prev) =>
                      prev === item._id ? null : item._id
                    )
                  }
                  className="relative bg-gray-100 border border-gray-300 px-3 py-2 rounded text-sm cursor-pointer"
                >
                  {item.name}

                  {toggleHover === item._id && (
                    <RemoveService
                      id={item._id}
                      scopeId={selectedScope._id}
                      serviceId={selectedService._id}
                      deleteService={deleteService}
                      type={"consumable"}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ServiceList;

function RemoveService({
  id,
  type,
  serviceId,
  scopeId,
  deleteService,
}) {
  const handleClick = async () => {
    const confirmDelete = window.confirm(
      "Are you sure want to delete?"
    );

    try {
      if (confirmDelete) {
        const res = await deleteService({
          id,
          data: {
            type,
            serviceId,
            scopeId,
          },
        }).unwrap();

        toast.success(res.msg);
      }
    } catch (error) {
      console.log(error);

      toast.error(
        error?.data?.msg || error.error
      );
    }
  };

  return (
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
      <button
        className="w-6 h-6 grid place-items-center bg-red-200 text-red-600 rounded-full cursor-pointer hover:scale-110 transition"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        ✕
      </button>
    </div>
  );
}

function AddNewInput({
  type,
  id,
  setToggleInput,
  updateService,
}) {
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const formobj = Object.fromEntries(formData);

    const payload = {
      type: type,
      data: formobj[type],
      id,
    };

    try {
      const res = await updateService({
        id,
        data: payload,
      }).unwrap();

      toast.success(res.msg);
      e.target.reset();
      setToggleInput({
        type: "",
        id: null,
      });
    } catch (error) {
      console.log(error);
      toast.error(
        error?.data?.msg || error.error
      );
    }
  };

  return (
    <form
      className="flex gap-2 mt-3"
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        name={type}
        placeholder={"New " + type}
        className="border px-2 py-1 rounded w-full outline-none"
        required
      />

      <button
        type="submit"
        className="bg-green-600 text-white px-3 rounded hover:bg-green-700 transition"
      >
        Add
      </button>
    </form>
  );
}