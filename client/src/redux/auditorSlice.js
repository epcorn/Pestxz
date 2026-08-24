import { apiSlice } from "./apiSlice";

export const auditorSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createAuditReport: builder.mutation({
      query: (data) => ({
        url: `/api/auditor/create`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Audit"],
    }),
    getAuditReport: builder.query({
      query: ({ limit, page }) => ({
        url: `/api/auditor`,
        params: { limit, page },
      }),
      providesTags: ["Audit"],
    }),
  }),
});

export const { useCreateAuditReportMutation, useGetAuditReportQuery } =
  auditorSlice;
