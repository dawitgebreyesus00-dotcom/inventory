import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoutes = ({ children, requireRole }) => {
  const { user, loading } = useAuth();

  // ✅ Still loading user from localStorage
  if (loading) {
    return <p>Loading...</p>;
  }

  // ✅ Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Logged in but wrong role → unauthorized
  if (requireRole && !requireRole.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Authorized → show page
  return children;
};

export default ProtectedRoutes;

    
