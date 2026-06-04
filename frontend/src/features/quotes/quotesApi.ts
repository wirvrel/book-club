import { apiSlice } from '../../app/apiSlice';

export const quotesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createQuote: builder.mutation({
      query: (quoteData) => ({
        url: '/quotes',
        method: 'POST',
        body: quoteData,
      }),
      invalidatesTags: (_result, _error, { bookId }) => [
        { type: 'Quote', id: `BOOK_${bookId}` },
      ],
    }),
    deleteQuote: builder.mutation({
      query: (id) => ({
        url: `/quotes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Quote'],
    }),
  }),
});

export const { useCreateQuoteMutation, useDeleteQuoteMutation } = quotesApi;
