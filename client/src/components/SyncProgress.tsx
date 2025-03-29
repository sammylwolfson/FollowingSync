import { Progress } from "@/components/ui/progress";

interface SyncProgressProps {
  progress: any[];
}

export default function SyncProgress({ progress }: SyncProgressProps) {
  // Find an active sync if any
  const activeSync = progress.find(sync => sync.status === 'in_progress');
  
  if (!activeSync) {
    return null;
  }
  
  // Calculate overall progress
  const percentComplete = activeSync.totalItems > 0 
    ? Math.round((activeSync.itemsProcessed / activeSync.totalItems) * 100)
    : 0;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-8">
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="material-icons text-blue-400 animate-pulse">sync</span>
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between">
          <p className="text-sm text-blue-700">
            Syncing your social media following data...
          </p>
          <p className="mt-3 text-sm md:mt-0 md:ml-6">
            <button className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600">
              Cancel <span className="sr-only">syncing</span>
            </button>
          </p>
        </div>
      </div>
      <div className="mt-3">
        <Progress value={percentComplete} className="h-2 bg-blue-200" />
        <div className="flex justify-between mt-1 text-xs text-blue-700">
          <span>{percentComplete}% complete</span>
          <span>Processing: {activeSync.platform.name}</span>
        </div>
      </div>
    </div>
  );
}
