import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/api";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log("Attempting login with:", { email, password });
      const response = await api.post(
        "/api/auth/login",
        {
          email,
          password,
        },
        {
          withCredentials: true, // Gửi cookie
        }
      );
      console.log("Login API response:", response);

      const { accessToken } = response.data;
      if (!accessToken) {
        console.error("Access token missing in response:", response.data);
        throw new Error("accessToken missing in response");
      }

      localStorage.setItem("accessToken", accessToken);
      console.log("Access token stored in localStorage:", {
        accessToken: localStorage.getItem("accessToken"),
      });

      return { email, token: accessToken };
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async ({ email, password, otp }, { rejectWithValue, dispatch }) => {
    try {
      console.log("Verifying OTP with:", { email, password, otp });
      await api.post("/api/auth/verify-otp", {
        email,
        password,
        otp,
      });

      console.log("OTP verified, proceeding to login");
      const loginResponse = await dispatch(
        loginUser({ email, password })
      ).unwrap();
      return loginResponse;
    } catch (error) {
      console.error("Register error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Logging out");
      await api.post(
        "/api/auth/logout",
        {},
        {
          withCredentials: true,
        }
      );

      localStorage.removeItem("accessToken");
      console.log("Access token removed from localStorage");

      return null;
    } catch (error) {
      console.error("Logout error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Thêm action setToken
export const setToken = createAsyncThunk(
  "auth/setToken",
  async (token, { rejectWithValue }) => {
    try {
      if (!token) {
        throw new Error("Token is required");
      }
      localStorage.setItem("accessToken", token);
      console.log("Token set in localStorage:", { accessToken: token });
      return { token };
    } catch (error) {
      console.error("Set token error:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: localStorage.getItem("accessToken") ? { email: null } : null,
    token: localStorage.getItem("accessToken") || null,
    loading: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.token = localStorage.getItem("accessToken") || null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { email: action.payload.email };
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { email: action.payload.email };
        state.token = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.loading = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Xử lý setToken
      .addCase(setToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setToken.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = { email: null }; // Cập nhật user nếu cần email từ token
      })
      .addCase(setToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
