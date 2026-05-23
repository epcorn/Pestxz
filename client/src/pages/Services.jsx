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

const Services = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [selectedScope, setSelectedScope] = useState(null);
  const [update, setUpdate] = useState({
    status: false,
    id: "",
  });
  const { isModalOpen } = useSelector((store) => store.helper);
  const dispatch = useDispatch();

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
                  onClick={() => {
                    setSelectedService(service);
                    setSelectedScope(null);
                    dispatch(toggleModal({ name: "service", status: true }))
                  }}
                  className={`capitalize border border-gray-500 rounded p-2 cursor-pointer transition ${selectedService?._id === service._id ? "bg-green-100 border-green-500" : "hover:bg-gray-50"
                    }`}
                >
                  {service.serviceName}
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
            />
          )}
        </div>
      </section>
    </>
  );
}

export default Services;
