import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/WatchListProvider.dart';
import '../../utils/FormatDate.dart';
import './PlayNow.dart';
import './WatchTrailer.dart';

class MovieDetailScreen extends StatefulWidget {
  final Map<String, dynamic> movie;

  const MovieDetailScreen({super.key, required this.movie});

  @override
  State<MovieDetailScreen> createState() => _MovieDetailScreenState();
}

class _MovieDetailScreenState extends State<MovieDetailScreen> {
  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      body: CustomScrollView(
        slivers: [
          // ===== App Bar with Image Background =====
          SliverAppBar(
            expandedHeight: screenHeight * 0.5,
            pinned: true,
            backgroundColor: Colors.black,
            leading: Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
            ),
            actions: [
              Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.5),
                  shape: BoxShape.circle,
                ),
                child: Consumer<WatchListProvider>(
                  builder: (context, provider, child) {
                    final mediaId = widget.movie['id'];
                    final isInWatchList = provider.isInWatchList(mediaId);

                    return IconButton(
                      icon: Icon(
                        isInWatchList ? Icons.favorite : Icons.favorite_border,
                        color: isInWatchList ? Colors.red : Colors.white,
                      ),
                      onPressed: () async {
                        if (isInWatchList) {
                          var mediaType = widget.movie['type'] ?? 'movie';
                          if (mediaType == 'tvseries') mediaType = 'tv';

                          final success = await provider.removeFromWatchListById(
                            mediaId,
                            mediaType,
                          );

                          if (success && mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: const Text('Removed from Watch List!'),
                                backgroundColor: Colors.red[900],
                                behavior: SnackBarBehavior.floating,
                                duration: const Duration(seconds: 2),
                              ),
                            );
                          }
                        } else {
                          var mediaType = widget.movie['type'] ?? 'movie';
                          if (mediaType == 'tvseries') mediaType = 'tv';

                          final movieData = {
                            'id': mediaId,
                            'mediaType': mediaType,
                            'type': mediaType,
                            'title': widget.movie['title'],
                            'image': widget.movie['image'],
                            'posterUrl': widget.movie['image'],
                            'rating': widget.movie['rating'],
                            'releaseDate': widget.movie['releaseDate'],
                          };

                          final success = await provider.addToWatchList(movieData);

                          if (success && mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: const Text('Added to Watch List!'),
                                backgroundColor: Colors.green[900],
                                behavior: SnackBarBehavior.floating,
                                duration: const Duration(seconds: 2),
                              ),
                            );
                          }
                        }
                      },
                    );
                  },
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    widget.movie['image'] ?? widget.movie['backdropUrl'] ?? '',
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: Colors.grey[900],
                      child: const Icon(Icons.broken_image, size: 80, color: Colors.white54),
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withOpacity(0.7),
                          const Color(0xFF0A0A0A),
                        ],
                        stops: const [0.0, 0.7, 1.0],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 20,
                    left: 16,
                    right: 16,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.movie['title'] ?? 'Untitled',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            shadows: [
                              Shadow(color: Colors.black, blurRadius: 10),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.green,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                '${((widget.movie['rating'] ?? 0.0) * 10).toInt()}%',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.star, color: Colors.yellow, size: 16),
                            const SizedBox(width: 4),
                            Text(
                              '${widget.movie['rating'] ?? 0.0}',
                              style: const TextStyle(color: Colors.white, fontSize: 14),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '(${widget.movie['numberOfRatings'] ?? widget.movie['votes'] ?? 0})',
                              style: TextStyle(color: Colors.grey[400], fontSize: 14),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ===== Content =====
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ===== Action Buttons =====
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            final movieType = widget.movie['type'];
                            final movieId = widget.movie['id'];
                            final videoUrl = widget.movie['videoUrl'];

                            if (movieType == 'tvseries' || movieType == 'tv') {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => PlayNowScreen(
                                    isTvSeries: true,
                                    seriesId: movieId,
                                    title: widget.movie['title'],
                                  ),
                                ),
                              );
                            } else if (movieType == 'movie') {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => PlayNowScreen(
                                    isTvSeries: false,
                                    videoUrl: videoUrl,
                                  ),
                                ),
                              );
                            } else {
                              if (videoUrl != null && videoUrl.isNotEmpty) {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => PlayNowScreen(
                                      isTvSeries: false,
                                      videoUrl: videoUrl,
                                    ),
                                  ),
                                );
                              } else {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => PlayNowScreen(
                                      isTvSeries: true,
                                      seriesId: movieId,
                                      title: widget.movie['title'],
                                    ),
                                  ),
                                );
                              }
                            }
                          },
                          icon: const Icon(Icons.play_arrow, size: 24),
                          label: const Text(
                            'Play Now',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: Colors.black,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),

                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            // ✅ Lấy trailerUrl từ movie data
                            final trailerUrl = widget.movie['trailerUrl'];
                            print('🎬 Trailer URL in Flutter: ${widget.movie['trailerUrl']}');


                            if (trailerUrl != null && trailerUrl.isNotEmpty) {
                              // ✅ Navigate đến WatchTrailerScreen với URL
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => WatchTrailerScreen(
                                    youtubeUrl: trailerUrl,
                                  ),
                                ),
                              );
                            } else {
                              // ✅ Hiển thị thông báo nếu không có trailer
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('No trailer available for this movie'),
                                  backgroundColor: Colors.orange,
                                ),
                              );
                            }
                          },
                          icon: const Icon(Icons.videocam_outlined, size: 24),
                          label: const Text(
                            'Trailer',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Colors.white, width: 2),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 32),

                  // ===== Genres Section =====
                  if (widget.movie['genres'] != null && (widget.movie['genres'] as List).isNotEmpty) ...[
                    _buildSectionTitle('Genres'),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: (widget.movie['genres'] as List).map((genre) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Colors.yellow.shade700, Colors.orange.shade600],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.yellow.withOpacity(0.3),
                                blurRadius: 8,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                          child: Text(
                            genre.toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 32),
                  ],

                  // ===== Overview Section =====
                  _buildSectionTitle('Overview'),
                  const SizedBox(height: 12),
                  Text(
                    widget.movie['overview'] ?? widget.movie['description'] ?? 'No description available',
                    style: TextStyle(
                      color: Colors.grey[300],
                      fontSize: 15,
                      height: 1.6,
                    ),
                  ),

                  const SizedBox(height: 32),

                  // ===== Cast Section =====
                  if (widget.movie['actors'] != null && (widget.movie['actors'] as List).isNotEmpty) ...[
                    _buildSectionTitle('Cast'),
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 120,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: (widget.movie['actors'] as List).length,
                        itemBuilder: (context, index) {
                          final actor = widget.movie['actors'][index];
                          return Container(
                            width: 100,
                            margin: const EdgeInsets.only(right: 12),
                            child: Column(
                              children: [
                                Container(
                                  width: 80,
                                  height: 80,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    gradient: LinearGradient(
                                      colors: [Colors.yellow.shade700, Colors.orange.shade600],
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.yellow.withOpacity(0.3),
                                        blurRadius: 8,
                                        spreadRadius: 1,
                                      ),
                                    ],
                                  ),
                                  child: const Center(
                                    child: Icon(
                                      Icons.person,
                                      size: 40,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  actor['name'] ?? 'Unknown',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  textAlign: TextAlign.center,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],

                  // ===== Details Section =====
                  _buildSectionTitle('Details'),
                  const SizedBox(height: 16),
                  _buildDetailRow(Icons.calendar_today, 'Release Date', formatDate(widget.movie['releaseDate']) ?? 'Unknown'),
                  _buildDetailRow(Icons.movie_filter, 'Status', widget.movie['status'] ?? 'Released'),
                  _buildDetailRow(Icons.person_outline, 'Director', widget.movie['director'] ?? 'Unknown'),
                  _buildDetailRow(Icons.business, 'Studio', widget.movie['studio'] ?? 'Unknown'),

                  const SizedBox(height: 32),

                  // ===== Rate This Section =====
                  _buildSectionTitle('Rate This'),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      const Text(
                        'Rating: ',
                        style: TextStyle(color: Colors.white, fontSize: 15),
                      ),
                      SizedBox(
                        width: 50,
                        height: 50,
                        child: CustomPaint(
                          painter: CircleProgressPainter((widget.movie['rating'] ?? 0.0) / 10),
                          child: Center(
                            child: Text(
                              '${((widget.movie['rating'] ?? 0.0) * 10).toInt()}%',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '(${widget.movie['numberOfRatings'] ?? widget.movie['votes'] ?? 0} votes)',
                        style: TextStyle(color: Colors.grey[400], fontSize: 15),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  RatingStars(
                    initialRating: (widget.movie['rating'] ?? 0.0) / 10,
                    onRatingChanged: (rating) {
                      print('🌟 New rating: $rating');
                    },
                  ),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Row(
      children: [
        Container(
          width: 4,
          height: 24,
          decoration: BoxDecoration(
            color: Colors.yellow,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Colors.grey[600], size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: Colors.grey[500],
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class RatingStars extends StatefulWidget {
  final double initialRating;
  final Function(double) onRatingChanged;

  const RatingStars({
    super.key,
    required this.initialRating,
    required this.onRatingChanged,
  });

  @override
  State<RatingStars> createState() => RatingStarsState();
}

class RatingStarsState extends State<RatingStars> {
  double _currentRating = 0;

  @override
  void initState() {
    super.initState();
    _currentRating = widget.initialRating;
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(10, (index) {
        final starValue = index + 1;
        return GestureDetector(
          onTap: () {
            setState(() {
              if (_currentRating >= starValue) {
                _currentRating = starValue - 1.0;
              } else {
                _currentRating = starValue.toDouble();
              }
              widget.onRatingChanged(_currentRating);
            });
          },
          child: Icon(
            _currentRating >= starValue ? Icons.star : Icons.star_border,
            color: _currentRating >= starValue ? Colors.yellow : Colors.grey,
            size: 20,
          ),
        );
      }),
    );
  }
}

class CircleProgressPainter extends CustomPainter {
  final double progress;

  CircleProgressPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5
      ..color = Colors.white;

    final progressPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5
      ..color = Colors.green
      ..strokeCap = StrokeCap.round;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 2.5;

    canvas.drawCircle(center, radius, paint);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -3.14 / 2,
      3.14 * 2 * progress,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => true;
}