import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import PlatformStatusCard from "@/components/PlatformStatusCard";
import FollowingTable from "@/components/FollowingTable";
import SyncProgress from "@/components/SyncProgress";
import TableFilters from "@/components/TableFilters";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { useFollowing } from "@/hooks/useFollowing";
import { usePlatforms } from "@/hooks/usePlatforms";
import { RefreshCw, FileDown } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState("following");
  const { connections, isLoading: connectionsLoading } = usePlatforms();
  const { 
    syncData, 
    startSync, 
    isSyncing,
    syncProgress,
    exportData,
    isExporting
  } = useFollowing();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleSyncNow = async () => {
    try {
      await startSync();
      toast({
        title: "Sync started",
        description: "Your social media data is being synchronized.",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: (error as Error)?.message || "Failed to start synchronization.",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      await exportData();
      toast({
        title: "Export successful",
        description: "Your data has been prepared for download.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: (error as Error)?.message || "Failed to export data.",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        user={user} 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Mobile Header */}
      {isMobile && (
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              type="button"
              className="text-gray-600"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="material-icons">menu</span>
            </button>
            <span className="text-xl font-semibold text-primary flex items-center">
              <span className="material-icons mr-2">sync</span>
              SocialSync
            </span>
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="material-icons text-gray-500">person</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="px-4 py-4 md:p-6">
          <div className="mb-6 md:flex md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Social Media Following Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Sync and manage all your social media connections in one place</p>
            </div>
            <div className="mt-4 md:mt-0 flex">
              <Button 
                onClick={handleSyncNow}
                disabled={isSyncing || connections.length === 0}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </Button>
              <Button 
                variant="outline" 
                className="ml-3"
                onClick={handleExport}
                disabled={isExporting || syncData.length === 0}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Platform Connection Status Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
            {connections.map((connection: any) => (
              <PlatformStatusCard 
                key={connection.id} 
                connection={connection} 
              />
            ))}
          </div>

          {/* Sync Progress (Conditional) */}
          {isSyncing && syncProgress?.length > 0 && (
            <SyncProgress progress={syncProgress} />
          )}

          {/* Tabs */}
          <Tabs defaultValue="following" className="mb-6">
            <TabsList>
              <TabsTrigger value="following" className="flex items-center">
                <span className="material-icons text-sm mr-2">people_outline</span>
                Following Table
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center">
                <span className="material-icons text-sm mr-2">insights</span>
                Analytics
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center">
                <span className="material-icons text-sm mr-2">history</span>
                Sync History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="following" className="mt-6">
              {/* Table Filters */}
              <TableFilters />

              {/* Following Table */}
              <FollowingTable />
            </TabsContent>

            <TabsContent value="analytics">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900">Analytics Coming Soon</h3>
                <p className="mt-2 text-gray-500">
                  We're working on building analytics features to help you understand your social media following patterns.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900">Sync History</h3>
                <p className="mt-2 text-gray-500">
                  View your recent sync operations and their status.
                </p>

                <div className="mt-4">
                  {syncProgress.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {syncProgress.map((sync: any) => (
                        <li key={sync.id} className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${
                                sync.platform.color ? 
                                  `bg-[${sync.platform.color}]` : 
                                  'bg-gray-500'
                              }`}>
                                <span className="material-icons text-sm">{sync.platform.icon}</span>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{sync.platform.name}</p>
                                <p className="text-xs text-gray-500">
                                  {sync.status === 'completed' ? 'Completed' : 
                                   sync.status === 'in_progress' ? 'In Progress' : 
                                   sync.status === 'failed' ? 'Failed' : 'Pending'}
                                </p>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {sync.startTime ? new Date(sync.startTime).toLocaleString() : 'N/A'}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No sync history available</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
