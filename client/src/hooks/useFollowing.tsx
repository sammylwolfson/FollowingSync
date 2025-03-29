import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

export function useFollowing() {
  const { user } = useAuth();
  const [syncProgress, setSyncProgress] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Query for user's following data
  const followingQuery = useQuery({
    queryKey: ['/api/following'],
    queryFn: async () => {
      const res = await fetch('/api/following', {
        credentials: 'include'
      });
      if (res.status === 401) return [];
      return res.json();
    },
    enabled: !!user
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/sync');
      return res.json();
    },
    onSuccess: (data) => {
      setSyncProgress(data);
      setIsSyncing(true);
      // Start polling for sync status
      pollSyncStatus();
    }
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('GET', '/api/export');
      return res.json();
    },
    onSuccess: (data) => {
      // Create CSV from the data
      const csvContent = convertToCSV(data.data);
      downloadCSV(csvContent, "social-sync-export.csv");
    }
  });

  // Poll sync status
  const pollSyncStatus = async () => {
    if (!user) return;

    try {
      const res = await fetch('/api/sync/status', {
        credentials: 'include'
      });
      const data = await res.json();
      
      setSyncProgress(data);
      
      // Check if all syncs are completed or failed
      const allDone = data.every(sync => 
        sync.status === 'completed' || sync.status === 'failed'
      );
      
      if (allDone) {
        setIsSyncing(false);
        queryClient.invalidateQueries({ queryKey: ['/api/following'] });
        queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      } else {
        // Continue polling
        setTimeout(pollSyncStatus, 2000);
      }
    } catch (error) {
      console.error("Error polling sync status:", error);
      setIsSyncing(false);
    }
  };

  const startSync = async () => {
    return syncMutation.mutateAsync();
  };

  const exportData = async () => {
    return exportMutation.mutateAsync();
  };

  return {
    following: followingQuery.data || [],
    syncData: followingQuery.data || [],
    isLoading: followingQuery.isLoading,
    startSync,
    isSyncing,
    syncProgress,
    exportData,
    isExporting: exportMutation.isPending
  };
}

// Helper function to convert data to CSV
function convertToCSV(data) {
  // Generate headers
  const headers = ['Username', 'Display Name', 'Platform'];
  
  // Generate rows
  const rows = data.map(item => [
    item.username,
    item.displayName,
    item.platform
  ]);
  
  // Combine headers and rows
  const csvRows = [headers, ...rows];
  
  // Convert to CSV format
  return csvRows.map(row => row.join(',')).join('\n');
}

// Helper function to download CSV
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
