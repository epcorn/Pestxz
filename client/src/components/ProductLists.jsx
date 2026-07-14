import React, { useState } from 'react'
import ImagesModal from './modals/ImagesModal'
import { useDispatch, useSelector } from 'react-redux'
import { toggleModal } from '../redux/helperSlice';

function serviceDate(date) {
  return (new Date(date).toLocaleString())
}

function ProductLists({ data }) {
  const dispatch = useDispatch();
  const { isModalOpen } = useSelector(store => store.helper)

  // const products = data.flatMap(d => d.productservices)

  return (
    <section className="">

      {/* Overflow container to keep the table responsive */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-300 text-gray-700 uppercase text-xs font-semibold tracking-wider">
            <tr>
              <th className="px-4 py-3 border-r border-gray-200">Service Date</th>
              <th className="px-4 py-3 border-r border-gray-200">Serial No</th>
              <th className="px-4 py-3 border-r border-gray-200">Product Name</th>
              <th className="px-4 py-3 border-r border-gray-200">Version</th>
              <th className="px-4 py-3 border-r border-gray-200">Code</th>
              <th className="px-4 py-3 border-r border-gray-200">Equipment</th>
              <th className="px-4 py-3 border-r border-gray-200">Serviced By</th>
              <th className="px-4 py-3">Calibration used</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200 text-gray-600">
            {data && data?.length > 0 ? (
              data?.map((d) => {
                const expandKey = `${d._id}-expand`;
                const isExpanded = !!isModalOpen?.[expandKey];

                return (
                  <React.Fragment key={d._id}>
                    {/* Primary Row */}
                    <tr className={`hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-4 py-3 border-r border-gray-200 font-medium text-gray-900">
                        {serviceDate(d.servicedBy?.date)}
                      </td>
                      <td
                        className="px-4 py-3 border-r border-gray-200 font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => dispatch(toggleModal({ name: expandKey, status: !isExpanded }))}
                      >
                        <div className="flex items-center gap-1">
                          <span>{isExpanded ? '▼' : '►'}</span>
                          <span>{d.serialNo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200">{d.product?.name}</td>
                      <td className="px-4 py-3 border-r border-gray-200">{d.version?.name}</td>
                      <td className="px-4 py-3 border-r border-gray-200 font-mono text-xs text-gray-500">{d.code}</td>
                      <td className="px-4 py-3 border-r border-gray-200">
                        <span
                          onClick={() => dispatch(toggleModal({ name: `${d._id}-quality`, status: true }))}
                          className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {d.quality?.status}
                        </span>
                        {isModalOpen?.[`${d._id}-quality`] && (
                          <ImagesModal name={`${d._id}-quality`} image={d.quality?.image} />
                        )}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200">{d.servicedBy?.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1.5">
                          {d.calibration?.map(c => {
                            const modalKey = `${c?._id}-calibration`

                            return (
                              <React.Fragment key={c._id}>
                                <div
                                  onClick={(e) => { e.stopPropagation(); dispatch(toggleModal({ name: modalKey, status: true })) }}
                                  className="inline-flex items-center gap-1 cursor-pointer border border-gray-300 rounded px-2 py-0.5 text-xs bg-gray-50 text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                  <span className="text-gray-500">{c.name}:</span>
                                  <strong className="font-semibold text-gray-900">{c.status}</strong>
                                  {c?.size ? <span> - {c.size}</span> : ""}
                                </div>
                                {isModalOpen?.[modalKey] && (
                                  <ImagesModal name={modalKey} image={c?.image} />
                                )}
                              </React.Fragment>
                            )
                          })}
                        </div>
                      </td>
                    </tr>

                    {/* Inline Expanded Component Section */}
                    {isExpanded && (
                      <tr className="bg-gray-50/50">
                        <td colSpan="8" className="px-6 py-4 border-b border-gray-200 whitespace-normal">
                          <ExpandedProductLists dispatch={dispatch} isModalOpen={isModalOpen} toggleModal={toggleModal} productData={data.filter(da => da.code === d.code)} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-400 italic">
                  No Product serviced yet...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default ProductLists


export function ExpandedProductLists({ productData, isModalOpen, dispatch, toggleModal, maxh, w }) {

  return (
    <div className={`bg-gray-200 p-4 rounded-lg border border-gray-200 shadow-inner ${w ? w : "w-fit"}`}>
      <h4 className=" font-semibold text-gray-700 mb-2">Previous Work log</h4>
      <div className={`${maxh ? maxh : "max-h-72"} overflow-y-auto bg-white p-2 space-y-2`}>
        {productData?.length === 0 ?
          <p className='p-5 text-2xl font-semibold text-center '>No previous records found</p>
          : productData?.map(pr => (
            <div key={pr._id} className="grid grid-cols-3 gap-4  bg-gray-50 outline rounded p-2 ">
              <div>
                <span className="font-bold block">Service Date</span>
                <span className="font-mono wrap-break-word">{serviceDate(pr.servicedBy.date)}</span>
              </div>
              <div className='text-center'>
                <span className="font-bold  block">Serviced By</span>
                <span>{pr.servicedBy.name}</span>
              </div>
              <div>
                <span className="font-bold block">Equipment's Quality</span>
                <span className="font-mono underline text-blue-600 font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(toggleModal({ name: `${pr._id}-quality`, status: true }))
                  }}>
                  {pr.quality.status}
                </span>
                {isModalOpen?.[`${pr._id}-quality`] && <ImagesModal name={`${pr._id}-quality`} image={pr.quality.image} />}
              </div>

              <div className='col-span-full outline p-0.5 grid grid-rows-2 gap-y-2'>
                <span className="font-bold block col-span-full ">Calibration Count</span>
                <div className='flex flex-wrap gap-2'>
                  {pr?.calibration.map(cal => (
                    <React.Fragment key={cal._id}>
                      <p className='px-2 outline cursor-pointer '
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(toggleModal({ name: `${cal._id}-cal`, status: true }))
                        }}>
                        <span>{cal.name}: </span>
                        <strong>{cal.status}</strong>
                      </p>
                      {isModalOpen?.[`${cal._id}-cal`] && <ImagesModal name={`${cal._id}-cal`} image={cal.image} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
