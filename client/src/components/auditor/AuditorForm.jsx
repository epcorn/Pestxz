import { Controller } from 'react-hook-form';
import InputRow from '../InputRow';
import InputSelect from '../InputSelect';
import { useGetComplaintLocationQuery } from '../../redux/locationSlice';

function AuditorForm({ register, control }) {
  const options = [{ value: "kuchupuchu", label: "kuchupuchu" }]
  const { data } = useGetComplaintLocationQuery()
  return (
    <form>
      <div className='grid grid-cols-2 gap-x-2'>
        <Controller
          control={control}
          name='clientName'
          render={({ field: { onChange, value } }) => (
            <InputSelect label='Choose Client' onChange={onChange} value={value} options={options} />
          )}
        />
        <Controller
          control={control}
          name='location'
          render={({ field: { onChange, value } }) => (
            <InputSelect label='Location' onChange={onChange} value={value} options={options} />
          )}
        />
        <Controller
          control={control}
          name='subLocation'
          render={({ field: { onChange, value } }) => (
            <InputSelect label='Sub Location' onChange={onChange} value={value} options={options} />
          )}
        />
      </div>
    </form>
  )
}

export default AuditorForm