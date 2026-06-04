import { apiSlice } from '../../app/apiSlice';

export const commentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getComments: builder.query({
      query: ({ itemId, itemType }) => ({
        url: `/comments/item/${itemId}`,
        params: { itemType },
      }),
      providesTags: (_result, _error, { itemId, itemType }) => {
        const tagType = itemType === 'rating' ? 'Rating' : 
                        itemType === 'quote' ? 'Quote' : 'Collection';
        return [
          { type: tagType as any, id: `COMMENTS_${itemId}` },
          { type: 'Comment', id: 'LIST' }
        ];
      },
    }),
    createComment: builder.mutation({
      query: (data) => ({
        url: '/comments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { commentableId, commentableType }) => {
        const tagType = commentableType === 'rating' ? 'Rating' : 
                        commentableType === 'quote' ? 'Quote' : 'Collection';
        return [
          { type: tagType as any, id: `COMMENTS_${commentableId}` },
          { type: 'Comment', id: 'LIST' }
        ];
      },
    }),
  }),
});

export const { useGetCommentsQuery, useCreateCommentMutation } = commentsApi;
