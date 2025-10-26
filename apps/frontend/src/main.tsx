import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './providers/authProvider.tsx';
import App from '@/App.tsx'
import Login from '@/pages/login.tsx';
import Home from '@/pages/home.tsx';
import PrivateRoutes from '@/components/routes/privateRoutes.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
   <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PrivateRoutes to="/login" />}>
            <Route path="/main" element={<Home />} />
          </Route>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
   </AuthProvider>
  </StrictMode>,
)
