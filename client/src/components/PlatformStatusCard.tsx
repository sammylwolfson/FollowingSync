import { usePlatforms } from "@/hooks/usePlatforms";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PlatformStatusCardProps {
  connection: any;
}

export default function PlatformStatusCard({ connection }: PlatformStatusCardProps) {
  const { connectPlatform, disconnectPlatform } = usePlatforms();
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      await connectPlatform(connection.platformId);
      toast({
        title: "Connected",
        description: `Successfully connected to ${connection.platform.name}`,
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to platform",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectPlatform(connection.platformId);
      toast({
        title: "Disconnected",
        description: `Successfully disconnected from ${connection.platform.name}`,
      });
    } catch (error) {
      toast({
        title: "Disconnection failed",
        description: error.message || "Failed to disconnect from platform",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div
              className="platform-icon text-white h-6 w-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: connection.platform.color }}
            >
              <span className="material-icons text-sm">{connection.platform.icon}</span>
            </div>
          </div>
          <div className="ml-3 w-full">
            <p className="text-sm font-medium text-gray-900">{connection.platform.name}</p>
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                {connection.connected ? "Connected" : "Not connected"}
              </p>
              <span
                className={`h-2 w-2 rounded-full ${
                  connection.connected
                    ? "bg-green-500"
                    : connection.status === "error"
                    ? "bg-red-500"
                    : "bg-gray-400"
                }`}
              ></span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        {connection.connected ? (
          <div className="text-xs flex justify-between">
            <span className="font-medium text-gray-700">Last synced:</span>
            <span className="text-gray-500">
              {connection.lastSynced
                ? new Date(connection.lastSynced).toLocaleString()
                : "Never"}
            </span>
          </div>
        ) : (
          <div className="text-center">
            <Button
              variant="link"
              size="sm"
              className="text-xs text-primary font-medium hover:text-blue-600"
              onClick={handleConnect}
            >
              Connect now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
