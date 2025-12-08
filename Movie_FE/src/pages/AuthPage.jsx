import { useState, useEffect } from "react";
import { FaLock, FaEnvelope, FaGoogle, FaGithub } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  loginUser,
  registerUser,
  logoutUser,
  setToken,
} from "../store/authSlice";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/api";
import customSwal from "../utils/customSwal";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  // Validation functions
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

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get("token");
    const returnUrl = urlParams.get("returnUrl");

    if (token) {
      localStorage.setItem("accessToken", token);
      dispatch(setToken(token));

      // Redirect về trang trước đó hoặc trang chủ
      const redirectTo =
        returnUrl || localStorage.getItem("loginRedirect") || "/";
      localStorage.removeItem("loginRedirect"); // Xóa loginRedirect sau khi sử dụng
      navigate(redirectTo);
    } else {
      // Nếu chưa có loginRedirect trong localStorage và không phải trang auth, lưu lại
      const savedRedirect = localStorage.getItem("loginRedirect");
      if (!savedRedirect && location.state?.from) {
        localStorage.setItem("loginRedirect", location.state.from);
      }
    }
  }, [location, navigate, dispatch]);

  // Reset form
  const resetForm = () => {
    setEmail("");
    setPassword("");
    setOtp("");
    setIsOtpSent(false);
    setCountdown(0);
  };

  // Switch between modes
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

  // Handle OTP send
  const handleSendOtp = async () => {
    if (!email || !validateEmail(email)) {
      customSwal(
        "Invalid Email",
        "Please enter a valid email address.",
        "warning"
      );
      return;
    }

    if (countdown > 0) {
      customSwal(
        "Please Wait",
        `Please wait ${countdown} seconds before requesting a new OTP.`,
        "info"
      );
      return;
    }

    setOtpLoading(true);

    try {
      const endpoint = isForgotPassword
        ? "/api/auth/forgot-password"
        : "/api/auth/send-otp";
      const response = await api.post(
        endpoint,
        { email },
        { withCredentials: true }
      );

      if (response.status === 200) {
        setIsOtpSent(true);
        setCountdown(60);
        customSwal(
          "OTP Sent",
          "OTP has been sent to your email. Please check your inbox.",
          "success"
        );
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        "Failed to send OTP";
      customSwal("Failed to Send OTP", errorMessage, "error");
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !validateEmail(email)) {
      customSwal(
        "Invalid Email",
        "Please enter a valid email address.",
        "warning"
      );
      return;
    }

    if (!password) {
      customSwal("Password Required", "Please enter your password.", "warning");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid && !isLogin) {
      const missing = [];
      if (!passwordValidation.errors.minLength)
        missing.push("at least 6 characters");
      if (!passwordValidation.errors.hasUpperCase)
        missing.push("one uppercase letter");
      if (!passwordValidation.errors.hasLowerCase)
        missing.push("one lowercase letter");
      if (!passwordValidation.errors.hasNumber) missing.push("one number");
      if (!passwordValidation.errors.hasSpecialChar)
        missing.push("one special character");

      customSwal(
        "Weak Password",
        `Password must contain: ${missing.join(", ")}.`,
        "warning"
      );
      return;
    }

    if (isForgotPassword || !isLogin) {
      if (!isOtpSent) {
        customSwal("OTP Required", "Please send OTP first.", "warning");
        return;
      }
      if (!validateOtp(otp)) {
        customSwal(
          "Invalid OTP",
          "Please enter a valid 6-digit OTP.",
          "warning"
        );
        return;
      }
    }

    try {
      if (isForgotPassword) {
        const response = await api.post(
          "/api/auth/reset-password",
          {
            email: email.trim(),
            otp: otp.trim(),
            password,
          },
          { withCredentials: true }
        );

        if (response.status === 200) {
          customSwal(
            "Success",
            "Password has been reset successfully. Please login again.",
            "success"
          );
          switchMode("login");
        }
      } else if (isLogin) {
        await dispatch(loginUser({ email: email.trim(), password })).unwrap();

        // Redirect về trang trước đó hoặc trang chủ
        const redirectTo = localStorage.getItem("loginRedirect") || "/";
        localStorage.removeItem("loginRedirect");
        navigate(redirectTo);
      } else {
        await dispatch(
          registerUser({ email: email.trim(), password, otp: otp.trim() })
        ).unwrap();
        customSwal(
          "Registration Successful",
          "Your account has been created successfully.",
          "success"
        );
        resetForm();

        // Redirect về trang trước đó hoặc trang chủ
        const redirectTo = localStorage.getItem("loginRedirect") || "/";
        localStorage.removeItem("loginRedirect");
        navigate(redirectTo);
      }
    } catch (err) {
      let errorMessage = "An unknown error occurred";
      if (err.response?.data?.message) errorMessage = err.response.data.message;
      else if (err.response?.data)
        errorMessage =
          typeof err.response.data === "string"
            ? err.response.data
            : "Authentication failed";
      else if (err.message) errorMessage = err.message;
      else if (typeof err === "string") errorMessage = err;

      const titles = {
        forgot: "Password Reset Failed",
        login: "Login Failed",
        register: "Registration Failed",
      };
      const currentMode = isForgotPassword
        ? "forgot"
        : isLogin
        ? "login"
        : "register";
      customSwal(titles[currentMode], errorMessage, "error");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      resetForm();
      navigate("/auth");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Logout failed";
      customSwal("Logout Failed", errorMessage, "error");
    }
  };

  // Social login
  const handleGoogleLogin = () => {
    // Lưu URL trước đó (nếu có) hoặc trang chủ
    const returnUrl = localStorage.getItem("loginRedirect") || "/";
    window.location.href = `${
      import.meta.env.VITE_BACKEND_API_URL
    }/api/auth/login/google?returnUrl=${encodeURIComponent(returnUrl)}`;
  };
  const handleGitHubLogin = () => {
    // Lưu URL trước đó (nếu có) hoặc trang chủ
    const returnUrl = localStorage.getItem("loginRedirect") || "/";
    window.location.href = `${
      import.meta.env.VITE_BACKEND_API_URL
    }/api/auth/login/github?returnUrl=${encodeURIComponent(returnUrl)}`;
  };

  // UI helper
  const getButtonText = () => {
    if (loading) return "Processing...";
    if (isForgotPassword) return "Reset Password";
    if (isLogin) return "Login";
    return "Register";
  };

  const isFormValid = () => {
    if (!email || !validateEmail(email) || !password) return false;
    if ((isForgotPassword || !isLogin) && (!isOtpSent || !validateOtp(otp)))
      return false;
    return true;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a] text-white">
      <div className="bg-[#222222] p-8 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isForgotPassword
            ? "Reset Password"
            : isLogin
            ? "Sign In"
            : "Sign Up"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <FaEnvelope className="text-gray-400" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                required
                disabled={loading}
              />
            </label>
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <FaLock className="text-gray-400" />
              <input
                type="password"
                placeholder={isForgotPassword ? "New Password" : "Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                required
                disabled={loading}
              />
            </label>
          </div>

          {/* OTP Field for Registration and Forgot Password */}
          {(isForgotPassword || !isLogin) && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1">
                  <label className="flex items-center gap-2">
                    <FaLock className="text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);
                        setOtp(value);
                      }}
                      className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                      required
                      disabled={loading}
                      maxLength={6}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={
                    otpLoading ||
                    countdown > 0 ||
                    !email ||
                    !validateEmail(email)
                  }
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                >
                  {otpLoading
                    ? "Sending..."
                    : countdown > 0
                    ? `${countdown}s`
                    : "Send OTP"}
                </button>
              </div>

              {isOtpSent && (
                <p className="text-green-400 text-sm">
                  ✓ OTP sent to your email. Please check your inbox.
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className="w-full bg-white text-gray-900 hover:bg-gray-200 py-2 rounded-full disabled:bg-gray-500 disabled:cursor-not-allowed transition-all font-semibold"
          >
            {getButtonText()}
          </button>

          {/* Error Display */}
          {error && (
            <p className="text-red-400 text-center mt-3 text-sm">{error}</p>
          )}
        </form>

        {/* Social Login - Only show for login */}
        {isLogin && !isForgotPassword && (
          <div className="mt-6">
            <div className="relative mb-4">
              <hr className="border-gray-600" />
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#222222] px-3 text-gray-400 text-sm">
                Or continue with
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGoogleLogin}
                className="flex-1 flex items-center justify-center bg-red-600 text-white py-2 rounded-full hover:bg-red-700 transition-all"
                disabled={loading}
              >
                <FaGoogle className="mr-2" /> Google
              </button>
              <button
                onClick={handleGitHubLogin}
                className="flex-1 flex items-center justify-center bg-gray-800 text-white py-2 rounded-full hover:bg-gray-900 transition-all"
                disabled={loading}
              >
                <FaGithub className="mr-2" /> GitHub
              </button>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="text-center mt-6 text-gray-400 text-sm">
          {isForgotPassword ? (
            <p>
              Remember your password?{" "}
              <button
                type="button"
                className="text-yellow-400 hover:text-yellow-300 underline"
                onClick={() => switchMode("login")}
              >
                Back to Sign In
              </button>
            </p>
          ) : isLogin ? (
            <div className="space-y-2">
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  className="text-yellow-400 hover:text-yellow-300 underline"
                  onClick={() => switchMode("register")}
                >
                  Sign Up
                </button>
              </p>
              <p>
                <button
                  type="button"
                  className="text-yellow-400 hover:text-yellow-300 underline"
                  onClick={() => switchMode("forgot")}
                >
                  Forgot Password?
                </button>
              </p>
            </div>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="text-yellow-400 hover:text-yellow-300 underline"
                onClick={() => switchMode("login")}
              >
                Sign In
              </button>
            </p>
          )}
        </div>

        {/* Logout Button - Only show if logged in */}
        {isLogin &&
          !isForgotPassword &&
          localStorage.getItem("accessToken") && (
            <div className="text-center mt-4">
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 underline text-sm"
                disabled={loading}
              >
                Logout
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
