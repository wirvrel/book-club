export const commonSchemas = {
    successResponse: (dataSchema: any) => ({
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: dataSchema,
      meta: {
        type: 'object',
        nullable: true,
        properties: {
          total: { type: 'number' },
          page: { type: 'number' },
          limit: { type: 'number' },
          totalPages: { type: 'number' },
        },
      },
    },
  }),

    errorResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'object', nullable: true },
        },
      },
    },
  },

    paginationQuery: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      search: { type: 'string' },
    },
  },

    idParam: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
  },

    userObject: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      username: { type: 'string' },
      email: { type: 'string' },
      role: { type: 'string' },
      profilePicture: { type: 'string', nullable: true },
      bio: { type: 'string', nullable: true },
      isPublic: { type: 'boolean' },
      birthday: { type: 'string', nullable: true },
      gender: { type: 'string', nullable: true },
      location: { type: 'string', nullable: true },
      socialMediaLinks: { type: 'object', nullable: true },
      followerCount: { type: 'number' },
      followingCount: { type: 'number' },
      isFollowing: { type: 'boolean', nullable: true },
      createdAt: { type: 'string' },
    },
  },

    bookObject: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string', nullable: true },
      isbn: { type: 'string', nullable: true },
      coverImage: { type: 'string', nullable: true },
      publishedYear: { type: 'integer', nullable: true },
      pageCount: { type: 'integer', nullable: true },
      language: { type: 'string', nullable: true },
      averageRating: { type: 'number', nullable: true },
      ratingsCount: { type: 'integer', nullable: true },
      createdAt: { type: 'string' },
      authors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
      genres: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    },
  },

    authorObject: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      bio: { type: 'string', nullable: true },
      birthDate: { type: 'string', nullable: true },
      deathDate: { type: 'string', nullable: true },
      birthPlace: { type: 'string', nullable: true },
      nationality: { type: 'string', nullable: true },
      typeOfWork: { type: 'string', nullable: true },
      profilePicture: { type: 'string', nullable: true },
      website: { type: 'string', nullable: true },
      funFacts: { type: 'array', items: { type: 'string' }, nullable: true },
      createdAt: { type: 'string' },
    },
  },

    publisherObject: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string', nullable: true },
      website: { type: 'string', nullable: true },
      createdAt: { type: 'string' },
    },
  },

    genreObject: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string', nullable: true },
      createdAt: { type: 'string' },
    },
  },

    ratingObject: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      userId: { type: 'string' },
      bookId: { type: 'string' },
      rating: { type: 'number', minimum: 1, maximum: 5 },
      review: { type: 'string', nullable: true },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
          profilePicture: { type: 'string', nullable: true },
        },
      },
      book: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          coverImage: { type: 'string', nullable: true },
          averageRating: { type: 'number', nullable: true },
        },
      },
      createdAt: { type: 'string' },
      updatedAt: { type: 'string' },
    },
  },

    quoteObject: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      userId: { type: 'string' },
      bookId: { type: 'string' },
      text: { type: 'string' },
      pageNumber: { type: 'integer', nullable: true },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
          profilePicture: { type: 'string', nullable: true },
        },
      },
      book: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          coverImage: { type: 'string', nullable: true },
        },
      },
      createdAt: { type: 'string' },
    },
  },

    collectionObject: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      userId: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string', nullable: true },
      coverImage: { type: 'string', nullable: true },
      isPublic: { type: 'boolean' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
        },
      },
      createdAt: { type: 'string' },
      updatedAt: { type: 'string' },
    },
  },

    commentObject: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      userId: { type: 'string' },
      content: { type: 'string' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
          profilePicture: { type: 'string', nullable: true },
        },
      },
      createdAt: { type: 'string' },
      updatedAt: { type: 'string' },
    },
  },
};
