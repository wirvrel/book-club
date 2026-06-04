import { apiSlice } from '../../app/apiSlice';

export const booksApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBooks: builder.query({
      query: (params) => ({
        url: '/books',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }: { id: string }) => ({ type: 'Book' as const, id })),
              { type: 'Book', id: 'LIST' },
            ]
          : [{ type: 'Book', id: 'LIST' }],
    }),
    getBookById: builder.query({
      query: (id) => `/books/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Book', id }],
    }),
    getBookRatings: builder.query({
      query: ({ id, ...params }) => ({
        url: `/books/${id}/ratings`,
        params,
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'Rating', id: `BOOK_${id}` }],
    }),
    getBookQuotes: builder.query({
      query: ({ id, ...params }) => ({
        url: `/books/${id}/quotes`,
        params,
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'Quote', id: `BOOK_${id}` }],
    }),
  }),
});

export const {
  useGetBooksQuery,
  useGetBookByIdQuery,
  useGetBookRatingsQuery,
  useGetBookQuotesQuery,
} = booksApi;
