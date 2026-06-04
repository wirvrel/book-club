import { apiSlice } from '../../app/apiSlice';

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (params) => ({
        url: '/users',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }: { id: string }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),
    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),
    getUserShelves: builder.query({
      query: (id) => `/users/${id}/shelves`,
      providesTags: (_result, _error, id) => [{ type: 'Shelf', id: `USER_${id}` }],
    }),
    getUserFollowers: builder.query({
      query: (id) => `/users/${id}/followers`,
    }),
    getUserFollowing: builder.query({
      query: (id) => `/users/${id}/following`,
    }),
    getUserRatings: builder.query({
      query: (id) => `/users/${id}/ratings`,
      providesTags: (_result, _error, id) => [{ type: 'Rating', id: `USER_${id}` }],
    }),
    getUserQuotes: builder.query({
      query: (id) => `/users/${id}/quotes`,
      providesTags: (_result, _error, id) => [{ type: 'Quote', id: `USER_${id}` }],
    }),
    updateProfile: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
    }),
    uploadAvatar: builder.mutation({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/users/${id}/avatar`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
    }),
    followUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}/follow`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'User', id }, 'User'],
    }),
    unfollowUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}/follow`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'User', id }, 'User'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetUserShelvesQuery,
  useGetUserFollowersQuery,
  useGetUserFollowingQuery,
  useGetUserRatingsQuery,
  useGetUserQuotesQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useFollowUserMutation,
  useUnfollowUserMutation,
} = usersApi;
