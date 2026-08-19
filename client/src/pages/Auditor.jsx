import AuditorForm from "../components/auditor/AuditorForm";
import { useForm } from 'react-hook-form';

function Auditor() {
  const { register, control } = useForm()
  return (
    <>
    <div className="relative -top-6.5 p-5 -left-5 w-dvw bg-[#009688] h-[90dvh]">
      <AuditorForm register={register} control={control} />
    </div>
    </>
  )
}

export default Auditor;