import { useEffect } from "react";
import { useAppDispatch } from "@/app/hooks";
import { fetchMe } from "../../state/authSlice";

/**
 * Restores the authenticated session on application start by calling the
 * backend's /auth/me endpoint, which resolves the user from the httpOnly cookie.
 * Renders nothing.
 */
export function AuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(fetchMe());
  }, [dispatch]);

  return null;
}
