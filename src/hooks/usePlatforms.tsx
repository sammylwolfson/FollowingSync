import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export function usePlatforms() {
  const { user } = useAuth();

  // Query for all platforms
  const platformsQuery = useQuery({
    queryKey: ['/api/platforms'],
    queryFn: async () => {
      const res = await fetch('/api/platforms');
      return res.json();
    },
    enabled: true
  });

  // Query for user's platform connections
  const connectionsQuery = useQuery({
    queryKey: ['/api/connections'],
    queryFn: async () => {
      const res = await fetch('/api/connections', {
        credentials: 'include'
      });
      if (res.status === 401) return [];
      return res.json();
    },
    enabled: !!user
  });

  // Connect platform mutation
  const connectMutation = useMutation({
    mutationFn: async (platformId: number) => {
      const res = await apiRequest('POST', `/api/connections/${platformId}/connect`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
    }
  });

  // Disconnect platform mutation
  const disconnectMutation = useMutation({
    mutationFn: async (platformId: number) => {
      const res = await apiRequest('POST', `/api/connections/${platformId}/disconnect`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
    }
  });

  const connectPlatform = async (platformId: number) => {
    return connectMutation.mutateAsync(platformId);
  };

  const disconnectPlatform = async (platformId: number) => {
    return disconnectMutation.mutateAsync(platformId);
  };

  return {
    platforms: platformsQuery.data || [],
    connections: connectionsQuery.data || [],
    isLoading: platformsQuery.isLoading || connectionsQuery.isLoading,
    connectPlatform,
    isConnecting: connectMutation.isPending,
    disconnectPlatform,
    isDisconnecting: disconnectMutation.isPending
  };
}
