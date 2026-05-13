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
    assignLocation: builder.mutation({
      query: (data) => ({
        url: `/api/location/assign`,
        method:"POST",
        body: data, 
      }),
      invalidatesTags: ["location"],
    }),
  }),
});

export const {
  useAddLocationMutation,
  useAllLocationsQuery,
  useGetSingleLocationQuery,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
  useSingleLocationDetailsQuery,
  useAssignLocationMutation,
} = locationSlice;
