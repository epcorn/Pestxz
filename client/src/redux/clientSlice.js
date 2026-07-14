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
      query: (params = {}) => {
        const { limit, page } = params;
        const queryString = limit && page ? `?limit=${limit}&page=${page}` : "";
        return {
          url: `/api/client${queryString}`,
        };
      },
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
