import { apiSlice } from '../../app/apiSlice'

export interface ProposalFilters {
    page: number
    limit: number
    status?: string
    type?: 'book' | 'author'
    sortOrder?: 'asc' | 'desc'
}

export interface UserFilters {
    page: number
    limit: number
    search?: string
    role?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface BookFilters {
    page: number
    limit: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface AuthorFilters {
    page: number
    limit: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface PublisherFilters {
    page: number
    limit: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface GenreFilters {
    page: number
    limit: number
    search?: string
    parentId?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface CreateBookInput {
    title: string
    description?: string
    plot?: string
    pageCount?: number
    languages?: string[]
    ageRestriction?: string
    isBestseller?: boolean
    isbn?: string
    authorIds?: string[]
    genreIds?: string[]
    publisherId?: string
}

export interface CreateAuthorInput {
    name: string
    bio?: string
    birthDate?: string
    birthPlace?: string
    nationality?: string
    typeOfWork?: string
    website?: string
}

export interface CreatePublisherInput {
    name: string
    description?: string
    foundedYear?: number
    website?: string
    country?: string
    city?: string
}

export interface CreateGenreInput {
    name: string
    description?: string
    parentId?: string
}

export interface UpdateUserInput {
    username?: string
    email?: string
    role?: string
    isPublic?: boolean
    bio?: string
    location?: string
}

export const adminApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAdminDashboard: builder.query({
            query: () => '/admin/dashboard',
        }),
        getDashboardStats: builder.query({
            query: () => '/admin/dashboard',
            transformResponse: (response: any) => response.data,
        }),
        getRecentProposals: builder.query({
            query: () => '/admin/dashboard/proposals',
            transformResponse: (response: any) => response.data,
            providesTags: ['Proposal'],
        }),
        getProposals: builder.query({
            query: (params) => ({
                url: '/admin/proposals',
                params,
            }),
            providesTags: ['Proposal'],
        }),
        approveProposal: builder.mutation({
          query: ({ id, ...data }) => ({
            url: `/admin/proposals/${id}/approve`,
            method: 'PATCH',
            body: data,
          }),
          invalidatesTags: ['Proposal', 'Book', 'Author'],
        }),

        rejectProposal: builder.mutation({
            query: ({ id, rejectionReason }) => ({
                url: `/admin/proposals/${id}/reject`,
                method: 'PATCH',
                body: { rejectionReason },
            }),
            invalidatesTags: ['Proposal'],
        }),
        getAllUsers: builder.query({
            query: (params) => ({
                url: '/admin/users',
                params,
            }),
            providesTags: ['User'],
        }),
        updateUserRole: builder.mutation({
            query: ({ id, role }) => ({
                url: `/admin/users/${id}/role`,
                method: 'PATCH',
                body: { role },
            }),
            invalidatesTags: ['User'],
        }),
        updateUser: builder.mutation({
            query: ({ id, data }) => ({
                url: `/admin/users/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['User'],
        }),
        banUser: builder.mutation({
            query: ({ id, banned }) => ({
                url: `/admin/users/${id}/ban`,
                method: 'PATCH',
                body: { banned },
            }),
            invalidatesTags: ['User'],
        }),
        deleteUser: builder.mutation({
            query: (id) => ({
                url: `/admin/users/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['User'],
        }),
        getAllBooks: builder.query({
            query: (params) => ({
                url: '/books',
                params,
            }),
            providesTags: ['Book'],
        }),
        createBook: builder.mutation({
            query: (data) => ({
                url: '/books',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Book'],
        }),
        updateBook: builder.mutation({
            query: ({ id, data }) => ({
                url: `/books/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Book'],
        }),
        deleteBook: builder.mutation({
            query: (id) => ({
                url: `/books/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Book'],
        }),
        uploadBookCover: builder.mutation({
            query: ({ id, file }: { id: string; file: File }) => {
                const formData = new FormData();
                formData.append('file', file);
                return {
                    url: `/books/${id}/cover`,
                    method: 'POST',
                    body: formData,
                };
            },
            invalidatesTags: ['Book'],
        }),
        getAllAuthors: builder.query({
            query: (params) => ({
                url: '/authors',
                params,
            }),
            providesTags: ['Author'],
        }),
        createAuthor: builder.mutation({
            query: (data) => ({
                url: '/authors',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Author'],
        }),
        updateAuthor: builder.mutation({
            query: ({ id, data }) => ({
                url: `/authors/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Author'],
        }),
        deleteAuthor: builder.mutation({
            query: (id) => ({
                url: `/authors/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Author'],
        }),
        getAllPublishers: builder.query({
            query: (params) => ({
                url: '/publishers',
                params,
            }),
            providesTags: ['Publisher'],
        }),
        getPublisherById: builder.query({
            query: (id) => `/publishers/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Publisher', id }],
        }),
        createPublisher: builder.mutation({
            query: (data) => ({
                url: '/publishers',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Publisher'],
        }),
        updatePublisher: builder.mutation({
            query: ({ id, data }) => ({
                url: `/publishers/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Publisher'],
        }),
        deletePublisher: builder.mutation({
            query: (id) => ({
                url: `/publishers/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Publisher'],
        }),
        getAllGenres: builder.query({
            query: (params) => ({
                url: '/genres',
                params,
            }),
            providesTags: ['Genre'],
        }),
        getGenreHierarchy: builder.query({
            query: () => '/genres/hierarchy',
            providesTags: ['Genre'],
        }),
        getGenreById: builder.query({
            query: (id) => `/genres/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Genre', id }],
        }),
        createGenre: builder.mutation({
            query: (data) => ({
                url: '/genres',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Genre'],
        }),
        updateGenre: builder.mutation({
            query: ({ id, data }) => ({
                url: `/genres/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Genre'],
        }),
        deleteGenre: builder.mutation({
            query: (id) => ({
                url: `/genres/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Genre'],
        }),
    }),
})

export const {
    useGetAdminDashboardQuery,
    useGetDashboardStatsQuery,
    useGetRecentProposalsQuery,
    useGetProposalsQuery,
    useApproveProposalMutation,
    useRejectProposalMutation,
    useGetAllUsersQuery,
    useUpdateUserRoleMutation,
    useUpdateUserMutation,
    useBanUserMutation,
    useDeleteUserMutation,
    useGetAllBooksQuery,
    useCreateBookMutation,
    useUpdateBookMutation,
    useDeleteBookMutation,
    useUploadBookCoverMutation,
    useGetAllAuthorsQuery,
    useCreateAuthorMutation,
    useUpdateAuthorMutation,
    useDeleteAuthorMutation,
    useGetAllPublishersQuery,
    useGetPublisherByIdQuery,
    useCreatePublisherMutation,
    useUpdatePublisherMutation,
    useDeletePublisherMutation,
    useGetAllGenresQuery,
    useGetGenreHierarchyQuery,
    useGetGenreByIdQuery,
    useCreateGenreMutation,
    useUpdateGenreMutation,
    useDeleteGenreMutation,
} = adminApi
