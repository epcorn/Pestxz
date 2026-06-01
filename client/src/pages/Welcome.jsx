import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import QrScanner from '../components/dashboard/QrScanner';

function Welcome() {
  const { user } = useSelector(store => store.helper);


  return (
    <div className='p-4 max-w-md mx-auto'>
      <p className='text-center font-semibold text-2xl mt-5'>
        Hi, {user?.name || 'Guest'}
      </p>
      <QrScanner />

    </div>
  );
}

export default Welcome;
