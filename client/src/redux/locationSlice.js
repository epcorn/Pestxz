import { apiSlice } from "./apiSlice";

export const locationSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addLocation: builder.mutation({
      query: (data) => ({
        url: "/api/location/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Location"],
    }),
    allLocations: builder.query({
      query: ({ id }) => ({
        url: `/api/location/client/${id}`,
      }),
      providesTags: ["Location"],
    }),
    getSingleLocation: builder.query({
      query: (id) => ({
        url: `/api/location/${id}`,
      }),
      providesTags: ["Location"],
    }),
    updateLocation: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/location/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Location"],
    }),
    deleteLocation: builder.mutation({
      query: (id) => ({
        url: `/api/location/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Location"],
    }),
    singleLocationDetails: builder.query({
      query: (id) => ({
        url: `/api/location/${id}`,
      }),
      providesTags: ["Location"],
    }),
    qrCounter: builder.mutation({
      query: (id) => ({
        url: `/api/location/qr-count/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Location"],
    }),
    backFillSchedules: builder.query({
      query: () => ({
        url: `/api/location/backfill-schedules`,
      }),
    }),
    makeQrDocx: builder.mutation({
      query: (data) => ({
        url: `/api/location/makeQrDoc`,
        method: "POST",
        body: data,
      }),
    }),
    getUnscheduledReports: builder.query({
      query: (id) => ({
        url: `/api/location/getUnscheduledReports/${id}`,
      }),
      providesTags: ["Location", "unscheduled"],
    }),
    unscheduledReport: builder.mutation({
      query: (data) => ({
        url: `/api/location/unSchedule`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Location","unscheduled"],
    }),
    statusUnschedule: builder.mutation({
      query: (data) => ({
        method: "PATCH",
        url: `/api/location/statusUnschedule/${data.id}`,
        body: data,
      }),
      invalidatesTags: ["Location","unscheduled"],
    }),
  }),
});

export const {
  useAddLocationMutation,
  useAllLocationsQuery,
  useGetSingleLocationQuery,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
  useMakeQrDocxMutation,
  useSingleLocationDetailsQuery,
  useBackFillSchedulesQuery,
  useQrCounterMutation,
  useLazyBackFillSchedulesQuery,
  useUnscheduledReportMutation,
  useGetUnscheduledReportsQuery,
  useStatusUnscheduleMutation,
} = locationSlice;
