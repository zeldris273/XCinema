import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    selectedMovie: null,
};

const movieSlice = createSlice({
    name: "movie",
    initialState,
    reducers: {
        setSelectedMovie: (state, action) => {
            state.selectedMovie = action.payload;
        },
        setSelectedMovie: (state, action) => {
            state.selectedMovie = action.payload;
            localStorage.setItem("selectedMovie", JSON.stringify(action.payload))
        },
        clearSelectedMovie: (state) => {
            state.selectedMovie = null;
        },
    },
});

export const { setSelectedMovie, clearSelectedMovie } = movieSlice.actions;
export default movieSlice.reducer;
