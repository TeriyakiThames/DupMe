"use client";

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth';

const PrivateRoutes = ({ to } : { to: string }) => {
  const { isAuthenticated } = useAuth();

return (
    isAuthenticated ? <Outlet/> : <Navigate to={to}/>
  )
}

export default PrivateRoutes;