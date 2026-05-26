import { apiSlice } from "./apiSlice";

export const clientSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    registerClient: builder.mutation({
      query: (data) => ({
        url: "/api/client/register",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Client"],
    }),
    allClients: builder.query({
      query: () => ({
        url: "/api/client",
      }),
      providesTags: ["Client"],
      keepUnusedDataFor: 60,
    }),
    deleteClient: builder.mutation({
      query: (id) => ({
        url: `/api/client/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Client"],
    }),
    getSingleClient: builder.query({
      query: (id) => ({
        url: `/api/client/${id}`,
      }),
      invalidatesTags: ["Client"],
    }),
    updateClient: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/client/update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Client"],
    }),
  }),
});

export const {
  useRegisterClientMutation,
  useAllClientsQuery,
  useGetSingleClientQuery,
  useDeleteClientMutation,
  useUpdateClientMutation,
} = clientSlice;
