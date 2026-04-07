import { HashRouter as BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Layout/Navbar";
import BottomNav from "./components/Layout/BottomNav";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Dashboard from "./pages/Dashboard";
import LogWorkout from "./pages/LogWorkout";
import Friends from "./pages/Friends";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Awards from "./pages/Awards";
import Crews from "./pages/Crews";
import CrewDetail from "./pages/CrewDetail";

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { currentUser } = useAuth();
  return !currentUser ? children : <Navigate to="/dashboard" />;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/log" element={<PrivateRoute><LogWorkout /></PrivateRoute>} />
        <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />
        <Route path="/feed" element={<PrivateRoute><Feed /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/awards" element={<PrivateRoute><Awards /></PrivateRoute>} />
        <Route path="/crews" element={<PrivateRoute><Crews /></PrivateRoute>} />
        <Route path="/crews/:crewId" element={<PrivateRoute><CrewDetail /></PrivateRoute>} />
      </Routes>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
