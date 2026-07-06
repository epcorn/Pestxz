import { apiSlice } from "./apiSlice";

export const serviceSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    newComplaint: builder.mutation({
      query: ({ id, form }) => ({
        url: `/api/service/clientComplaint/${id}`,
        method: "POST",
        body: form,
      }),
      invalidatesTags: ["Complaint", "Location"],
    }),
    singleComplaint: builder.query({
      query: (id) => ({
        url: `/api/service/singleComplaint/${id}`,
      }),
      providesTags: ["Complaint"],
      keepUnusedDataFor: 30,
    }),
    updateComplaint: builder.mutation({
      query: ({ id, form }) => ({
        url: `/api/service/singleComplaint/${id}`,
        method: "PUT",
        body: form,
      }),
      invalidatesTags: ["Complaint", "Location", "assign"],
    }),
    allComplaints: builder.query({
      query: ({ search, page, location, client }) => ({
        url: "/api/service/allComplaints",
        params: { search, page, location, client },
      }),
      providesTags: ["Complaint"],
    }),
    regularService: builder.mutation({
      query: ({ id, form }) => ({
        url: `/api/service/regular/${id}`,
        method: "POST",
        body: form,
      }),
      invalidatesTags: ["Location"],
    }),
    assignWork: builder.mutation({
      query: (data) => ({
        method: "PUT",
        url: `/api/service/assign-work`,
        body: data,
      }),
      invalidatesTags: ["assign", "Complaint", "Location"],
    }),
    getAllAssignedWork: builder.query({
      query: () => ({
        url: `/api/service/assign-work`,
      }),
      providesTags: ["Complaint", "Location", "assign"],
    }),
    casualService: builder.mutation({
      query: ({ form }) => ({
        url: `/api/service/casual`,
        method: "POST",
        body: form,
      }),
      invalidatesTags: ["Casual", "Location"],
    }),
    getCasuals: builder.query({
      query: () => ({
        url: `/api/service/casual`,
      }),
      providesTags: ["Casual"],
    }),
    dailyServiceReport: builder.query({
      //new added 08-05-2026
      query: (value) => ({
        url: `/api/service/dailyServiceReport/${value}`,
      }),
    }),
    addProductService: builder.mutation({
      query: (data) => ({
        url: `/api/service/product`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["product", "Location"],
    }),
  }),
});

export const {
  useNewComplaintMutation,
  useSingleComplaintQuery,
  useUpdateComplaintMutation,
  useAllComplaintsQuery,
  useRegularServiceMutation,
  useAssignWorkMutation,
  useCasualServiceMutation,
  useAddProductServiceMutation,
  useGetCasualsQuery,
  useGetAllAssignedWorkQuery,

  useDailyServiceReportQuery, //new added 08-05-2026
} = serviceSlice;
