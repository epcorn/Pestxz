import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null,
  isModalOpen: {
    newClient: false,
    delete: { id: null, name: null },
    location: false,
    user: false,
    complaint: false,
  },
  locationId: "",
};

const helperSlice = createSlice({
  name: "helper",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    removeCredentials: (state) => {
      state.user = null;
      localStorage.clear();
      state.locationId = "";
    },
    toggleModal: (state, { payload }) => {
      state.isModalOpen[payload.name] = payload.status;
    },
    setLocation: (state, { payload }) => {
      state.locationId = payload.id;
    },
  },
});

export const { setCredentials, removeCredentials, toggleModal, setLocation } =
  helperSlice.actions;

export default helperSlice.reducer;
