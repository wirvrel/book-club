
export const getImageUrl = (path: string | null | undefined, type: 'book' | 'author' | 'user' = 'book'): string => {
  if (!path) {

    if (type === 'author' || type === 'user') {
      return `https:
    }
    return `https:
  }


  if (path.startsWith('http')) {
    return path;
  }


  if (path.startsWith('/storage')) {
    return path;
  }


  return `/storage${path.startsWith('/') ? '' : '/'}${path}`;
};
