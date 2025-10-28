import 'package:flutter/material.dart';
import '../../utils/FormatDate.dart';
import '../../screens/MovieDetail.dart';
import '../../services/MovieService.dart';
import '../../services/TvSeriesService.dart';

class MovieHorizontalListSection extends StatelessWidget {
  final String title;
  final List<Map<String, dynamic>> movies;

  const MovieHorizontalListSection({
    super.key,
    required this.title,
    required this.movies,
  });

  // ✅ Fetch full detail trước khi navigate
  Future<void> _navigateToDetail(BuildContext context, Map<String, dynamic> movie) async {
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(color: Colors.yellow),
      ),
    );

    try {
      final movieService = MovieService();
      final tvService = TvSeriesService();
      final movieType = movie['type'] ?? movie['mediaType'] ?? 'movie';
      final movieId = movie['id'] ?? movie['mediaId'];
      final movieTitle = movie['title'] ?? '';

      Map<String, dynamic>? detailData;

      // Gọi API detail tương ứng
      if (movieType == 'tv' || movieType == 'tvseries') {
        detailData = await tvService.getTvSeriesDetail(movieId, movieTitle);
      } else {
        detailData = await movieService.getMovieDetail(movieId, movieTitle);
      }

      // Dismiss loading
      if (context.mounted) {
        Navigator.pop(context);
      }

      if (detailData != null && context.mounted) {
        // ✅ Merge data cũ với data mới (ưu tiên data mới)
        final fullMovieData = {
          ...movie, // Data cũ từ list
          ...detailData, // Data mới từ detail API
          'id': movieId,
          'type': movieType,
        };

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => MovieDetailScreen(movie: fullMovieData),
          ),
        );
      } else if (context.mounted) {
        // Show error nếu không lấy được detail
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to load movie details'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      print('❌ Error fetching detail: $e');
      if (context.mounted) {
        Navigator.pop(context); // Dismiss loading
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error loading movie details'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ===== Section Header =====
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 20,
                decoration: BoxDecoration(
                  color: Colors.yellow,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),

        // ===== Movie List =====
        SizedBox(
          height: 280,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            itemCount: movies.length,
            itemBuilder: (context, index) {
              final movie = movies[index];
              return GestureDetector(
                onTap: () => _navigateToDetail(context, movie),
                child: Container(
                  margin: const EdgeInsets.only(right: 12.0),
                  width: 160,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ===== Poster Image =====
                      Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.4),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Stack(
                          children: [
                            // Main poster image
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(
                                movie['image'] ?? movie['poster'] ?? movie['posterUrl'] ?? '',
                                width: 160,
                                height: 220,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => Container(
                                  width: 160,
                                  height: 220,
                                  decoration: BoxDecoration(
                                    color: Colors.grey[900],
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(
                                    Icons.broken_image,
                                    color: Colors.white54,
                                    size: 40,
                                  ),
                                ),
                              ),
                            ),

                            // Gradient overlay at bottom
                            Positioned.fill(
                              child: Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  gradient: LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: [
                                      Colors.transparent,
                                      Colors.black.withOpacity(0.6),
                                    ],
                                    stops: const [0.6, 1.0],
                                  ),
                                ),
                              ),
                            ),

                            // Rating badge
                            Positioned(
                              top: 8,
                              right: 8,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.75),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: Colors.yellow.withOpacity(0.3),
                                    width: 1,
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.star, color: Colors.yellow, size: 12),
                                    const SizedBox(width: 3),
                                    Text(
                                      movie['rating']?.toString() ?? 'N/A',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),

                            // Play icon overlay
                            Positioned.fill(
                              child: Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(
                                  child: Container(
                                    width: 45,
                                    height: 45,
                                    decoration: BoxDecoration(
                                      color: Colors.black.withOpacity(0.6),
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: Colors.white.withOpacity(0.3),
                                        width: 2,
                                      ),
                                    ),
                                    child: const Icon(
                                      Icons.play_arrow_rounded,
                                      color: Colors.white,
                                      size: 28,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 8),

                      // ===== Movie Info =====
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Title
                            Text(
                              movie['title'] ?? '',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                height: 1.2,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),

                            const SizedBox(height: 4),

                            // Release date
                            Row(
                              children: [
                                Icon(
                                  Icons.calendar_today,
                                  color: Colors.grey[600],
                                  size: 11,
                                ),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    formatDate(movie['releaseDate']) ?? 'Unknown',
                                    style: TextStyle(
                                      color: Colors.grey[400],
                                      fontSize: 11,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}