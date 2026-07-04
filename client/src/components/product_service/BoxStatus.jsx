import React, { useId, useState } from 'react';

function BoxStatus() {
  const id = useId();
  const [status, setStatus] = useState('');

  return (
    <div className='outline px-2 py-1 pb-2 rounded-md'>
      <h3 className='text-lg font-semibold'>Equipment Status<span className='text-red-600'>*</span></h3>
      <div className='grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3 items-center space-x-1 ml-5'>
        <div>
          <input
            type="radio"
            name="equipmentstatus"
            id={`${id}-ok`}
            value="ok"
            checked={status === 'ok'}
            onChange={(e) => setStatus(e.target.value)}
          />
          <label htmlFor={`${id}-ok`} className='ml-1'>Ok</label>
        </div>
        <div>
          <input
            type="radio"
            name="equipmentstatus"
            id={`${id}-notok`}
            value="notok"
            checked={status === 'notok'}
            onChange={(e) => setStatus(e.target.value)}
          />
          <label htmlFor={`${id}-notok`} className='ml-1'>Need Repair/ Replace</label>
        </div>
        <div className='*:block'>
          <input type="file" name="" id="" className='file:bg-gray-500 file:px-1 outline rounded ' />
        </div>
      </div>
    </div>
  );
}

export default BoxStatus;
