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

    // ✅ Gọi API tương ứng theo type
    if (widget.type == "topRated") {
      _futureMovies = _movieService.getTopRatedMovies();
    } else if (widget.type == "mostFavorite") {
      _futureMovies = _watchListService.getMostFavoriteMovies();
    } else {
      _futureMovies = Future.value([]); // fallback
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

        // ✅ Chuẩn hóa dữ liệu để khớp component hiển thị
        final movies = snapshot.data!;
        final formattedMovies = movies.map((m) {
          return {
            'title': m['title'] ?? '',
            'image': m['poster'] ?? m['posterUrl'] ?? '',
            'rating': m['rating'] ?? 'N/A',
            'releaseDate': m['releaseDate'] ?? '',
          };
        }).toList();

        // ✅ Dùng component chung
        return MovieHorizontalListSection(
          title: widget.title,
          movies: formattedMovies,
        );
      },
    );
  }
}
