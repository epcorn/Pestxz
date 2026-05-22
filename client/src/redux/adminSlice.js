import { apiSlice } from "./apiSlice";

export const adminSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addService: builder.mutation({
      query: (data) => ({
        url: "/api/admin/service",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Admin"],
    }),

    allService: builder.query({
      query: () => ({
        url: "/api/location/allServices",
      }),
      providesTags: ["Admin"],
    }),
    updateService: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/admin/singleService/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Admin"],
    }),
    deleteService: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/admin/singleService/${id}`,
        method: "DELETE",
        body: data,
      }),
      invalidatesTags: ["Admin"],
    }),
    registerUser: builder.mutation({
      query: (data) => ({
        url: `/api/admin/user`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    allUser: builder.query({
      query: () => ({
        url: "/api/admin/user",
      }),
      providesTags: ["User"],
    }),
    changePassword: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/admin/singleUser/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/api/admin/singleUser/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
    clientAdminDashboard: builder.query({
      query: () => ({
        url: `/api/admin/clientAdminDashboard`,
      }),
    }),
    adminDashboard: builder.query({
      query: (id) => ({
        url: id
          ? `/api/admin/adminDashboard/${id}`
          : `/api/admin/adminDashboard`,
      }),
    }),
    newClientAdminDashboard: builder.query({
      query: () => ({
        url: `/api/admin/newClientAdminDashboard`,
      }),
    }),
    addFrequency: builder.mutation({
      query: (freq) => ({
        method: "POST",
        url: `/api/admin/freq`,
        body: freq,
      }),
    }),
    getFrequency: builder.query({
      query: () => ({
        url: `/api/admin/freq`,
      }),
    }),
    removeFrequency: builder.mutation({
      query: (id) => ({
        method: "DELETE",
        url: `/api/admin/freq/${id}`,
      }),
    }),
  }),
});

export const {
  useAddServiceMutation,
  useAllServiceQuery,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useRegisterUserMutation,
  useAllUserQuery,
  useChangePasswordMutation,
  useDeleteUserMutation,
  useClientAdminDashboardQuery,
  useAdminDashboardQuery,
  useNewClientAdminDashboardQuery,
  useGetFrequencyQuery,
  useAddFrequencyMutation,
  useRemoveFrequencyMutation,
} = adminSlice;
