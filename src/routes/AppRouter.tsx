import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Login from '../pages/Login';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import Teachers from '../pages/Teachers';
import TeacherDashboard from '../pages/TeacherDashboard';
import Courses from '../pages/Courses';
import CourseEditor from '../pages/CourseEditor';
import Coupons from '../pages/Coupons';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="teachers/:id/dashboard" element={<TeacherDashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/new" element={<CourseEditor />} />
        <Route path="courses/:id" element={<CourseEditor />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="" element={<Navigate to="dashboard" replace />} />
      </Route>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default AppRouter;

