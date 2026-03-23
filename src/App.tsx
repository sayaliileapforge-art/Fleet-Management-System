import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './components/auth/Login';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { ResetPassword } from './components/auth/ResetPassword';
import { Dashboard } from './components/Dashboard';
import { VehiclesList } from './components/vehicles/VehiclesList';
import { VehicleDetail } from './components/vehicles/VehicleDetail';
import { TripsList } from './components/trips/TripsList';
import { TripDetail } from './components/trips/TripDetail';
import { ExpensesList } from './components/expenses/ExpensesList';
import { RevenuesList } from './components/revenues/RevenuesList';
import { ProfitLoss } from './components/analytics/ProfitLoss';
import { MaintenanceList } from './components/maintenance/MaintenanceList';
import { FuelManagement } from './components/fuel/FuelManagement';
import { DriversList } from './components/drivers/DriversList';
import { RoutesList } from './components/routes/RoutesList';
import { CustomersList } from './components/customers/CustomersList';
import { ContractsList } from './components/contracts/ContractsList';
import { LoadsList } from './components/loads/LoadsList';
import { DocumentsList } from './components/documents/DocumentsList';
import { Settings } from './components/settings/Settings';
import { PricingComparison } from './components/pricing/PricingComparison';
import { authService } from './services/auth';

export type Page = 
  | 'login'
  | 'forgot-password'
  | 'reset-password'
  | 'dashboard'
  | 'vehicles'
  | 'vehicle-detail'
  | 'trips'
  | 'trip-detail'
  | 'expenses'
  | 'revenues'
  | 'profit-loss'
  | 'maintenance'
  | 'fuel'
  | 'drivers'
  | 'routes'
  | 'customers'
  | 'contracts'
  | 'loads'
  | 'documents'
  | 'pricing-comparison'
  | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check Supabase auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 [AUTH] Checking authentication state...');
      const user = await authService.getCurrentUser();
      
      if (user) {
        console.log('✅ [AUTH] User is authenticated:', user.email);
        setIsAuthenticated(true);
        const storedPage = localStorage.getItem('currentPage') as Page | null;
        if (storedPage && storedPage !== 'login') {
          setCurrentPage(storedPage);
        } else {
          setCurrentPage('dashboard');
        }
      } else {
        console.log('❌ [AUTH] User is not authenticated');
        setIsAuthenticated(false);
        setCurrentPage('login');
      }
      
      setIsLoading(false);
    };

    checkAuth();

    // Listen to auth state changes
    const subscription = authService.onAuthStateChange((user) => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentPage('dashboard');
      } else {
        setIsAuthenticated(false);
        setCurrentPage('login');
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Persist current page to localStorage
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('currentPage', currentPage);
    } else {
      localStorage.removeItem('currentPage');
    }
  }, [isAuthenticated, currentPage]);

  const handleLogin = () => {
    console.log('✅ [AUTH] User logged in');
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    console.log('🔓 [AUTH] User logging out');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentPage');
    await authService.signOut();
    setIsAuthenticated(false);
    setCurrentPage('login');
  };

  const navigateTo = (page: Page, id?: string) => {
    if (page === 'vehicle-detail' && id) {
      setSelectedVehicleId(id);
    }
    if (page === 'trip-detail' && id) {
      setSelectedTripId(id);
    }
    setCurrentPage(page);
  };

  // Show loading state while restoring auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
            <div className="animate-spin w-8 h-8 border-4 border-white border-t-blue-200 rounded-full"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Auth pages (no layout)
  if (!isAuthenticated) {
    if (currentPage === 'forgot-password') {
      return <ForgotPassword onBack={() => setCurrentPage('login')} />;
    }
    if (currentPage === 'reset-password') {
      return <ResetPassword onBack={() => setCurrentPage('login')} />;
    }
    return <Login onLogin={handleLogin} onForgotPassword={() => setCurrentPage('forgot-password')} />;
  }

  // Main app with layout
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={navigateTo} />;
      case 'vehicles':
        return <VehiclesList onViewDetail={(id) => navigateTo('vehicle-detail', id)} />;
      case 'vehicle-detail':
        return <VehicleDetail vehicleId={selectedVehicleId!} onBack={() => setCurrentPage('vehicles')} />;
      case 'trips':
        return <TripsList onViewDetail={(id) => navigateTo('trip-detail', id)} />;
      case 'trip-detail':
        return <TripDetail tripId={selectedTripId!} onBack={() => setCurrentPage('trips')} />;
      case 'expenses':
        return <ExpensesList />;
      case 'revenues':
        return <RevenuesList />;
      case 'profit-loss':
        return <ProfitLoss />;
      case 'maintenance':
        return <MaintenanceList />;
      case 'fuel':
        return <FuelManagement />;
      case 'drivers':
        return <DriversList />;
      case 'routes':
        return <RoutesList />;
      case 'customers':
        return <CustomersList />;
      case 'contracts':
        return <ContractsList />;
      case 'loads':
        return <LoadsList />;
      case 'documents':
        return <DocumentsList />;
      case 'pricing-comparison':
        return <PricingComparison />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={navigateTo} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={navigateTo} onLogout={handleLogout}>
      {renderPage()}
    </Layout>
  );
}

export default App;
