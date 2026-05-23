import React, { useEffect, useState } from 'react'
import { useAddFrequencyMutation, useGetFrequencyQuery, useRemoveFrequencyMutation } from '../redux/adminSlice'
import { toast } from 'react-toastify';

function Frequency({ removeFreq, frequencies }) {

  // Store the active item's ID instead of a generic boolean
  const [hoveredId, setHoveredId] = useState(null)
  const [addFreq, { isLoading }] = useAddFrequencyMutation();

  const handleAddFreq = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const obj = Object.fromEntries(data).frequency;
    try {
      const res = await addFreq({ freq: obj }).unwrap()
      toast.success(res.msg)
      e.target.reset();
    } catch (error) {
      toast.error(error?.data?.msg || error.msg || "Something went wrong")
    }
  }

  // Placeholder for handle delete
  const handleDelete = async (id) => {
    const confirmation = window.confirm("Are you sure delet this")
    console.log("Delete item:", id)
    try {
      if (confirmation) {
        const res = await removeFreq(id).unwrap();
        toast.success(res.msg)
      }
    } catch (error) {
      toast.error(error.msg)
    }
  }
  // useEffect(() => { console.log("added") }, [handleAddFreq, handleDelete])

  return (
    <div className='outline outline-gray-400 bg-white w-full min-h-[250px] max-h-[260px] flex flex-col rounded-lg overflow-hidden'>
      <form action="" className='bg-white shrink-0 p-2' onSubmit={handleAddFreq}>
        <div className='text-sm grid gap-1'>
          <label htmlFor="frequency"><strong>Add frequency</strong></label>
          <input
            type="text"
            id="frequency"
            name='frequency'
            placeholder='Add frequency'
            className='outline outline-gray-400 px-3 py-1.5 rounded w-full'
          />
        </div>
        <input
          type="submit"
          value={isLoading ? "Adding..." : "Add"}
          className='mt-2 outline px-3 py-1 capitalize bg-green-500 text-white rounded cursor-pointer'
        />
      </form>

      <ul className='overflow-y-auto flex-1 p-2 border-t border-gray-200 bg-gray-50'>
        {frequencies?.map((freq, i) => (
          <li
            key={freq._id}
            onMouseEnter={() => setHoveredId(freq._id)}
            onMouseLeave={() => setHoveredId(null)}
            className="relative flex items-center justify-between py-1 text-sm border-b border-gray-100 last:border-0"
          >
            <span>
              <strong>{i + 1}</strong> - {freq.name}
            </span>
            {hoveredId === freq._id && (
              <RemoveButton onClick={() => handleDelete(freq._id)} />
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Frequency

function RemoveButton({ onClick }) {
  return (
    <div className='absolute right-2 top-1/2 -translate-y-1/2'>
      <button
        className='w-5 h-5 flex items-center justify-center bg-red-200 text-red-600 rounded-full cursor-pointer hover:scale-110 transition text-xs font-bold'
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        ×
      </button>
    </div>
  )
}
