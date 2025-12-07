import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/api";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
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

      const { accessToken } = response.data;
      if (!accessToken) {
        throw new Error("accessToken missing in response");
      }

      localStorage.setItem("accessToken", accessToken);

      return { email, token: accessToken };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async ({ email, password, otp }, { rejectWithValue, dispatch }) => {
    try {
      await api.post("/api/auth/verify-otp", {
        email,
        password,
        otp,
      });

      const loginResponse = await dispatch(
        loginUser({ email, password })
      ).unwrap();
      return loginResponse;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await api.post(
        "/api/auth/logout",
        {},
        {
          withCredentials: true,
        }
      );

      localStorage.removeItem("accessToken");

      return null;
    } catch (error) {
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
      return { token };
    } catch (error) {
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
