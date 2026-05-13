import React from 'react'
import { useDispatch } from 'react-redux'
import { toggleModal } from '../../redux/helperSlice'

function ImagesModal({ image, isModalOpen }) {
  const dispatch = useDispatch()
  return (
    <div className="w-full h-dvh fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
      {/* Close Button Trigger Area */}
      <button
        className="absolute top-4 right-4 text-white text-sm font-medium tracking-wider bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors"
        onClick={() =>
          dispatch(toggleModal({ name: "PEImages", status: false }))}
      >
        ✕ CLOSE
      </button>

      {/* Image Viewport Wrapper */}
      <div className="w-full max-w-4xl h-3/4 flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-thin">
        {image?.map((img, index) => (
          <div
            key={index}
            className="w-full h-full shrink-0 snap-center flex items-center justify-center"
          >
            <img
              src={img}
              alt={`Preview ${index + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        ))}
      </div>
    </div>

  )
}

export default ImagesModal