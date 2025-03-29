import { useMemo } from "react";
import { useFollowing } from "@/hooks/useFollowing";
import { useAuth } from "@/hooks/useAuth";
import { usePlatforms } from "@/hooks/usePlatforms";
import { DataTable } from "@/components/ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle, XCircle } from "lucide-react";

export default function FollowingTable() {
  const { user } = useAuth();
  const { following, isLoading } = useFollowing();
  const { connections } = usePlatforms();

  // Create a unique list of all usernames across platforms
  const uniqueUsers = useMemo(() => {
    if (!following || following.length === 0) return [];

    const userMap = new Map();

    // Group following data by username
    following.forEach((follow) => {
      if (!userMap.has(follow.username)) {
        userMap.set(follow.username, {
          username: follow.username,
          displayName: follow.displayName || follow.username,
          profilePictureUrl: follow.profilePictureUrl,
          platforms: {},
        });
      }

      // Mark which platforms this user is followed on
      userMap.get(follow.username).platforms[follow.platform.code] = true;
    });

    return Array.from(userMap.values());
  }, [following]);

  // Get all available platforms for column headers
  const availablePlatforms = useMemo(() => {
    return connections
      .filter(conn => conn.connected)
      .map(conn => ({
        id: conn.platform.id,
        code: conn.platform.code,
        name: conn.platform.name,
        icon: conn.platform.icon,
        color: conn.platform.color,
      }));
  }, [connections]);

  // Define columns for the data table
  const columns = useMemo<ColumnDef<any>[]>(() => {
    // Base columns
    const cols: ColumnDef<any>[] = [
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-4">
                <AvatarImage src={user.profilePictureUrl} alt={user.displayName} />
                <AvatarFallback className="bg-gray-200">
                  {user.displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  @{user.username}
                </div>
                <div className="text-sm text-gray-500">
                  {user.displayName}
                </div>
              </div>
            </div>
          );
        },
      },
    ];

    // Add platform columns
    availablePlatforms.forEach(platform => {
      cols.push({
        id: platform.code,
        header: () => (
          <div className="text-center">
            <div 
              className="platform-icon mx-auto h-6 w-6 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: platform.color }}
            >
              <span className="material-icons text-sm">{platform.icon}</span>
            </div>
            <span className="block mt-1 text-xs uppercase">{platform.name}</span>
          </div>
        ),
        cell: ({ row }) => {
          const user = row.original;
          const isFollowing = user.platforms[platform.code];
          
          return (
            <div className="text-center">
              {isFollowing ? (
                <CheckCircle className="mx-auto h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="mx-auto h-5 w-5 text-gray-300" />
              )}
            </div>
          );
        },
      });
    });

    // Actions column
    cols.push({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        return (
          <div className="text-right">
            <Button variant="link" className="text-primary hover:text-primary-dark">
              View
            </Button>
          </div>
        );
      },
    });

    return cols;
  }, [availablePlatforms]);

  if (isLoading) {
    return <div className="py-10 text-center">Loading following data...</div>;
  }

  if (!following || following.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6 text-center">
        <p className="text-gray-500">No following data available. Connect platforms and sync to see your data.</p>
      </div>
    );
  }

  return <DataTable columns={columns} data={uniqueUsers} searchColumn="username" />;
}
