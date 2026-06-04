import { apiSlice } from '../../app/apiSlice';

export const likesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    toggleLike: builder.mutation({
      query: ({ id, type }) => ({
        url: '/likes',
        method: 'POST',
        body: { likeableId: id, likeableType: type },
      }),
      invalidatesTags: (_result, _error, { id, type }) => {
        const tagType = type === 'rating' ? 'Rating' : 
                        type === 'quote' ? 'Quote' : 
                        type === 'collection' ? 'Collection' : 'Comment';
        return [{ type: tagType as any, id }, tagType as any];
      },
    }),
    removeLike: builder.mutation({
      query: ({ id, type }) => ({
        url: '/likes',
        method: 'DELETE',
        body: { likeableId: id, likeableType: type },
      }),
      invalidatesTags: (_result, _error, { id, type }) => {
        const tagType = type === 'rating' ? 'Rating' : 
                        type === 'quote' ? 'Quote' : 
                        type === 'collection' ? 'Collection' : 'Comment';
        return [{ type: tagType as any, id }, tagType as any];
      },
    }),
  }),
});

export const { useToggleLikeMutation, useRemoveLikeMutation } = likesApi;
