import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import axios from "axios";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { ToastContainer } from "react-toastify";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  //<React.StrictMode>
  <Provider store={store}>
    <RouterProvider router={router} />
    <ToastContainer newestOnTop pauseOnFocusLoss={false} />
  </Provider>
  //</React.StrictMode>
);
