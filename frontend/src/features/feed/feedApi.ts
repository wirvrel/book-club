import { apiSlice } from '../../app/apiSlice';

export interface FeedItem {
  id: string;
  type: 'rating' | 'quote' | 'collection';
  createdAt: string;
  user: {
    id: string;
    username: string;
    profilePicture: string | null;
  };
  data: any;
}

export const feedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFeed: builder.query({
      query: (params) => ({
        url: '/feed',
        params,
      }),
      providesTags: ['Rating', 'Quote', 'Collection'],
    }),
  }),
});

export const { useGetFeedQuery } = feedApi;
