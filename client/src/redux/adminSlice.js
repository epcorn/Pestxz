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
    addProducts: builder.mutation({
      //product add
      query: (data) => ({
        url: `/api/products/product`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Admin", "product"],
    }),
    getProducts: builder.query({
      query: () => ({
        url: `/api/products/product`,
      }),
      providesTags: ["Admin", "product"],
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
      providesTags: ["Complaint", "assign", "Casual"],
    }),
    adminDashboard: builder.query({
      query: ({ id, filter, startDate } = {}) => {
        const params = new URLSearchParams();
        if (filter) params.append("filter", filter);
        if (startDate) params.append("startDate", startDate);

        const queryString = params.toString();
        const baseUrl =
          id && id !== "select"
            ? `/api/admin/adminDashboard/${id}`
            : `/api/admin/adminDashboard`;

        return {
          url: queryString ? `${baseUrl}?${queryString}` : baseUrl,
        };
      },
      providesTags: ["Complaint", "assign", "Casual"],
    }),
    dashboardMonthlyTrend: builder.query({
      query: (id) => ({
        url: id
          ? `/api/admin/dashMonthlytrend/${id}`
          : `/api/admin/dashMonthlytrend`,
      }),
      providesTags: ["Complaint", "Casual"],
    }),
    runnerData: builder.query({
      query: ({ lat, lon }) => ({
        url: `/api/admin/runner`,
        params: { lat, lon },
      }),
    }),
    imgUploader: builder.mutation({
      query: (formData) => ({
        url: `/api/admin/upload`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["product"],
    }),
  }),
});

export const {
  useAddServiceMutation,
  useAllServiceQuery,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useAddProductsMutation,
  useGetProductsQuery,
  useRegisterUserMutation,
  useAllUserQuery,
  useChangePasswordMutation,
  useDeleteUserMutation,
  useClientAdminDashboardQuery,
  useAdminDashboardQuery,
  useDashboardMonthlyTrendQuery,
  useRunnerDataQuery,
  useImgUploaderMutation,
} = adminSlice;
