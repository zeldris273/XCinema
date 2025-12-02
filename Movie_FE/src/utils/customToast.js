import { toast, Bounce } from "react-toastify";

const customToast = (message, type = "success") => {
    toast[type](message, {
        position: "bottom-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
        pauseOnFocusLoss: false,
        transition: Bounce,
    });
};

export default customToast;
