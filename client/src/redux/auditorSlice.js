import { apiSlice } from "./apiSlice";

export const auditorSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createAuditReport: builder.mutation({
      query: (data) => ({
        url: `/api/auditor/create`,
        method: "POST",
        body: data,
      }),
    }),
    getAuditReport: builder.query({
      query: () => ({
        url: `/api/auditor`,
      }),
    }),
  }),
});

export const { useCreateAuditReportMutation, useGetAuditReportQuery } =
  auditorSlice;
