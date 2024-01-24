const Loading = () => {
  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/20">
      <div
        className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-warning motion-reduce:animate-[spin_1.5s_linear_infinite]"
        role="status"
      ></div>
    </div>
  );
};
export default Loading;
