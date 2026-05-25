import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import {
  AlertMessage,
  Button,
  InputRow,
  InputSelect,
  Loading,
} from "../components";
import { types } from "../utils/constData";
import {
  useAddServiceMutation,
  useAllServiceQuery,
  useDeleteServiceMutation,
  useGetFrequencyQuery,
  useRemoveFrequencyMutation,
  useUpdateServiceMutation,
} from "../redux/adminSlice";
import { FaEdit } from "react-icons/fa";
import { useEffect, useState } from "react";
import { DeleteModal } from "../components/modals";
import { useDispatch, useSelector } from "react-redux";
import { toggleModal } from "../redux/helperSlice";
import ServiceFormModal from "../components/modals/ServiceFormModal";
import ServiceList from "../components/modals/ServiceList";
import Frequency from "../components/Frequency";
import { useGetSingleUserQuery, userSlice } from "../redux/userSlice";


const Services = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [selectedScope, setSelectedScope] = useState(null);
  const [serviceId, setServiceId] = useState(null)
  const [update, setUpdate] = useState({
    status: false,
    id: "",
  });
  const { isModalOpen, user } = useSelector((store) => store.helper);
  const dispatch = useDispatch();

  const { data: me } = useGetSingleUserQuery(user?._id, { skip: !user?.id })
  const { data, isLoading, isFetching, error } = useAllServiceQuery();
  const [addService, { isLoading: addLoading }] = useAddServiceMutation();
  const [updateService, { isLoading: updateLoading }] =
    useUpdateServiceMutation();
  const [deleteService, { isLoading: deleteLoading }] =
    useDeleteServiceMutation();

  // frequencies  
  const { data: frequencies, isLoading: freqLoading } = useGetFrequencyQuery();
  const [removeFreq] = useRemoveFrequencyMutation()

  const services = data?.services || [];

  useEffect(() => {
    if (selectedService && data?.services) {
      const updatedService = data.services
        ?.flatMap(item => item.service)
        ?.find(s => s._id === selectedService._id);

      setSelectedService(updatedService || null);

      if (selectedScope && updatedService) {
        const updatedScope = updatedService.scopes.find(
          sc => sc._id === selectedScope._id
        );
        setSelectedScope(updatedScope || null);
      }
    }
  }, [data]);

  const handleUpdateService = async (e, service) => {
    e.stopPropagation()
    setUpdate({ id: service._id, value: service.serviceName })
  }
  
  return (
    <>
      <section className="w-full space-y-5 p-1">
        {/* Main layout flexbox/grid fix container */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-stretch">
          <div className="col-span-1 md:col-span-3">
            <ServiceFormModal addService={addService} />
          </div>
          <div className="md:col-span-2 flex">
            <Frequency frequencies={frequencies} removeFreq={removeFreq} />
          </div>
        </div>

        <div className="outline grid outline-gray-400 p-4 bg-white rounded-lg space-y-4">
          <h3 className="text-2xl font-semibold text-center">Services</h3>
          {/* SERVICES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {services?.flatMap((item) =>
              item.service.map((service) => (
                <div
                  key={service._id}
                  onMouseEnter={() => setServiceId(service._id)}
                  onMouseLeave={() => setServiceId(null)}
                  onClick={() => {
                    setSelectedService(service);
                    setSelectedScope(null);
                    dispatch(toggleModal({ name: "service", status: true }))
                  }}
                  className={`capitalize flex items-center justify-between  border border-gray-500 rounded p-2 cursor-pointer transition ${selectedService?._id === service._id ? "bg-green-100 border-green-500" : "hover:bg-gray-50"
                    }`}
                >
                  {update.id === service._id ? (
                    <input
                      value={update.value}
                      autoFocus
                      onChange={(e) =>
                        setUpdate((prev) => ({
                          ...prev,
                          value: e.target.value,
                        }))
                      }
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                          try {
                            const res = await updateService({
                              id: service._id,
                              data: {
                                type: "serviceName",
                                data: update.value,
                                id: service._id,
                              },
                            }).unwrap();

                            toast.success(res.msg);

                            setUpdate({ id: null, value: "" });
                          } catch (error) {
                            toast.error(error?.data?.msg || error.error);
                          }
                        }

                        if (e.key === "Escape") {
                          setUpdate({ id: null, value: "" });
                        }
                      }}
                      className="border px-1 py-0.5 rounded w-full text-sm"
                    />
                  ) : (
                    service.serviceName
                  )}
                  {serviceId === service._id && (
                    <div
                      className="outline h-full px-1 grid place-items-center text-green-700 bg-green-200 rounded-sm"
                      onClick={(e) => handleUpdateService(e, service)}
                    >
                      <FaEdit />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          {isModalOpen.service && (
            <ServiceList
              dispatch={dispatch}
              toggleModal={toggleModal}
              services={services}
              selectedService={selectedService}
              selectedScope={selectedScope}
              setSelectedService={setSelectedService}
              setSelectedScope={setSelectedScope}
              rights={me?.rights}
            />
          )}
        </div>
      </section>
    </>
  );
}

export default Services;
