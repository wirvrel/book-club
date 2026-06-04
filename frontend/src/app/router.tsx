import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '../components/layout/RootLayout';
import { PageTransition } from '../components/layout/PageTransition';
import { HomePage, homeLoader } from '../pages/Home';
import { CatalogPage } from '../pages/Catalog';
import { BookDetailsPage, bookDetailsLoader } from '../pages/BookDetails';
import { AuthorsPage, authorsLoader } from '../pages/Authors';
import { AuthorDetailsPage, authorDetailsLoader } from '../pages/AuthorDetails';
import { CollectionsPage, collectionsLoader } from '../pages/Collections';
import { CollectionDetailsPage, collectionDetailsLoader } from '../pages/CollectionDetails';
import { SearchPage, searchLoader } from '../pages/Search';
import { ProposeContentPage } from '../pages/ProposeContent';
import { ShelvesPage, shelvesLoader } from '../pages/Shelves';
import { UserProfilePage, userProfileLoader } from '../pages/UserProfile';
import { EditProfilePage } from '../pages/EditProfile';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { loginAction, registerAction } from '../features/auth/authActions';
import { AdminGuard } from '../features/admin/AdminGuard';
import { AdminLayout } from '../features/admin/AdminLayout';
import { AdminDashboard } from '../features/admin/pages/AdminDashboard';
import { AdminProposals } from '../features/admin/pages/AdminProposals';
import { AdminUsers } from '../features/admin/pages/AdminUsers';
import { AdminBooks } from '../features/admin/pages/AdminBooks';
import { AdminAuthors } from '../features/admin/pages/AdminAuthors';
import { AdminPublishers } from '../features/admin/pages/AdminPublishers';
import { AdminGenres } from '../features/admin/pages/AdminGenres';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <PageTransition><HomePage /></PageTransition>,
        loader: homeLoader,
      },
      {
        path: 'books',
        element: <PageTransition><CatalogPage /></PageTransition>,
      },
      {
        path: 'books/:id',
        element: <PageTransition><BookDetailsPage /></PageTransition>,
        loader: bookDetailsLoader,
      },
      {
        path: 'authors',
        element: <PageTransition><AuthorsPage /></PageTransition>,
        loader: authorsLoader,
      },
      {
        path: 'authors/:id',
        element: <PageTransition><AuthorDetailsPage /></PageTransition>,
        loader: authorDetailsLoader,
      },
      {
        path: 'collections',
        element: <PageTransition><CollectionsPage /></PageTransition>,
        loader: collectionsLoader,
      },
      {
        path: 'collections/:id',
        element: <PageTransition><CollectionDetailsPage /></PageTransition>,
        loader: collectionDetailsLoader,
      },
      {
        path: 'search',
        element: <PageTransition><SearchPage /></PageTransition>,
        loader: searchLoader,
      },
      {
        path: 'propose',
        element: <PageTransition><ProposeContentPage /></PageTransition>,
      },
      {
        path: 'shelves',
        element: <PageTransition><ShelvesPage /></PageTransition>,
        loader: shelvesLoader,
      },
      {
        path: 'profile',
        element: <PageTransition><UserProfilePage /></PageTransition>,
        loader: userProfileLoader,
      },
      {
        path: 'users/:id',
        element: <PageTransition><UserProfilePage /></PageTransition>,
        loader: userProfileLoader,
      },
      {
        path: 'profile/edit',
        element: <PageTransition><EditProfilePage /></PageTransition>,
      },
      {
        path: 'login',
        element: <PageTransition><LoginPage /></PageTransition>,
        action: loginAction,
      },
      {
        path: 'register',
        element: <PageTransition><RegisterPage /></PageTransition>,
        action: registerAction,
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <AdminDashboard />,
          },
          {
            path: 'proposals',
            element: <AdminProposals />,
          },
          {
            path: 'users',
            element: <AdminUsers />,
          },
          {
            path: 'books',
            element: <AdminBooks />,
          },
          {
            path: 'authors',
            element: <AdminAuthors />,
          },
          {
            path: 'publishers',
            element: <AdminPublishers />,
          },
          {
            path: 'genres',
            element: <AdminGenres />,
          },
        ],
      },
    ],
  },
]);
