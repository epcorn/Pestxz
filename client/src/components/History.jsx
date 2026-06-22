import React from 'react';
import { useParams } from 'react-router-dom';
import { useAllLocationsQuery } from '../redux/locationSlice';
import { useDispatch, useSelector } from 'react-redux';
import { toggleModal } from '../redux/helperSlice';

function History({ loc }) {
  const { id } = useParams();
  const dispatch = useDispatch()

  const { data, isLoading } = useAllLocationsQuery({ id });

  if (isLoading) return <div className="p-5 text-center text-white">Loading...</div>;

  // Safe check for locating correct entry
  const loca = data?.locations?.find(f => f._id === loc?._id);

  if (!loca) return null;

  console.log(loca)
  return (
    <section className="fixed inset-0 z-50 w-full h-full bg-black/30 overflow-y-auto p-4 flex justify-center items-start">
      <div className="w-full max-w-4xl bg-white p-5 rounded-2xl my-8 space-y-4">
        <div className='flex justify-between items-center'>
          <h3 className="text-2xl font-bold mb-5">
            Changes on Location: {loca.location || 'N/A'}
          </h3>
          <p className='outline leading-none rounded-full w-7 h-7 text-center content-center text-red-500 font-bold cursor-pointer' onClick={() => dispatch(toggleModal({ name: "changes", status: false }))}>
            X
          </p>
        </div>

        {loca?.changes?.map((c, i) => (
          <div key={i} className="grid grid-cols-6 border border-gray-200 rounded-lg overflow-hidden mb-4">

            {/* Left Column - User info & Reason */}
            <div className="bg-red-100 p-3 col-span-2 text-sm space-y-1">
              <p><strong>User id: </strong> {c?.changedBy_id || 'N/A'}</p>
              <p><strong>User name: </strong> {c?.changedBy_user || 'Unknown'}</p>
              <p><strong>Date: </strong>{c?.changedAt ? new Date(c.changedAt).toLocaleString() : 'N/A'}</p>

              {c?.reason && (
                <p className="outline-1 outline-red-300 px-2 rounded leading-tight py-1 mt-2 bg-white text-xs">
                  <strong>Reason: </strong> <span>{c.reason}</span>
                </p>
              )}
            </div>

            {/* Right Column - Diff values */}
            <div className="bg-gray-100 p-3 col-span-4 text-sm space-y-2">

              {/* Added Arrays */}
              {c.diff?.servicesAdded?.length > 0 && (
                <p className='text-gray-700'><strong>Service Added: </strong> {c.diff.servicesAdded.join(", ")}</p>
              )}
              {c.diff?.servicesRemoved?.length > 0 && (
                <p className='text-red-700'><strong>Services Removed: </strong> {c.diff.servicesRemoved.join(", ")}</p>
              )}
              {c.diff?.consumablesAdded?.length > 0 && (
                <p className='text-gray-700'><strong>Consumables Added: </strong> {c.diff.consumablesAdded.join(", ")}</p>
              )}
              {c.diff?.consumablesRemoved?.length > 0 && (
                <p className='text-red-700'><strong>Consumables Removed: </strong> <s>{c.diff.consumablesRemoved.join(", ")}</s></p>
              )}
              {c.diff?.scopesAdded?.length > 0 && (
                <p className='text-gray-700'><strong>Scopes Added: </strong> {c.diff.scopesAdded.join(", ")}</p>
              )}
              {c.diff?.scopesRemoved?.length > 0 && (
                <p className='text-red-700'><strong>Scopes Removed: </strong> <s>{c.diff.scopesRemoved.join(", ")}</s></p>
              )}

              {/* Property Structural Shifts */}
              {(c.diff?.floor || c.diff?.location || c.diff?.subLocation) && (
                <div className="space-y-1 bg-white p-2 rounded border border-gray-200 text-xs">
                  {c.diff?.floor && (
                    <p className="flex gap-2">
                      <strong className="w-24">Floor:</strong>
                      <span className="bg-red-200 px-1 line-through">{c.diff.floor.from || 'N/A'}</span>
                      <span>→</span>
                      <span className="bg-green-100 px-1">{c.diff.floor.to}</span>
                    </p>
                  )}

                  {c.diff?.location && (
                    <p className="flex gap-2">
                      <strong className="w-24">Location:</strong>
                      <span className="bg-red-200 px-1 line-through">{c.diff.location.from || 'N/A'}</span>
                      <span>→</span>
                      <span className="bg-green-100 px-1">{c.diff.location.to}</span>
                    </p>
                  )}

                  {c.diff?.subLocation && (
                    <p className="flex gap-2">
                      <strong className="w-24">Sub Location:</strong>
                      <span className="bg-red-200 px-1 line-through">{c.diff.subLocation.from || 'N/A'}</span>
                      <span>→</span>
                      <span className="bg-green-100 px-1">{c.diff.subLocation.to}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Calibration Array */}
              {c.diff?.calibrationChanges?.length > 0 && (
                <div className="pt-1 border-t border-gray-200">
                  <strong className="block mb-1 text-xs text-gray-600">Calibration Changed:</strong>
                  <div className="space-y-1">
                    {c.diff.calibrationChanges.map((cal, idx) => (
                      <p key={idx} className="flex gap-3 text-xs items-center bg-white p-1 rounded">
                        <span className="font-semibold flex-1">{cal.consumable}</span>
                        <span className="bg-red-200 px-1 line-through">{cal.from}</span>
                        <span>→</span>
                        <span className="bg-green-100 px-1">{cal.to}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default History;
