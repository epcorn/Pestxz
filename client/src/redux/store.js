import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";
import helperSlice from "./helperSlice";
import { setupListeners } from "@reduxjs/toolkit/query";

// const actionLogger = (store) => (next) => (action) => {
//   if (action.type.includes("fulfilled") || action.type.includes("helper")) {
//     console.log("👉 Action Type:", action.type);
//   }
//   return next(action);
// };

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    helper: helperSlice,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: { warnAfter: 150 } }).concat(
      apiSlice.middleware,
      // actionLogger,
    ),
  devTools: true,
});

setupListeners(store.dispatch);
