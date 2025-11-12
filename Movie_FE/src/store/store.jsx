import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import movieReducer from "./movieSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    movie: movieReducer,
  },
});
