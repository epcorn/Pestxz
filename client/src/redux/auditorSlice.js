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
    generateXLSX: builder.query({
      query: (id) => ({
        url: `/api/auditor/createExcel/${id}`,
      }),
    }),
    generatePPTX: builder.query({
      query: (id) => ({
        url: `/api/auditor/createPPTX/${id}`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useCreateAuditReportMutation,
  useGetAuditReportQuery,
  useLazyGenerateXLSXQuery,
  useLazyGeneratePPTXQuery,
} = auditorSlice;
