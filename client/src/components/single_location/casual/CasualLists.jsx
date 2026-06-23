import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../Button';
import { useDispatch, useSelector } from 'react-redux';
import { toggleModal } from '../../../redux/helperSlice';
import ImagesModal from '../../modals/ImagesModal';
import CasualForm from './CasualForm';

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
    <div className="text-xs md:text-sm overflow-x-auto w-full">
      <table className="min-w-[800px] w-full border-collapse text-left border border-gray-400">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-400 *:not-last:border-r ">
            <th className="p-3 font-bold text-gray-700">Index</th>
            <th className="p-3 font-bold text-gray-700">Date</th>
            <th className="p-3 font-bold text-gray-700">Raised By</th>
            <th className="p-3 font-bold text-gray-700">Service</th>
            <th className="p-3 font-bold text-gray-700 max-w-3xs min-w-3xs">Image</th>
            <th className="p-3 font-bold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {work.map((w, i) => (
            <React.Fragment key={w._id}>
              <tr
                className="border-b border-b-gray-400 hover:bg-gray-50 transition-all text-xs md:text-sm *:not-last:border-r cursor-pointer"
                onClick={() => handleRowClick(w._id)}
              >
                <td className="p-3 text-gray-900">{i + 1}</td>
                <td className="p-3 text-gray-900 whitespace-nowrap">
                  {new Date(w.updatedAt).toLocaleString()}
                </td>
                <td className="p-3 text-gray-900">
                  {w.user?.name || 'N/A'}
                </td>
                <td className="p-3 text-gray-900">{w.serviceName}</td>
                <td className="p-3 text-gray-900">
                  <Button
                    label={`Show (${w.image?.length || 0})`}
                    onClick={(e) => {
                      e.stopPropagation(); // Stops row expansion from firing
                      dispatch(toggleModal({ name: `image_${w._id}`, status: !isModalOpen[`image_${w._id}`] }));
                    }}
                  />
                  {isModalOpen[`image_${w._id}`] && <ImagesModal image={w.image} name={`image_${w._id}`} />}
                </td>
                <td className="p-3 text-gray-900">{w?.status || "Raised"}</td>
              </tr>

              {/* Correct HTML Table Expansion */}
              {expandedRowId === w._id && (
                <tr className="bg-gray-50 border-b border-b-gray-400">
                  <td colSpan={6} className="p-4">
                    <Expand data={w} user={user} dispatch={dispatch} isModalOpen={isModalOpen} toggleModal={toggleModal} />
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
      <div>
        <p className="text-xs mt-2 text-gray-500 text-center">No work update</p>


      </div>
    </div>
  );
}
