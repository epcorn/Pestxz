import { useForm } from "react-hook-form";
import { MdAddCircle } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Button, InputRow } from "..";
import { useRegisterClientMutation } from "../../redux/clientSlice";
import { toggleModal } from "../../redux/helperSlice";
import FormModal from "./FormModal";

const NewClient = () => {
  const { isModalOpen } = useSelector((store) => store.helper);
  const dispatch = useDispatch();

  const [addClient, { isLoading }] = useRegisterClientMutation();

  const {
    register,
    formState: { errors, isValid },
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      address: "",
      contractNo: "",
      email: "",
      password: "",
    },
  });

  const submit = async (data) => {
    try {
      const res = await addClient(data).unwrap();
      toast.success(res.msg);
      reset();
      setTimeout(() => {
        dispatch(toggleModal({ name: "newClient", status: false }));
      }, 300);
    } catch (error) {
      console.log(error);
      toast.error(error?.data?.msg || error.error);
    }
  };

  const formBody = (
    <div className="grid grid-cols-2 gap-x-4">
      <div>
        <InputRow
          label="Client Name"
          id="name"
          errors={errors}
          register={register}
        />
        <p className="text-xs text-red-500 -bottom-4 pl-1">
          {errors.name && "Name is required"}
        </p>
      </div>
      <div>
        <InputRow
          label="Client Contract No"
          id="contractNo"
          errors={errors}
          register={register}
        />
        <p className="text-xs text-red-500 -bottom-4 pl-1">
          {errors.contractNo && "Contract No is required"}
        </p>
      </div>
      <div className="col-span-2">
        <InputRow
          label="Client Address"
          id="address"
          errors={errors}
          register={register}
        />
        <p className="text-xs text-red-500 -bottom-4 pl-1">
          {errors.address && "Address is required"}
        </p>
      </div>
      <div className="mb-3">
        <InputRow
          label="Admin Email"
          id="email"
          errors={errors}
          register={register}
          type="email"
        />
        <p className="text-xs text-red-500 -bottom-4 pl-1">
          {errors.email && "Email is required"}
        </p>
      </div>
      <div>
        <InputRow
          label="Admin Password"
          id="password"
          errors={errors}
          register={register}
          type="password"
        />
        <p className="text-xs text-red-500 -bottom-4 pl-1">
          {errors.password && "Password is required"}
        </p>
      </div>
    </div>
  );

  return (
    <div>
      <Button
        height="h-10"
        color="bg-green-600"
        label={
          <div className="flex items-center">
            <MdAddCircle className="w-6 h-6 pr-1" /> New Client
          </div>
        }
        onClick={() =>
          dispatch(toggleModal({ name: "newClient", status: true }))
        }
      />
      <FormModal
        onSubmit={handleSubmit(submit)}
        title="New Client"
        formBody={formBody}
        submitLabel="Add Client"
        handleClose={() =>
          dispatch(toggleModal({ name: "newClient", status: false }))
        }
        disabled={isLoading}
        isLoading={isLoading}
        open={isModalOpen.newClient}
      />
    </div>
  );
};
export default NewClient;
