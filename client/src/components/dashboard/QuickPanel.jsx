import React, { useRef, useEffect } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { toggleModal } from "../../redux/helperSlice";
import { HiOutlineHandRaised } from "react-icons/hi2";
import { Link } from "react-router-dom";

function QuickPanel({ data }) {
  const { isModalOpen } = useSelector((store) => store.helper);
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);

  // Map and normalize only true pending/active complaints
  const complaints = data
    ?.filter((d) => d.type === "Complaint")
    .map((comp) => ({
      compId: comp._id,
      type: "Complaint",
      clientName: comp.clientName || comp.complaintDetails?.clientName,
      comment: comp.complaintDetails?.comment,
      status: comp.complaintDetails?.status,
      services: comp.complaintDetails?.service || [],
      userName: comp.complaintDetails?.userName,
      location: `${comp.location?.floor || ""}, ${comp.location?.location || ""}`,
    })) || [];

  const unreadCount = complaints.length;

  // Click outside to close notification dropdown menu panel securely
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (isModalOpen.notification) {
          dispatch(toggleModal({ name: "notification", status: false }));
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModalOpen.notification, dispatch]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* NOTIFICATION TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() =>
          dispatch(
            toggleModal({
              name: "notification",
              status: !isModalOpen.notification,
            })
          )
        }
        className="relative p-2.5 text-gray-600 hover:bg-gray-100 rounded-full transition focus:outline-none border border-gray-200 bg-white shadow-xs"
      >
        <IoNotificationsOutline className="text-2xl" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN CONTAINER CONTEXT MENU PANEL */}
      {isModalOpen.notification && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[480px] bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          {/* HEADER */}
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              Recent Alerts
            </h2>
            <span className="text-xs bg-gray-200 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
              {unreadCount} New
            </span>
          </div>

          {/* LIST SCROLL AREA */}
          <div className="overflow-y-auto divide-y divide-gray-100 flex-1 max-h-[380px]">
            {complaints.length > 0 ? (
              complaints.map((item) => (
                <Link
                  key={item.compId}
                  to={`/complaint/${item.compId}`}
                  onClick={() =>
                    dispatch(toggleModal({ name: "notification", status: false }))
                  }
                  className="p-4 flex gap-3 hover:bg-blue-50/50 transition items-start text-left w-full block"
                >
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-600 shrink-0 mt-0.5">
                    <HiOutlineHandRaised className="text-base" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs text-gray-500 font-medium">
                      <span className="font-semibold text-gray-800">
                        {item.userName}
                      </span>{" "}
                      raised a complaint for{" "}
                      <span className="text-gray-700 font-medium">
                        {item.clientName}
                      </span>
                    </p>
                    <p className="text-xs text-blue-600 font-semibold truncate bg-blue-50/60 px-1.5 py-0.5 rounded w-fit">
                      Services: {item.services.join(", ") || "General"}
                    </p>
                    <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 p-2 rounded italic break-words">
                      "{item.comment || "No structural note shared"}"
                    </p>
                    <p className="text-[11px] text-gray-400">
                      📍 {item.location}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center justify-center space-y-2">
                <IoNotificationsOutline className="text-3xl text-gray-300" />
                <p>All clear! Nothing to show.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default QuickPanel;