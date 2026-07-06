import React, { useEffect } from 'react';
import { compareDates, formatShortDate } from '../../utils/helperFunctions';
import { useDispatch } from 'react-redux';
import { dateTransfer } from '../../redux/helperSlice';

function ProductShow({ products }) {
  const dispatch = useDispatch();

  const [show, setShow] = React.useState({ id: "", status: false });

  // Fix: Move the dispatch logic out of the render loop and into a useEffect hook
  useEffect(() => {
    if (products?.length > 0) {
      // Find the first valid nextDate from your products list to transfer
      for (const pr of products) {
        const { nextDate } = compareDates(pr?.schedule || []);
        if (nextDate) {
          dispatch(dateTransfer(nextDate));
          break; // Stop after transferring the relevant date
        }
      }
    }
  }, [products, dispatch]);

  const toggleShow = (productId) => {
    setShow((prevShow) => ({
      id: productId,
      status: prevShow.id === productId ? !prevShow.status : true
    }));
  };

  return (
    <section className="">
      <div className="mt-3 ">
        <h3 className='text-lg font-semibold '>Products Overview</h3>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left m-0.5 rounded-md table-auto outline-1 outline-black min-w-[900px]">
          <thead className='bg-gray-300 text-sm'>
            <tr className="border-b border-black whitespace-nowrap *:px-4 *:py-2">
              <th className="border-r border-black">Product Name</th>
              <th className="border-r border-black">Version</th>
              <th className="border-r border-black">Code</th>
              <th className="border-r border-black">Status</th>
              <th className="border-r border-black">Serial No</th>
              <th className="border-r border-black">Frequency</th>
              <th>Scheduled Dates</th>
            </tr>
          </thead>
          <tbody className="whitespace-nowrap bg-white text-sm">
            {products?.map((pr, i) => {
              const schedules = pr?.schedule || [];
              const { todaysStatus, nextDate, todaysDate } = compareDates(schedules);

              const isExpanded = show.id === pr.productId && show.status;
              const slicedSchedules = isExpanded ? schedules : schedules.filter(f => f.status !== "Missed" && f.status !== "Done").slice(0, 5);

              return (
                <tr key={pr.productId + i} className="border-b border-black last:border-b-0 *:px-2 py-2">
                  <td className="border-r border-black">{pr.productName}</td>
                  <td className="border-r border-black">{pr.versionName}</td>
                  <td className="border-r border-black">{pr.code}</td>
                  <td className="border-r border-black text-sm">
                    <div className="flex flex-col">
                      {todaysStatus ? (
                        <span className='text-green-500 font-semibold'>Done</span>
                      ) : todaysDate ? (
                        <span className='text-emerald-600 font-semibold animate-pulse'>Pending Today</span>
                      ) : (
                        <span className='text-yellow-500 font-semibold'>Pending</span>
                      )}

                      {nextDate?.date && (
                        <span className="text-xs text-gray-400">
                          Next: {formatShortDate(nextDate.date)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border-r border-black">{pr?.serialNo}</td>
                  <td className="border-r border-black">{pr.frequency}</td>
                  <td className=''>
                    <div className="flex flex-wrap gap-2 min-w-[200px] p-1 max-h-20 text-xs font-semibold overflow-auto">
                      {slicedSchedules?.map(sc => {
                        const missed = sc.status === "Missed";
                        const done = sc.status === "Done" || sc.completed;
                        const isToday = todaysDate?.date && sc.date === todaysDate.date;
                        const isNext = nextDate?.date && sc.date === nextDate.date;

                        return (
                          <span
                            key={sc.date}
                            className={`outline-1 rounded px-1.5 py-0.5 ${missed ? "bg-red-200 text-red-700" :
                              done ? "bg-blue-200 text-blue-700" :
                                isToday ? "bg-green-200 text-green-700 animate-pulse" :
                                  isNext ? "bg-amber-200 text-amber-700" : ""
                              }`}
                          >
                            {formatShortDate(sc.date)}
                          </span>
                        );
                      })}

                      {schedules.length > 5 && (
                        <span
                          className='underline text-cyan-700 cursor-pointer select-none'
                          onClick={() => toggleShow(pr.productId)}
                        >
                          {isExpanded ? "Show less" : "Show All"}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section >
  );
}

export default ProductShow;