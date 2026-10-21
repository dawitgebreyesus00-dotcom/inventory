import React, { useEffect } from 'react';
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';

const Root = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else if (user.role === "manager") {
        navigate("/manager-dashboard");
      } else if (user.role === "viewer") {
        navigate("/admin-dashboard"); // Viewers can access admin dashboard with limited permissions
      } else if (user.role === "customer") {
        navigate("/customer");
      } else {
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  return null;
};

export default Root;
