import { useState, useEffect } from "react";
import { FaLock, FaEnvelope, FaGoogle, FaGithub } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, registerUser, setToken } from "../../store/authSlice";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";
import customToast from "../../utils/customToast";
import { createPortal } from "react-dom";

export default function AuthModal({ show, onClose, initialMode = "login" }) {
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [isForgotPassword, setIsForgotPassword] = useState(initialMode === "forgot");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector((state) => state.auth);

  // ================================
  // 🔥 XỬ LÝ REDIRECT SAU KHI LOGIN BẰNG GOOGLE/GITHUB (CHẠY NGAY KHI COMPONENT MOUNT)
  // ================================
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      // Lưu token
      localStorage.setItem("accessToken", token);
      dispatch(setToken(token));

      // Lấy redirect URL
      const redirect = localStorage.getItem("loginRedirect");

      // Xóa token khỏi URL trước
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      // Redirect
      if (redirect) {
        localStorage.removeItem("loginRedirect");

        // Đợi một chút để dispatch hoàn tất
        setTimeout(() => {
          navigate(redirect, { replace: true });
        }, 100);
      } else {
        // No redirect found, staying on current page
      }

      // Đóng modal nếu đang mở
      if (onClose) {
        onClose();
      }
    }
  }, []); // Chỉ chạy 1 lần khi component mount

  // ================================
  // VALIDATION
  // ================================
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password) => {
    const minLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[\W_]/.test(password);

    return {
      isValid:
        minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialChar,
      errors: {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumber,
        hasSpecialChar,
      },
    };
  };

  const validateOtp = (otp) => /^\d{6}$/.test(otp.trim());

  // Countdown for OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Reset form when modal opens with initial mode
  useEffect(() => {
    if (show) {
      resetForm();
      if (initialMode === "login") {
        setIsLogin(true);
        setIsForgotPassword(false);
      } else if (initialMode === "register") {
        setIsLogin(false);
        setIsForgotPassword(false);
      } else if (initialMode === "forgot") {
        setIsLogin(false);
        setIsForgotPassword(true);
      }
    }
  }, [show, initialMode]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setOtp("");
    setIsOtpSent(false);
    setCountdown(0);
  };

  const switchMode = (mode) => {
    resetForm();
    if (mode === "login") {
      setIsLogin(true);
      setIsForgotPassword(false);
    } else if (mode === "register") {
      setIsLogin(false);
      setIsForgotPassword(false);
    } else if (mode === "forgot") {
      setIsLogin(false);
      setIsForgotPassword(true);
    }
  };

  // ================================
  // SEND OTP
  // ================================
  const handleSendOtp = async () => {
    if (!email || !validateEmail(email)) {
      customToast("Invalid email format!", "warning");
      return;
    }

    if (countdown > 0) {
      customToast(`Please wait ${countdown}s before requesting OTP.`, "info");
      return;
    }

    setOtpLoading(true);

    try {
      const endpoint = isForgotPassword
        ? "/api/auth/forgot-password"
        : "/api/auth/send-otp";

      const res = await api.post(
        endpoint,
        { email },
        { withCredentials: true }
      );

      if (res.status === 200) {
        setIsOtpSent(true);
        setCountdown(60);
        customToast("OTP sent! Check your inbox.", "success");
      }
    } catch (err) {
      customToast(err.response?.data?.message || "Unable to send OTP", "error");
    } finally {
      setOtpLoading(false);
    }
  };

  // ================================
  // SUBMIT - XỬ LÝ REDIRECT
  // ================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !validateEmail(email)) {
      customToast("Invalid email.", "warning");
      return;
    }

    if (!password && !isForgotPassword) {
      customToast("Password required.", "warning");
      return;
    }

    const passVal = validatePassword(password);
    if (!isLogin && !isForgotPassword && !passVal.isValid) {
      const missing = [];
      if (!passVal.errors.minLength) missing.push("6+ chars");
      if (!passVal.errors.hasUpperCase) missing.push("uppercase");
      if (!passVal.errors.hasLowerCase) missing.push("lowercase");
      if (!passVal.errors.hasNumber) missing.push("number");
      if (!passVal.errors.hasSpecialChar) missing.push("special char");

      customToast(`Weak password: ${missing.join(", ")}`, "warning");
      return;
    }

    if ((isForgotPassword || !isLogin) && (!isOtpSent || !validateOtp(otp))) {
      customToast("OTP required or invalid.", "warning");
      return;
    }

    try {
      if (isForgotPassword) {
        await api.post(
          "/api/auth/reset-password",
          { email, otp, password },
          { withCredentials: true }
        );

        customToast("Password reset successfully!", "success");
        switchMode("login");
      } else if (isLogin) {
        // LOGIN - XỬ LÝ REDIRECT
        await dispatch(loginUser({ email, password })).unwrap();

        customToast("Login successful!", "success");

        // Đóng modal trước
        onClose();

        // Lấy redirect URL và navigate
        const redirect = localStorage.getItem("loginRedirect");
        if (redirect) {
          localStorage.removeItem("loginRedirect");
          setTimeout(() => {
            navigate(redirect, { replace: true });
          }, 100);
        }
      } else {
        // REGISTER - XỬ LÝ REDIRECT
        await dispatch(registerUser({ email, password, otp })).unwrap();

        customToast("Account created successfully!", "success");

        // Đóng modal trước
        onClose();

        // Lấy redirect URL và navigate
        const redirect = localStorage.getItem("loginRedirect");
        if (redirect) {
          localStorage.removeItem("loginRedirect");
          setTimeout(() => {
            navigate(redirect, { replace: true });
          }, 100);
        }
      }
    } catch (err) {
      customToast(
        err.response?.data?.message || err.message || "Something went wrong.",
        "error"
      );
    }
  };

  // ================================
  // SOCIAL LOGIN - LƯU REDIRECT URL
  // ================================
  const handleGoogleLogin = () => {
    const currentPath = window.location.pathname + window.location.search;
    localStorage.setItem("loginRedirect", currentPath);

    window.location.href = `${
      import.meta.env.VITE_BACKEND_API_URL
    }/api/auth/login/google`;
  };

  const handleGitHubLogin = () => {
    const currentPath = window.location.pathname + window.location.search;
    localStorage.setItem("loginRedirect", currentPath);

    window.location.href = `${
      import.meta.env.VITE_BACKEND_API_URL
    }/api/auth/login/github`;
  };

  // ================================
  // RENDER
  // ================================
  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-[#222] p-8 rounded-2xl shadow-2xl w-full max-w-md z-[10000] animate-fadeIn">
        <button
          className="absolute top-3 right-3 text-gray-300 hover:text-white text-xl"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-center mb-6 text-white">
          {isForgotPassword
            ? "Reset Password"
            : isLogin
            ? "Sign In"
            : "Sign Up"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* EMAIL */}
          <div className="mb-4">
            <label className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
              <FaEnvelope className="text-gray-400" />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-transparent text-white outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </label>
          </div>

          {/* PASSWORD */}
          {!isForgotPassword && (
            <div className="mb-4">
              <label className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
                <FaLock className="text-gray-400" />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full bg-transparent text-white outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </label>
            </div>
          )}

          {/* OTP */}
          {(isForgotPassword || !isLogin) && (
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="OTP (6 digits)"
                  className="flex-1 bg-gray-700 text-white p-3 rounded-lg outline-none"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={
                    otpLoading ||
                    countdown > 0 ||
                    !email ||
                    !validateEmail(email)
                  }
                  className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading
                    ? "Sending..."
                    : countdown > 0
                    ? `${countdown}s`
                    : "Send OTP"}
                </button>
              </div>
            </div>
          )}

          {/* NEW PASSWORD */}
          {isForgotPassword && (
            <div className="mb-4">
              <label className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
                <FaLock className="text-gray-400" />
                <input
                  type="password"
                  placeholder="New Password"
                  className="w-full bg-transparent text-white outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </label>
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-3 rounded-full font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Processing..."
              : isForgotPassword
              ? "Reset Password"
              : isLogin
              ? "Login"
              : "Register"}
          </button>

          {error && (
            <p className="text-red-400 text-center text-sm mt-3">{error}</p>
          )}
        </form>

        {/* SOCIAL LOGIN */}
        {isLogin && !isForgotPassword && (
          <div className="mt-6">
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#222] text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGoogleLogin}
                className="flex-1 bg-red-600 hover:bg-red-700 p-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FaGoogle className="text-white" />
                <span className="text-white font-semibold">Google</span>
              </button>
              <button
                onClick={handleGitHubLogin}
                className="flex-1 bg-gray-800 hover:bg-gray-900 p-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FaGithub className="text-white" />
                <span className="text-white font-semibold">GitHub</span>
              </button>
            </div>
          </div>
        )}

        {/* SWITCH LINKS */}
        <div className="text-center mt-6 text-gray-300 text-sm">
          {isForgotPassword ? (
            <button
              className="text-yellow-400 hover:text-yellow-500 underline transition-colors"
              onClick={() => switchMode("login")}
            >
              Back to Login
            </button>
          ) : isLogin ? (
            <div className="space-y-2">
              <div>
                Don't have an account?{" "}
                <button
                  className="text-yellow-400 hover:text-yellow-500 underline transition-colors"
                  onClick={() => switchMode("register")}
                >
                  Sign Up
                </button>
              </div>
              <div>
                <button
                  className="text-yellow-400 hover:text-yellow-500 underline transition-colors"
                  onClick={() => switchMode("forgot")}
                >
                  Forgot Password?
                </button>
              </div>
            </div>
          ) : (
            <div>
              Already have an account?{" "}
              <button
                className="text-yellow-400 hover:text-yellow-500 underline transition-colors"
                onClick={() => switchMode("login")}
              >
                Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
