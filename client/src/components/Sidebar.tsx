import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Dashboard, 
  Users, 
  RefreshCw, 
  Settings, 
  LogOut 
} from "lucide-react";

interface SidebarProps {
  user: any;
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ user, isOpen, onToggle, activeTab, setActiveTab }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { logout } = useAuth();
  const isMobile = useMobile();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: error.message || "Failed to log out",
        variant: "destructive",
      });
    }
  };

  // For mobile sidebar, add a backdrop that closes when clicked
  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={onToggle}
          />
        )}
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-30 transform transition-transform duration-200 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarContent user={user} handleLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} />
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside className="w-64 hidden md:block bg-white border-r border-gray-200 flex-shrink-0">
      <SidebarContent user={user} handleLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} />
    </aside>
  );
}

function SidebarContent({ user, handleLogout, activeTab, setActiveTab }) {
  return (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <Link href="/">
          <a className="text-xl font-semibold text-primary flex items-center">
            <span className="material-icons mr-2">sync</span>
            SocialSync
          </a>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          <li>
            <a 
              href="#" 
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                activeTab === "dashboard" 
                  ? "bg-primary bg-opacity-10 text-primary" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={() => setActiveTab("dashboard")}
            >
              <Dashboard className="mr-3 h-5 w-5 text-current" />
              Dashboard
            </a>
          </li>
          <li>
            <a 
              href="#" 
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                activeTab === "following" 
                  ? "bg-primary bg-opacity-10 text-primary" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={() => setActiveTab("following")}
            >
              <Users className="mr-3 h-5 w-5 text-current" />
              Following
            </a>
          </li>
          <li>
            <a 
              href="#" 
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                activeTab === "sync" 
                  ? "bg-primary bg-opacity-10 text-primary" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={() => setActiveTab("sync")}
            >
              <RefreshCw className="mr-3 h-5 w-5 text-current" />
              Sync Status
            </a>
          </li>
          <li>
            <a 
              href="#" 
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                activeTab === "settings" 
                  ? "bg-primary bg-opacity-10 text-primary" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="mr-3 h-5 w-5 text-current" />
              Settings
            </a>
          </li>
        </ul>
      </nav>
      
      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="material-icons text-gray-500">person</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user.username}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <button 
            type="button" 
            className="ml-auto bg-white text-gray-500 hover:text-gray-700"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
