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
    getSingleUser: builder.query({
      query: (id) => ({
        url: `/api/user/singleUser/${id}`,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/api/user/logout",
        method: "POST",
      }),
    }),
    getClientUsers: builder.query({
      query: (id) => ({
        url: `/api/user/clientuser/${id}`,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetSingleUserQuery,
  useGetClientUsersQuery,
  useLogoutMutation,
} = userSlice;
