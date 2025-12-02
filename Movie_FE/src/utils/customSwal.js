import Swal from "sweetalert2";

const customSwal = (
    title, 
    text, 
    icon, 
    showCancelButton = false, 
    confirmButtonText = "OK", 
    cancelButtonText = "Cancel"
) => {
    return Swal.fire({
        title,
        text,
        icon,
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: icon === "warning" ? "#ef4444" : "#facc15",
        cancelButtonColor: "#6b7280",
        showCancelButton,
        confirmButtonText,
        cancelButtonText,
    });
};

export default customSwal;
