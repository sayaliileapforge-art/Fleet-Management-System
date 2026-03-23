import { Bell, LogOut, Menu, X, LayoutDashboard, Truck, Map, Receipt, DollarSign, TrendingUp, Wrench, Fuel, Users, Route, Building2, FileText, Package, FolderOpen, BarChart3, Settings } from 'lucide-react';
import { useState } from 'react';
import type { Page } from '../App';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'vehicles', label: 'Vehicles', icon: Truck },
  { id: 'trips', label: 'Trips', icon: Map },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'revenues', label: 'Revenues & Billing', icon: DollarSign },
  { id: 'profit-loss', label: 'Profit & Loss', icon: TrendingUp },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'fuel', label: 'Fuel Management', icon: Fuel },
  { id: 'drivers', label: 'Drivers & Staff', icon: Users },
  { id: 'routes', label: 'Routes & Dispatching', icon: Route },
  { id: 'customers', label: 'Customers & Vendors', icon: Building2 },
  { id: 'contracts', label: 'Contracts & Projects', icon: FileText },
  { id: 'loads', label: 'Loads & Shipments', icon: Package },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'pricing-comparison', label: 'Pricing & Competition', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Layout({ children, currentPage, onNavigate, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications] = useState([
    'License expiry alert for Vehicle TRK-001',
    'Pending invoice payment from ABC Corp',
    'Fuel threshold reached for Vehicle TRK-003',
  ]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden`}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">FleetPro</h1>
          <p className="text-sm text-gray-500 mt-1">Fleet Management System</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || 
              (currentPage === 'vehicle-detail' && item.id === 'vehicles') ||
              (currentPage === 'trip-detail' && item.id === 'trips');
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as Page)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative group">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Notification Dropdown */}
              <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif, index) => (
                    <div key={index} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                      <p className="text-sm text-gray-700">{notif}</p>
                      <p className="text-xs text-gray-500 mt-1">Just now</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">admin@fleetpro.com</p>
              </div>
              <button
                onClick={onLogout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
