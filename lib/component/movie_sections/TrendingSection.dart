import 'package:flutter/material.dart';
import '../../../screens/MovieDetail.dart';
import '../../services/TrendingService.dart';
import '../../services/TvSeriesService.dart';
import '../../services/MovieService.dart';
import '../../utils/FormatDate.dart';

class TrendingSection extends StatefulWidget {
  final String title;
  const TrendingSection({super.key, required this.title});

  @override
  State<TrendingSection> createState() => _TrendingSectionState();
}

class _TrendingSectionState extends State<TrendingSection> {
  late Future<List<Map<String, dynamic>>> _futureTrending;

  // ✅ Initialize services
  final _tvSeriesService = TvSeriesService();
  final _movieService = MovieService();

  @override
  void initState() {
    super.initState();
    _futureTrending = TrendingService().getTrendingAll();
  }

  // ✅ Fetch full detail with genres and actors
  Future<Map<String, dynamic>?> _fetchFullDetail(Map<String, dynamic> movie) async {
    try {
      final mediaType = movie['type'];
      final id = movie['id'];
      final title = movie['title'] ?? '';

      print('🔍 Fetching trending detail for: $title (ID: $id, Type: $mediaType)');

      Map<String, dynamic>? fullDetail;

      if (mediaType == 'tvseries' || mediaType == 'tv') {
        fullDetail = await _tvSeriesService.getTvSeriesDetail(id, title);
      } else if (mediaType == 'movie') {
        fullDetail = await _movieService.getMovieDetail(id, title);
      }

      if (fullDetail != null) {
        print('✅ Full detail fetched');
        print('📦 Genres: ${fullDetail['genres']}');
        print('📦 Actors: ${fullDetail['actors']}');
        return fullDetail;
      } else {
        print('❌ Failed to fetch detail');
        return null;
      }
    } catch (e) {
      print('❌ Exception in _fetchFullDetail: $e');
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _futureTrending,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Padding(
            padding: EdgeInsets.all(16.0),
            child: Center(
              child: CircularProgressIndicator(color: Colors.yellow),
            ),
          );
        } else if (snapshot.hasError) {
          return const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              'Error loading trending movies',
              style: TextStyle(color: Colors.red),
            ),
          );
        } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              'No trending movies found',
              style: TextStyle(color: Colors.white),
            ),
          );
        }

        final movies = snapshot.data!;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ===== Section title =====
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
                    widget.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(Icons.local_fire_department, color: Colors.orange, size: 20),
                ],
              ),
            ),

            // ===== Horizontal movie list =====
            SizedBox(
              height: 280,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: movies.length,
                itemBuilder: (context, index) {
                  final movie = movies[index];
                  final rank = index + 1;

                  return GestureDetector(
                    onTap: () async {
                      print('🔍 Trending item clicked');
                      print('🔍 Movie from list: $movie');

                      // ✅ Show loading
                      showDialog(
                        context: context,
                        barrierDismissible: false,
                        builder: (context) => const Center(
                          child: CircularProgressIndicator(color: Colors.yellow),
                        ),
                      );

                      // ✅ Fetch full detail
                      final fullDetail = await _fetchFullDetail(movie);

                      // ✅ Close loading
                      if (mounted) Navigator.pop(context);

                      if (fullDetail != null && mounted) {
                        // ✅ Map data with full detail including genres and actors
                        final movieData = {
                          'id': movie['id'],
                          'title': fullDetail['title'] ?? movie['title'],
                          'overview': fullDetail['overview'],
                          'description': fullDetail['overview'] ?? 'No overview available',
                          'image': fullDetail['posterUrl'] ?? fullDetail['poster'] ?? movie['poster'],
                          'posterUrl': fullDetail['posterUrl'],
                          'backdropUrl': fullDetail['backdropUrl'] ?? movie['backdrop'],
                          'rating': fullDetail['rating'] ?? movie['rating'],
                          'numberOfRatings': fullDetail['numberOfRatings'] ?? movie['numberOfRatings'],
                          'votes': fullDetail['numberOfRatings'] ?? movie['numberOfRatings'],
                          'releaseDate': fullDetail['releaseDate'] ?? movie['releaseDate'],
                          'type': movie['type'],
                          'mediaType': movie['type'],
                          'status': fullDetail['status'],
                          'director': fullDetail['director'],
                          'studio': fullDetail['studio'],
                          'genres': fullDetail['genres'], // ✅ Add genres
                          'actors': fullDetail['actors'], // ✅ Add actors
                          'trailerUrl': fullDetail['trailerUrl'],
                          'videoUrl': fullDetail['videoUrl'] ?? '',
                        };

                        print('🎬 Navigating with data:');
                        print('   Genres: ${movieData['genres']}');
                        print('   Actors: ${movieData['actors']}');

                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => MovieDetailScreen(movie: movieData),
                          ),
                        );
                      } else if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Failed to load movie details'),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    },
                    child: Container(
                      width: 160,
                      margin: const EdgeInsets.only(right: 12),
                      child: Stack(
                        children: [
                          // ===== Main Card =====
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Image container
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
                                    // Backdrop image
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(12),
                                      child: Image.network(
                                        movie['backdrop'] ?? '',
                                        width: 160,
                                        height: 200,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, __, ___) => Container(
                                          width: 160,
                                          height: 200,
                                          color: Colors.grey[900],
                                          child: const Icon(
                                            Icons.broken_image,
                                            color: Colors.white54,
                                            size: 40,
                                          ),
                                        ),
                                      ),
                                    ),

                                    // Dark gradient overlay
                                    Container(
                                      width: 160,
                                      height: 200,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(12),
                                        gradient: LinearGradient(
                                          begin: Alignment.topCenter,
                                          end: Alignment.bottomCenter,
                                          colors: [
                                            Colors.transparent,
                                            Colors.black.withOpacity(0.7),
                                          ],
                                        ),
                                      ),
                                    ),

                                    // Hot badge
                                    Positioned(
                                      top: 8,
                                      right: 8,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          gradient: const LinearGradient(
                                            colors: [Colors.red, Colors.orange],
                                          ),
                                          borderRadius: BorderRadius.circular(12),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.red.withOpacity(0.5),
                                              blurRadius: 8,
                                              spreadRadius: 1,
                                            ),
                                          ],
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: const [
                                            Icon(Icons.whatshot, color: Colors.white, size: 12),
                                            SizedBox(width: 2),
                                            Text(
                                              'HOT',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontSize: 9,
                                                fontWeight: FontWeight.bold,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),

                                    // Rating badge
                                    Positioned(
                                      bottom: 8,
                                      right: 8,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: Colors.black.withOpacity(0.8),
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: Colors.yellow.withOpacity(0.3)),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.star, color: Colors.yellow, size: 12),
                                            const SizedBox(width: 3),
                                            Text(
                                              (movie['rating']?.toString() ?? 'N/A'),
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),

                                    // Play button overlay
                                    Positioned.fill(
                                      child: Center(
                                        child: Container(
                                          width: 50,
                                          height: 50,
                                          decoration: BoxDecoration(
                                            color: Colors.black.withOpacity(0.6),
                                            shape: BoxShape.circle,
                                            border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
                                          ),
                                          child: const Icon(
                                            Icons.play_arrow_rounded,
                                            color: Colors.white,
                                            size: 32,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: 8),

                              // Title
                              Text(
                                movie['title'] ?? '',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),

                              const SizedBox(height: 4),

                              // Release date
                              Row(
                                children: [
                                  Icon(Icons.calendar_today, color: Colors.grey[600], size: 11),
                                  const SizedBox(width: 4),
                                  Text(
                                    movie['releaseDate'] != null && movie['releaseDate'].toString().isNotEmpty
                                        ? formatDate(movie['releaseDate'])
                                        : (movie['year']?.toString() ?? '----'),
                                    style: TextStyle(
                                      color: Colors.grey[400],
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),

                          // ===== Rank number (Top left corner) =====
                          Positioned(
                            top: -5,
                            left: -5,
                            child: Container(
                              width: 35,
                              height: 35,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: rank <= 3
                                      ? [Colors.amber, Colors.orange]
                                      : [Colors.grey[700]!, Colors.grey[800]!],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.black,
                                  width: 2,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: (rank <= 3 ? Colors.amber : Colors.grey).withOpacity(0.5),
                                    blurRadius: 8,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                              child: Center(
                                child: Text(
                                  '$rank',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    shadows: [
                                      Shadow(
                                        color: Colors.black.withOpacity(0.5),
                                        blurRadius: 4,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
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
      },
    );
  }
}