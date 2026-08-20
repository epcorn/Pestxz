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
  }),
});

export const { useCreateAuditReportMutation } = auditorSlice;
