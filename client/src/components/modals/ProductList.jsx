import React, { useState } from 'react'
import { useGetProductsQuery } from '../../redux/adminSlice'
import { FaEdit } from "react-icons/fa";
import { FaDeleteLeft } from "react-icons/fa6";
import Button from '../Button';
import { useDispatch, useSelector } from 'react-redux';
import { toggleModal } from '../../redux/helperSlice';
import ProductModal from './ProductModal';

function ProductList({ selected = {} }) {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const dispatch = useDispatch()

  const { data: products } = useGetProductsQuery();
  const { isModalOpen } = useSelector(store => store.helper);


  let globalIndex = 0;
  const handleEditClick = (product) => {
    setSelectedProduct(product)
    dispatch(toggleModal({ name: "editproducts", status: true }))
  }

  return (
    <>

      <div className='w-full overflow-x-auto border border-gray-800 rounded'>

        <table className='w-full min-w-[1200px] text-left border-collapse text-sm'>
          <thead>
            <tr className='border-b border-gray-800 font-semibold bg-gray-50 bg-gray-300'>
              <th className='p-2 border-r border-gray-00 w-16 text-center'>Sr. No.</th>
              <th className='p-2 border-r border-gray-800'>Product Name</th>
              <th className='p-2 border-r border-gray-800'>Product Versions</th>
              <th className='p-2 border-r border-gray-800'>Unit Code</th>
              <th className='p-2 border-r border-gray-800'>Specification</th>
              <th className='p-2 border-r border-gray-800'>Calibrations</th>
              <th className='p-2'>Action</th>
            </tr>
          </thead>
          <tbody>
            {products?.flatMap((pr) =>
              pr.version?.map((v, index) => {

                globalIndex++;

                return (
                  <tr key={`${pr._id}_${index}`} className='border-b border-gray-800 hover:bg-gray-50/50'>

                    <td className='p-2 border-r border-gray-800 text-center font-medium'>{globalIndex}</td>
                    <td className='p-2 border-r border-gray-800'>
                      {pr.name}</td>
                    <td className='p-2 border-r border-gray-800'>
                      {v.name}</td>
                    <td className='p-2 border-r border-gray-800'>
                      {v.code}</td>
                    <td className='p-2 border-r border-gray-800'>
                      {pr.specification}</td>
                    <td className='p-2 border-r border-gray-800'>
                      {v.calibration ? v.calibration.join(", ") : ""}</td>
                    <td className='p-2'>
                      <div className='flex justify-center gap-5 text-base'>
                        <div className='text-blue-700 cursor-pointer' onClick={() => handleEditClick(pr)} >
                          <FaEdit />
                        </div>
                        <div className='text-red-600 cursor-pointer'>
                          <FaDeleteLeft />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {isModalOpen?.editproducts && <ProductModal modalKey='editproducts' productData={selectedProduct} mode='update' />}
    </>
  )
}

export default ProductList
