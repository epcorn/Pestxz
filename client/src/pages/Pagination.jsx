import React from 'react';

function Pagination({ page, totalPages, setPage }) {
  const getPaginationRange = (currentPage, totalPagesCount) => {
    // If there are no pages, return an empty range immediately
    if (!totalPagesCount || totalPagesCount <= 0) {
      return { range: [], showLeftEllipsis: false, showRightEllipsis: false };
    }

    const maxVisiblePages = 5; 
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPagesCount, start + maxVisiblePages - 1);

    // Adjust start if close to the end boundary
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    const range = [];
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return { range, showLeftEllipsis: start > 1, showRightEllipsis: end < totalPagesCount };
  };

  const { range: visiblePages, showLeftEllipsis, showRightEllipsis } = getPaginationRange(page, totalPages);

  // Only show pagination controls if there is more than 1 page total
  if (!totalPages || totalPages <= 0) return null;

  return (
    <nav className="mb-1">
      <ul className="list-style-none flex items-center justify-center gap-1 mt-2">
        {/* Previous Button */}
        <li>
          <button
            className={`px-3 py-1.5 text-sm rounded transition-all ${
              page === 1 ? "bg-neutral-300 text-neutral-500 cursor-not-allowed" : "bg-neutral-700 text-white hover:bg-blue-400"
            }`}
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          >
            Prev
          </button>
        </li>

        {/* First Page + Ellipsis if truncated on left */}
        {showLeftEllipsis && (
          <>
            <li>
              <button
                className="px-3 py-1.5 text-sm rounded bg-neutral-700 text-white hover:bg-blue-400"
                onClick={() => setPage(1)}
              >
                1
              </button>
            </li>
            <li className="px-1 text-neutral-500">...</li>
          </>
        )}

        {/* Visible Page Numbers */}
        {visiblePages.map((item) => (
          <li key={item}>
            <button
              className={`relative block rounded px-3 py-1.5 text-sm transition-all duration-300 ${
                page === item ? "bg-blue-400 font-bold" : "bg-neutral-700"
              } text-white hover:bg-blue-400`}
              onClick={() => setPage(item)}
            >
              {item}
            </button>
          </li>
        ))}

        {/* Last Page + Ellipsis if truncated on right */}
        {showRightEllipsis && (
          <>
            <li className="px-1 text-neutral-500">...</li>
            <li>
              <button
                className="px-3 py-1.5 text-sm rounded bg-neutral-700 text-white hover:bg-blue-400"
                onClick={() => setPage(totalPages)}
              >
                {totalPages}
              </button>
            </li>
          </>
        )}

        {/* Next Button */}
        <li>
          <button
            className={`px-3 py-1.5 text-sm rounded transition-all ${
              page === totalPages ? "bg-neutral-300 text-neutral-500 cursor-not-allowed" : "bg-neutral-700 text-white hover:bg-blue-400"
            }`}
            disabled={page === totalPages}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Pagination;