import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import ExplorePage from "../pages/ExplorePage";
import DetailsPage from "../pages/DetailsPage";
import SearchPage from "../pages/SearchPage";
import AuthPage from "../pages/AuthPage";
import Watchlist from "../pages/Watchlist";
import MoviePlayer from "../pages/MoviePlayer";
import AdminDashboard from "../pages/AdminDashboard";
import NotFoundPage from "../pages/NotFoundPage";
import ProfilePage from "../pages/ProfilePage";
import GenrePage from "../pages/GenrePage";
import CreateWatchParty from "../pages/WatchParty/CreateWatchParty";
import WatchPartyHome from "../pages/WatchParty/WatchPartyHome";
import WatchPartyRoom from "../pages/WatchParty/WatchPartyRoom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "movies",
        element: <ExplorePage />,
      },
      {
        path: "tv",
        element: <ExplorePage />,
      },
      {
        path: "movies/:id/:title",
        element: <DetailsPage />,
      },
      {
        path: "tvseries/:id/:title",
        element: <DetailsPage />,
      },
      {
        path: "movies/:id/:title/watch",
        element: <MoviePlayer />,
      },
      {
        path: "tvseries/:id/:title/episode/:episodeNumber/watch",
        element: <MoviePlayer />,
      },
      {
        path: "watch-party",
        children: [
          { index: true, element: <WatchPartyHome /> },
          { path: "create", element: <CreateWatchParty /> },
          { path: ":roomId", element: <WatchPartyRoom /> },
        ],
      },
      {
        path: "search",
        element: <SearchPage />,
      },
      {
        path: "auth",
        element: <AuthPage />,
      },
      {
        path: "user/watchlist",
        element: <Watchlist />,
      },
      {
        path: "admin-dashboard",
        element: <AdminDashboard />,
      },
      {
        path: "/genres/:id",
        element: <GenrePage />,
      },
      {
        path: "user/profile",
        element: <ProfilePage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default router;
