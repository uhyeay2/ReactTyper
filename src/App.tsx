import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { selectView } from "@/features/typing/state/typingSlice";
import { Layout } from "@/shared/components/Layout/Layout";
import { TypingTest } from "@/features/typing/components/TypingTest/TypingTest";
import { HomeScreen } from "@/features/home/components/HomeScreen/HomeScreen";
import { LoginScreen } from "@/features/auth/components/LoginScreen/LoginScreen";
import { RegisterScreen } from "@/features/auth/components/RegisterScreen/RegisterScreen";
import { LessonsScreen } from "@/features/lessons/components/LessonsScreen/LessonsScreen";
import { LessonDetailScreen } from "@/features/lessons/components/LessonDetailScreen/LessonDetailScreen";
import { HistoryScreen } from "@/features/history/components/HistoryScreen/HistoryScreen";
import { AdminLessonsScreen } from "@/features/admin/components/AdminLessonsScreen/AdminLessonsScreen";
import { LessonFormScreen } from "@/features/admin/components/LessonFormScreen/LessonFormScreen";
import {
  selectAuthStatus,
  selectIsAdmin,
} from "@/features/auth/state/authSlice";

function HomeOrTest() {
  const view = useAppSelector(selectView);
  return view === "home" ? <HomeScreen /> : <TypingTest />;
}

interface GuardProps {
  children: ReactNode;
}

function RequireAuth({ children }: GuardProps) {
  const authStatus = useAppSelector(selectAuthStatus);
  if (authStatus !== "authenticated") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RequireAdmin({ children }: GuardProps) {
  const authStatus = useAppSelector(selectAuthStatus);
  const isAdmin = useAppSelector(selectIsAdmin);
  if (authStatus !== "authenticated") {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomeOrTest />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/lessons" element={<LessonsScreen />} />
        <Route path="/lessons/:slug" element={<LessonDetailScreen />} />
        <Route
          path="/history"
          element={
            <RequireAuth>
              <HistoryScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/lessons"
          element={
            <RequireAdmin>
              <AdminLessonsScreen />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/lessons/new"
          element={
            <RequireAdmin>
              <LessonFormScreen />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/lessons/:slug"
          element={
            <RequireAdmin>
              <LessonFormScreen />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
