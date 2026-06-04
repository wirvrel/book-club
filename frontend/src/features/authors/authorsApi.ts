import { apiSlice } from '../../app/apiSlice';

export const authorsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAuthors: builder.query({
      query: (params) => ({
        url: '/authors',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }: { id: string }) => ({ type: 'Author' as const, id })),
              { type: 'Author', id: 'LIST' },
            ]
          : [{ type: 'Author', id: 'LIST' }],
    }),
    getAuthorById: builder.query({
      query: (id) => `/authors/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Author', id }],
    }),
    getAuthorBooks: builder.query({
      query: ({ id, ...params }) => ({
        url: `/authors/${id}/books`,
        params,
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'Book', id: `AUTHOR_${id}` }],
    }),
  }),
});

export const {
  useGetAuthorsQuery,
  useGetAuthorByIdQuery,
  useGetAuthorBooksQuery,
} = authorsApi;
