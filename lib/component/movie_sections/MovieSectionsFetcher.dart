import 'package:flutter/material.dart';
import '../../services/WatchListService.dart';
import '../../services/MovieService.dart';
import 'MovieHorizontalListSection.dart';

class MovieSectionsFetcher extends StatefulWidget {
  final String title;
  final String type; // "topRated" | "mostFavorite"

  const MovieSectionsFetcher({
    super.key,
    required this.title,
    required this.type,
  });

  @override
  State<MovieSectionsFetcher> createState() => _MovieSectionsFetcherState();
}

class _MovieSectionsFetcherState extends State<MovieSectionsFetcher> {
  final MovieService _movieService = MovieService();
  final WatchListService _watchListService = WatchListService();

  late Future<List<Map<String, dynamic>>> _futureMovies;

  @override
  void initState() {
    super.initState();

    // Gọi API tương ứng theo type
    if (widget.type == "topRated") {
      _futureMovies = _movieService.getTopRatedMovies();
    } else if (widget.type == "mostFavorite") {
      _futureMovies = _watchListService.getMostFavoriteMovies();
    } else {
      _futureMovies = Future.value([]);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _futureMovies,
      builder: (context, snapshot) {
        // Loading
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Padding(
            padding: EdgeInsets.all(16.0),
            child: Center(
              child: CircularProgressIndicator(color: Colors.yellow),
            ),
          );
        }

        // Error or empty
        if (snapshot.hasError || !snapshot.hasData || snapshot.data!.isEmpty) {
          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              widget.type == "topRated"
                  ? "No Top Rated Movies Found"
                  : "No Favorite Movies Found",
              style: const TextStyle(color: Colors.white),
            ),
          );
        }

        // ✅ GIỮ NGUYÊN TẤT CẢ DATA TỪ API
        // Chỉ đảm bảo các field cần thiết tồn tại
        final movies = snapshot.data!.map((m) {
          return {
            // Required fields cho MovieDetailScreen
            'id': m['id'] ?? m['mediaId'] ?? 0,
            'title': m['title'] ?? '',
            'image': m['poster'] ?? m['posterUrl'] ?? m['image'] ?? '',
            'rating': m['rating'] ?? 0.0,
            'releaseDate': m['releaseDate'] ?? '',
            'type': m['type'] ?? m['mediaType'] ?? 'movie',

            // Optional fields - giữ nguyên nếu có
            'overview': m['overview'] ?? m['description'] ?? '',
            'backdropUrl': m['backdropUrl'] ?? m['backdrop'] ?? '',
            'genres': m['genres'] ?? [],
            'actors': m['actors'] ?? m['cast'] ?? [],
            'director': m['director'] ?? '',
            'studio': m['studio'] ?? m['production'] ?? '',
            'status': m['status'] ?? 'Released',
            'trailerUrl': m['trailerUrl'] ?? m['trailer'] ?? '',
            'videoUrl': m['videoUrl'] ?? '',
            'numberOfRatings': m['numberOfRatings'] ?? 0,

            // Giữ toàn bộ data gốc để tránh mất thông tin
            ...m,
          };
        }).toList();

        return MovieHorizontalListSection(
          title: widget.title,
          movies: movies,
        );
      },
    );
  }
}