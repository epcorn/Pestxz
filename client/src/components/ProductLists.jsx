import React, { useState } from 'react'
import ImagesModal from './modals/ImagesModal'
import { useDispatch, useSelector } from 'react-redux'
import { toggleModal } from '../redux/helperSlice';

function ProductLists({ data }) {
  const dispatch = useDispatch();
  const { isModalOpen } = useSelector(store => store.helper)

  return (
    <section className="p-4 max-w-7xl mx-auto">
      <header className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Lists Products</h3>
      </header>

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
              <th className="px-4 py-3 border-r border-gray-200">Quality</th>
              <th className="px-4 py-3 border-r border-gray-200">Serviced By</th>
              <th className="px-4 py-3">Calibration used</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200 text-gray-600">
            {data && data.length > 0 ? (
              data.map((d) => {
                const expandKey = `${d._id}-expand`;
                const isExpanded = !!isModalOpen?.[expandKey];

                return (
                  <React.Fragment key={d._id}>
                    {/* Primary Row */}
                    <tr className={`hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-4 py-3 border-r border-gray-200 font-medium text-gray-900">
                        {new Date(d.servicedBy?.date).toLocaleString()}
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
                          <ExpandedProductLists productData={d} />
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


function ExpandedProductLists({ productData }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-inner">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Extended Specifications & Logs</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
        <div>
          <span className="font-medium text-gray-400 block">Product ID</span>
          <span className="font-mono">{productData._id}</span>
        </div>
        <div>
          <span className="font-medium text-gray-400 block">Status Code</span>
          <span>{productData.quality?.status || 'N/A'}</span>
        </div>
        <div>
          <span className="font-medium text-gray-400 block">Calibration Count</span>
          <span>{productData.calibration?.length || 0} items tracked</span>
        </div>
      </div>
    </div>
  )
}
