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
      invalidatesTags: ["Complaint", "Location"],
    }),
    allComplaints: builder.query({
      query: ({ search, page, location }) => ({
        url: "/api/service/allComplaints",
        params: { search, page, location },
      }),
      providesTags: ["Complaint"],
    }),
    regularService: builder.mutation({
      query: ({ id, form }) => ({
        url: `/api/service/regular/${id}`,
        method: "POST",
        body: form,
      }),
    }),
  }),
});

export const {
  useNewComplaintMutation,
  useSingleComplaintQuery,
  useUpdateComplaintMutation,
  useAllComplaintsQuery,
  useRegularServiceMutation,
} = serviceSlice;
