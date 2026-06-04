import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        const isAuthUrl = typeof args === 'string' ? args.includes('auth/') : args.url.includes('auth/');
    
    if (!isAuthUrl) {
      const refreshResult = await baseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions);
      
      if (refreshResult.data) {
        const { accessToken } = (refreshResult.data as any).data;
        localStorage.setItem('accessToken', accessToken);
        result = await baseQuery(args, api, extraOptions);
      } else {
          localStorage.removeItem('accessToken');
      }
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User', 
    'Book', 
    'Author', 
    'Rating', 
    'Quote', 
    'Collection', 
    'Shelf',
    'Proposal',
    'AdminStats',
    'AdminUsers',
    'AdminBooks',
    'AdminProposals',
    'Publisher',
    'Genre',
    'Comment',
  ],
  endpoints: () => ({}),
});

export type { BaseQueryFn, FetchArgs, FetchBaseQueryError };
