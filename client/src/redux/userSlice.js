import { apiSlice } from "./apiSlice";

export const userSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: "/api/user/login",
        method: "POST",
        body: data,
      }),
    }),
    rights: builder.mutation({
      query: (data) => ({
        url: "/api/user/rights",
        method: "POST",
        body: data,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/api/user/logout",
        method: "POST",
      }),
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation,useRightsMutation } = userSlice;
