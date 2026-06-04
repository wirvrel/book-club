import { apiSlice } from '../../app/apiSlice';

export const shelvesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getShelves: builder.query({
      query: () => '/shelves',
      providesTags: ['Shelf'],
    }),
    createShelf: builder.mutation({
      query: (shelf) => ({
        url: '/shelves',
        method: 'POST',
        body: shelf,
      }),
      invalidatesTags: ['Shelf'],
    }),
    addBookToShelf: builder.mutation({
      query: ({ shelfId, bookId, ...data }) => ({
        url: `/shelves/${shelfId}/books`,
        method: 'POST',
        body: { bookId, ...data },
      }),
      invalidatesTags: (_result, _error, { shelfId }) => [
        { type: 'Shelf', id: shelfId },
        { type: 'Shelf', id: 'LIST' },
      ],
    }),
    updateBookProgress: builder.mutation({
      query: ({ shelfId, bookId, ...data }) => ({
        url: `/shelves/${shelfId}/books/${bookId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { shelfId }) => [{ type: 'Shelf', id: shelfId }],
    }),
  }),
});

export const {
  useGetShelvesQuery,
  useCreateShelfMutation,
  useAddBookToShelfMutation,
  useUpdateBookProgressMutation,
} = shelvesApi;
