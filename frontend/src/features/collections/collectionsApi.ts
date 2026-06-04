import { apiSlice } from '../../app/apiSlice';

export const collectionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCollections: builder.query({
      query: (params) => ({
        url: '/collections',
        params,
      }),
      providesTags: ['Collection'],
    }),
    getCollectionById: builder.query({
      query: (id) => `/collections/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Collection', id }],
    }),
    getUserCollections: builder.query({
      query: (userId) => `/collections/user/${userId}`,
      providesTags: (_result, _error, userId) => [{ type: 'Collection', id: `USER_${userId}` }],
    }),
    getMyCollections: builder.query({
      query: () => '/collections/me',
      providesTags: ['Collection'],
    }),
    createCollection: builder.mutation({
      query: (data) => ({
        url: '/collections',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Collection'],
    }),
    updateCollection: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/collections/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Collection', id }, 'Collection'],
    }),
    deleteCollection: builder.mutation({
      query: (id) => ({
        url: `/collections/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Collection'],
    }),
    addBookToCollection: builder.mutation({
      query: ({ collectionId, bookId }) => ({
        url: `/collections/${collectionId}/books`,
        method: 'POST',
        body: { bookId },
      }),
      invalidatesTags: (_result, _error, { collectionId }) => [{ type: 'Collection', id: collectionId }],
    }),
    removeBookFromCollection: builder.mutation({
      query: ({ collectionId, bookId }) => ({
        url: `/collections/${collectionId}/books/${bookId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { collectionId }) => [{ type: 'Collection', id: collectionId }],
    }),
    reorderCollection: builder.mutation({
      query: ({ id, bookIds }) => ({
        url: `/collections/${id}/reorder`,
        method: 'POST',
        body: { bookIds },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Collection', id }],
    }),
  }),
});

export const {
  useGetCollectionsQuery,
  useGetCollectionByIdQuery,
  useGetUserCollectionsQuery,
  useGetMyCollectionsQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useAddBookToCollectionMutation,
  useRemoveBookFromCollectionMutation,
  useReorderCollectionMutation,
} = collectionsApi;
