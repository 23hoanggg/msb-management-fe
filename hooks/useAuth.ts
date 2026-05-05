/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useAuth.ts
import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/api";

export const useAuth = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const login = async (values: { username: string; password: string }) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const response = await api.post("/auth/login", values);
      const tokenToSave = response.data.access_token;

      if (!tokenToSave) {
        setErrorMsg("Backend vẫn chưa trả về token!");
        setIsLoading(false);
        return false;
      }

      // Lưu trữ thông tin
      localStorage.setItem("user", JSON.stringify(response.data.user));
      Cookies.set("token", tokenToSave, { expires: 1 }); // Hạn 1 ngày

      // Đăng nhập thành công, chuyển hướng về Dashboard
      router.push("/");
      return true;
    } catch (error: any) {
      console.error(error);
      setErrorMsg(
        error.response?.data?.message || "Tài khoản hoặc mật khẩu không đúng!",
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return { isLoading, errorMsg, login, logout };
};
