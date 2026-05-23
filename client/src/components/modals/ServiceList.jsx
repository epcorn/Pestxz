import React, { useState } from 'react'
import InputSelect from '../InputSelect';
import { useDeleteServiceMutation, useUpdateServiceMutation } from '../../redux/adminSlice';
import { toast } from 'react-toastify';

function ServiceList({ selectedScope, selectedService, setSelectedScope, setSelectedService, dispatch, toggleModal }) {

  const [toggleInput, setToggleInput] = useState({ type: "", id: null, });
  const [updateService, { isLoading: updateLoading }] =
    useUpdateServiceMutation();
  const [deleteService, { isLoading: deleteLoading }] =
    useDeleteServiceMutation();

  const handleClick = (data) => {
    setToggleInput({ type: data.type, id: data.id });
  };

  return (
    <div className='fixed inset-0 w-full h-full grid place-items-center bg-black/70'>

      <div className='bg-white p-2 grid grid-cols-2 rounded-lg w-2xl'>
        <div className='col-span-2 ml-auto'>
          <button className='outline h-6 w-6 grid place-items-center aspect-square rounded-full text-red-500 cursor-pointer'
            onClick={() => { dispatch(toggleModal({ name: "service", status: false })); setSelectedService(null) }}
          >✕</button>
        </div>
        {selectedService && (
          <div className="rounded p-3 bg-white">
            <h2 className="font-semibold mb-3 capitalize space-x-3">
              <span>{selectedService.serviceName} → Scopes</span>

              <button className='w-6 h-6 bg-green-200 text-green-600 rounded-full cursor-pointer hover:scale-110 transition'
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick({
                    id: selectedService._id,
                    type: "scope",
                  });
                }}>
                +
              </button>
            </h2>

            <div className="grid gap-2">
              {toggleInput.type === "scope" &&
                <AddNewInput
                  type={toggleInput.type}
                  id={selectedService._id}
                  updateService={updateService}
                  setToggleInput={setToggleInput}
                />}
              {selectedService.scopes.map((scope) => (
                <div
                  key={scope._id}
                  onClick={() => setSelectedScope(scope)}
                  className={`relative group border rounded px-2 py-1 cursor-pointer transition ${selectedScope?._id === scope._id
                    ? "bg-blue-100 border-blue-500"
                    : "hover:bg-gray-50"
                    }`}
                >
                  {scope.scopeName}

                  <RemoveService
                    id={scope._id}
                    serviceId={selectedService._id}
                    deleteService={deleteService}
                    type={"scope"} />
                </div>
              ))}

            </div>
          </div>
        )}

        {/* CONSUMABLES */}

        {selectedScope && (
          <div className="border-l p-3">
            <h3 className="font-semibold mb-3 capitalize space-x-3">
              <span>{selectedScope.scopeName} → Consumables</span>
              <button className='w-6 h-6 bg-green-200 text-green-600 rounded-full cursor-pointer hover:scale-110 transition'
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick({ type: "consumable", id: selectedScope._id });
                }}>
                +
              </button>
            </h3>

            <div className="grid gap-2">
              {toggleInput.type === "consumable" &&
                <AddNewInput
                  type={toggleInput?.type}
                  id={selectedScope?._id}
                  updateService={updateService}
                  setToggleInput={setToggleInput}
                />}
              {selectedScope.consumables.map((item) => (
                <div
                  key={item._id}
                  className="relative group bg-gray-100 border border-gray-700 px-3 py-1 rounded text-sm"
                >
                  {item.name}

                  <RemoveService
                    id={item._id}
                    scopeId={selectedScope._id}
                    serviceId={selectedService._id}
                    deleteService={deleteService}
                    type={"consumable"}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default ServiceList;


function RemoveService({ id, type, setToggleInput, toggleInput, serviceId, scopeId, deleteService }) {
  const handleClick = async (e) => {
    const confirm = window.confirm("Are you sure want to delete");
    try {
      if (confirm) {
        const res = await deleteService({ id, data: { type, serviceId, scopeId } }).unwrap();
        toast.success(res.msg);
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.data?.msg || error.error);
    }
  }
  return (
    <div className=' absolute h-full rounded-r right-1 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
      <button className='w-6 h-6 pb-1 bg-red-200 text-red-600 rounded-full cursor-pointer hover:scale-110 transition'
        onClick={(e) => { e.stopPropagation(); handleClick() }}
      >
        ×
      </button>
    </div>
  );
}

function AddNewInput({ type, id, setToggleInput, updateService }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const formobj = Object.fromEntries(formData);
    const payload = {
      type: type, data: formobj[type], id
    }
    try {
      const res = await updateService({ id, data: payload }).unwrap();
      toast.success(res.msg);
    } catch (error) {
      console.log(error);
      toast.error(error?.data?.msg || error.error);
    }
    console.log(payload)
    setToggleInput({})
  }
  return (
    <form className="flex gap-2 mt-3" onSubmit={handleSubmit}>
      <input
        type="text"
        name={type}
        placeholder={"New " + type}
        className="border px-2 py-0.5 rounded w-full"
      />

      <button type='submit' className="bg-green-600 text-white px-3 rounded">
        Add
      </button>
    </form>
  )
}
