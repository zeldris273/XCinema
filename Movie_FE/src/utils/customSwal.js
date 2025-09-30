import Swal from "sweetalert2";

const customSwal = (title, text, icon) => {
    return Swal.fire({
        title,
        text,
        icon,
        background: "#1f2937",
        color: "#fff",
        confirmButtonColor: "#facc15",
    });
};

export default customSwal;
