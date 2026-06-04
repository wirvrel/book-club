import { apiSlice } from '../../app/apiSlice';

export const ratingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createRating: builder.mutation({
      query: (ratingData) => ({
        url: '/ratings',
        method: 'POST',
        body: ratingData,
      }),
      invalidatesTags: (_result, _error, { bookId }) => [
        { type: 'Book', id: bookId },
        { type: 'Rating', id: `BOOK_${bookId}` },
      ],
    }),
    deleteRating: builder.mutation({
      query: (id) => ({
        url: `/ratings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Rating', 'Book'],
    }),
  }),
});

export const { useCreateRatingMutation, useDeleteRatingMutation } = ratingsApi;
