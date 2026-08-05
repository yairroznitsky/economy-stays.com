import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return <Navigate to={{ pathname: "/", search: location.search }} replace />;
};

export default NotFound;
