import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setToken } from "../store/authSlice";
import customToast from "../utils/customToast";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = searchParams.get("token");
    const returnUrl = searchParams.get("returnUrl");

    if (token) {
      // Lưu token vào Redux store
      dispatch(setToken(token));
      
      // Lưu token vào localStorage (sử dụng "accessToken" để nhất quán)
      localStorage.setItem("accessToken", token);
      
      customToast("Login successful!", "success");

      // Redirect về trang trước đó hoặc home
      const redirectPath = returnUrl || localStorage.getItem("loginRedirect") || "/";
      localStorage.removeItem("loginRedirect");
      
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1000);
    } else {
      customToast("Authentication failed. Please try again.", "error");
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500 mx-auto mb-4"></div>
        <p className="text-white text-xl">Completing login...</p>
      </div>
    </div>
  );
}
