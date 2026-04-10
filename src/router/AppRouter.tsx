import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session } from '@supabase/supabase-js';

// Lazy load components
const Landing = lazy(() => import('../pages/Landing').then(module => ({ default: module.Landing })));
const Admin = lazy(() => import('../pages/Admin').then(module => ({ default: module.Admin })));
const Login = lazy(() => import('../pages/Login').then(module => ({ default: module.Login })));
const SearchResults = lazy(() => import('../pages/SearchResults').then(module => ({ default: module.SearchResults })));
const ProductDetail = lazy(() => import('../pages/ProductDetail').then(module => ({ default: module.ProductDetail })));
const Cart = lazy(() => import('../pages/Cart').then(module => ({ default: module.Cart })));
const Contact = lazy(() => import('../pages/Contact').then(module => ({ default: module.Contact })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

export const AppRouter = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
      } catch (error) {
        console.error('Supabase auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin" 
            element={session ? <Admin /> : <Navigate to="/login" />} 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  );
};
