import { apiSlice } from '../../app/apiSlice';

export const proposalsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    proposeBook: builder.mutation({
      query: (data) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value instanceof File ? value : String(value));
          }
        });
        return {
          url: '/books/propose',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['User'],
    }),
    proposeAuthor: builder.mutation({
      query: (data) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value instanceof File ? value : String(value));
          }
        });
        return {
          url: '/authors/propose',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['User'],
    }),
    getMyProposals: builder.query({
      query: () => '/proposals/me',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useProposeBookMutation,
  useProposeAuthorMutation,
  useGetMyProposalsQuery,
} = proposalsApi;
