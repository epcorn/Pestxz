import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../Button';
import { useDispatch, useSelector } from 'react-redux';
import { toggleModal } from '../../../redux/helperSlice';
import ImagesModal from '../../modals/ImagesModal';
import CasualForm from './CasualForm';
import { List } from 'react-window';

function CasualLists({ work = [] }) {
  const dispatch = useDispatch();
  const { isModalOpen, user } = useSelector(store => store.helper);
  // Track open row using the ID string directly (null means closed)
  const [expandedRowId, setExpandedRowId] = useState(null);

  const navigate = useNavigate();

  if (work.length === 0) {
    return <div className="p-4 text-gray-500 text-center">No Casual work found.</div>;
  }

  const handleRowClick = (id) => {
    setExpandedRowId(prevId => prevId === id ? null : id);
  };

  return (
    <div className="text-xs md:text-sm max-h-96 overflow-x-auto w-full">
      <table className="min-w-[800px] w-full text-left border border-gray-400">
        <thead className='sticky top-0'>
          <tr className="bg-gray-300 border-b border-gray-400 *:not-last:border-r ">
            <th className="p-3 font-bold text-gray-700">Index</th>
            <th className="p-3 font-bold text-gray-700">Date</th>
            <th className="p-3 font-bold text-gray-700">Completed By</th>
            <th className="p-3 font-bold text-gray-700">Pest Count</th>
            <th className="p-3 font-bold text-gray-700">Service</th>
            <th className="p-3 max-w-28 font-bold text-gray-700">Image</th>
            <th className="p-3 font-bold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody className='h-10 '>
          {work.map((w, i) => (
            <React.Fragment key={w._id}>
              <tr
                className={`border-b border-b-gray-400 hover:bg-amber-100 transition-all text-xs md:text-sm *:not-last:border-r cursor-pointer ${expandedRowId === w._id ? "bg-amber-50" : ""}`}
                onClick={() => handleRowClick(w._id)}
              >
                <td className="p-3 text-gray-900">{i + 1}</td>
                <td className="p-3 text-gray-900 whitespace-nowrap">
                  {new Date(w.updatedAt).toLocaleString()}
                </td>
                <td className="p-3 text-gray-900">
                  {w.user?.name || 'N/A'}
                </td>
                <td className="p-3 text-gray-900">
                  {w?.pestCount || 0}
                </td>
                <td className="p-3 text-gray-900">{w.service.map(ser => ser.serviceName || "").join(", ")}</td>
                <td className="p-3 text-gray-900">

                  {w.image.map(img => (
                    <img src={img} className="h-16" alt="" onMouseEnter={() =>
                      dispatch(
                        toggleModal({
                          name: `image_${w._id}`,
                          status: true,
                        }),
                      )} />
                  ))}
                  {isModalOpen[`image_${w._id}`] && <ImagesModal image={w.image} name={`image_${w._id}`} />}
                </td>
                <td className="p-3 text-gray-900">{w?.status || "Raised"}</td>
              </tr>

              {/* Correct HTML Table Expansion */}
              {expandedRowId === w._id && (
                <tr className="bg-gray-300 border-b border-b-gray-400">
                  <td colSpan={6} className="p-4">
                    {w.service.map(ser =>
                      <Expand key={ser._id} data={ser} user={user} dispatch={dispatch} isModalOpen={isModalOpen} toggleModal={toggleModal} />
                    )}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CasualLists;

function Expand({ data, user, isModalOpen, dispatch, toggleModal }) {
  console.log(data)
  return (
    <div className="text-gray-700">
      <p className="font-semibold mb-0 text-center">Details View:</p>
      {data?.scopes?.map((sc, i) => (
        <div key={`${sc?.scopeId}-${i}`} className="mb-6 border-b border-gray-200 pb-4 last:border-b-0">
          {/* Scope Header Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-gray-200 p-3 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong className="font-semibold text-gray-900">Service Name:</strong> <span className="ml-1">{data?.serviceName}</span>
            </p>
            <p className="text-sm text-gray-700">
              <strong className="font-semibold text-gray-900">Scope Name:</strong> <span className="ml-1">{sc?.scopeName}</span>
            </p>
          </div>

          {/* Consumables Grid Container */}
          {sc?.consumables && sc.consumables.length > 0 && (
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-indigo-500">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Consumables</h4>

              {sc?.consumables?.map((con) => (
                <div
                  key={con?.consumableId}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/40 p-3 rounded-md border border-gray-200 shadow-sm"
                >
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium uppercase">Name</span>
                    <span className="text-sm font-semibold text-gray-800">{con?.consumableName || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium uppercase">Calibration</span>
                    <span className="text-sm text-gray-600">{con?.calibration || '0'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium uppercase">Used</span>
                    <span className="text-sm text-gray-600">{con?.used || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium uppercase">Action</span>
                    <span className="text-sm text-gray-600">{con?.action || 'None'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}


    </div>
  );
}
