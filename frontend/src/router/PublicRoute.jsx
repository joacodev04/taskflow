import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/admin.html" replace />;
  }

  return children;
}

export default PublicRoute;
