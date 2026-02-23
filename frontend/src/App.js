import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import PublicRicorsoPage from './pages/PublicRicorsoPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import RicorsoForm from './pages/RicorsoForm';
import RicorsoStats from './pages/RicorsoStats';
import { useEffect } from 'react';

function App() {
  // Remove Emergent badge
  useEffect(() => {
    const removeBadge = () => {
      const badge = document.getElementById('emergent-badge');
      if (badge) {
        badge.remove();
      }
      // Also check for any links to emergent
      const links = document.querySelectorAll('a[href*="emergent"]');
      links.forEach(link => link.remove());
    };
    
    // Try to remove immediately
    removeBadge();
    
    // And also after a delay in case it's injected later
    setTimeout(removeBadge, 1000);
    setTimeout(removeBadge, 2000);
    setTimeout(removeBadge, 3000);
    
    // Set up mutation observer to catch dynamically added badges
    const observer = new MutationObserver(removeBadge);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);

  return (
    <AuthProvider>
      <div className="App">
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ricorso/:ricorsoId" element={<PublicRicorsoPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/ricorso/:id" element={<RicorsoForm />} />
            <Route path="/admin/stats/:ricorsoId" element={<RicorsoStats />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;
