const JobSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
        <div className="flex gap-2">
          <div className="w-16 h-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="w-20 h-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>

      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>

      <div className="space-y-2 mb-4">
        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4"></div>
      </div>
    </div>
  );
};

export default JobSkeleton;
