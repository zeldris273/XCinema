const selectStyles = {
    control: (provided) => ({
        ...provided,
        backgroundColor: "#1f2937", // bg-gray-800
        borderColor: "#374151",     // border-gray-700
        color: "white",
    }),
    input: (provided) => ({
        ...provided,
        color: "white",
    }),
    singleValue: (provided) => ({
        ...provided,
        color: "white",
    }),
    menu: (provided) => ({
        ...provided,
        backgroundColor: "#1f2937", // dropdown bg
        color: "white",
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? "#4b5563" : "#1f2937", // hover: gray-600
        color: "white",
    }),
    placeholder: (provided) => ({
        ...provided,
        color: "#9ca3af", // text-gray-400
    }),
};

export default selectStyles;
