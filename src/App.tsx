import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/components/RequireAuth";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { BoardPage } from "@/pages/BoardPage";
import { JobsPage } from "@/pages/JobsPage";
import { AdminPage } from "@/pages/AdminPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/board" element={<BoardPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth adminOnly>
              <AdminPage />
            </RequireAuth>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/board" replace />} />
    </Routes>
  );
}
