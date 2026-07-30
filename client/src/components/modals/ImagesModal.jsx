import React from 'react'
import { useDispatch } from 'react-redux'
import { toggleModal } from '../../redux/helperSlice'

function ImagesModal({ image, name }) {
  const dispatch = useDispatch()

  // Safely normalize into a single array format
  const imageList = Array.isArray(image) ? image : image ? [image] : []

  if (imageList.length === 0) return null

  return (
    <div className="w-full h-dvh fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
      {/* Backdrop Click Closer */}
      <div
        className="absolute inset-0 z-0 cursor-zoom-out"
        onClick={(e) => { e.stopPropagation(); dispatch(toggleModal({ name: name, status: false })) }}
      />

      {/* Close Button Trigger Area */}
      <button
        className="absolute top-4 right-4 z-10 text-white text-xs font-semibold tracking-wider bg-white/10 hover:bg-white/20 px-3 py-2 rounded-md transition-colors border border-white/10"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); dispatch(toggleModal({ name: name, status: false })) }}
      >
        ✕ CLOSE
      </button>

      {/* Image Viewport Wrapper */}
      <div
        className={`w-full max-w-4xl h-3/4 flex z-10 gap-4 overflow-y-hidden select-none
          ${imageList.length > 1 ? 'overflow-x-auto snap-x snap-mandatory scrollbar-thin' : 'overflow-x-hidden justify-center items-center'}`}
      >
        {imageList.map((img, index) => (
          <div
            key={index}
            className="w-full h-full shrink-0 snap-center flex items-center justify-center"
          >
            <img
              src={img}
              alt={`Preview ${index + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-neutral-900/50"
              draggable="false"
            />
          </div>
        ))}
      </div>

      {/* Image Counter Badge for Multi-Image views */}
      {imageList.length > 1 && (
        <div className="absolute bottom-6 z-10 bg-black/40 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md border border-white/5 font-medium tracking-wide">
          Swipe horizontally to view images
        </div>
      )}
    </div>
  )
}

export default ImagesModal
