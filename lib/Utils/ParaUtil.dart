class ParaUtil{
  static String username = "";
  static int bottomBarIndex = 0;
  static String apiUrl = "http://10.0.2.2:5116";

  //auth
  static String register = '/api/auth/register';
  static String verifyOtp = '/api/auth/verify-otp';
  static String login = '/api/auth/login';
  static String forgotPassword = '/api/auth/forgot-password';
  static String resetPassword = '/api/auth/reset-password';

  //profile
  static String getProfile = '/api/auth/profile';
  static String updateProfile = '/api/auth/profile';


  //home screen
  static String fetchNewReleases = '/api/new-releases';
  static String trendingMovie = 'api/trending/all';
  static String recommendedMovies = '';
  static String topRatedMovies = '/api/movies/top-rated-by-votes';
  static String mostFavoriteMovies = '/api/watchlist/most-favorited';


  //explore
  static String getAllTvSeries = '/api/tvseries';
  static String getAllMovies = '/api/movies';

  //genres
  static String getAllGenres = '/api/genres/dropdown';
  static String getMediaByGenre(int genreId) => '/api/genres/$genreId/media';

  //search
  static String search = '/api/search/all';


  //film
  static String seasonsResponse(int id) => '/api/tvseries/$id/seasons';
  static String episodesResponse(int seasonId) => '/api/tvseries/seasons/$seasonId/episodes';
  static String getMovieDetail(int id, String slug) => '/api/movies/$id/$slug';
  static String getTvSeriesDetail(int id, String slug) => '/api/tvseries/$id/$slug';
  static String getSeasons(int seriesId) => '/api/tvseries/$seriesId/seasons';
  static String getEpisodes(int seasonId ) => '/api/tvseries/seasons/$seasonId/episodes';

  //comment
  static String getComments = '/api/comments';
  static String addComment = '/api/comments';
  static String updateComment(int commentId) => '/api/comments/$commentId';
  static String deleteComment(int commentId) => '/api/comments/$commentId';

  //watch list
  static String getWatchList = '/api/watchlist';
  static String addWatchList = '/api/watchlist/add';
  static String removeWatchList = '/api/watchlist/remove';

  //rating
  static String submitRating = '/api/ratings';

  //admin
  static String createMovie = '/api/movies/create';
  static String updateMovie(int id) => '/api/movies/$id';
  static String deleteMovie(int id) => '/api/movies/$id';
}