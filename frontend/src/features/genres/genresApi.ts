import { apiSlice } from '../../app/apiSlice';

export const genresApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGenres: builder.query({
      query: (params) => ({
        url: '/genres',
        params,
      }),
      providesTags: ['Book'],
    }),
    getGenreHierarchy: builder.query({
      query: () => '/genres/hierarchy',
    }),
  }),
});

export const { useGetGenresQuery, useGetGenreHierarchyQuery } = genresApi;
