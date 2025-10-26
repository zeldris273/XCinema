import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import '../../screens/MovieDetail.dart';
import '../../services/BannerService.dart';
import '../../services/TvSeriesService.dart';
import '../../services/MovieService.dart';

class BannerSection extends StatefulWidget {
  const BannerSection({super.key});

  @override
  State<BannerSection> createState() => _BannerSectionState();
}

class _BannerSectionState extends State<BannerSection> {
  int _currentIndex = 0;
  final CarouselSliderController _controller = CarouselSliderController();
  List<Map<String, dynamic>> _banners = [];
  bool _isLoading = true;

  // ✅ Initialize services
  final _bannerService = BannerService();
  final _tvSeriesService = TvSeriesService();
  final _movieService = MovieService();

  @override
  void initState() {
    super.initState();
    _loadBanners();
  }

  Future<void> _loadBanners() async {
    final data = await _bannerService.fetchNewReleases(limit: 10);
    setState(() {
      _banners = data;
      _isLoading = false;
    });
  }

  // ✅ Fetch full detail using existing services
  Future<Map<String, dynamic>?> _fetchFullDetail(Map<String, dynamic> banner) async {
    try {
      final mediaType = banner['mediaType'];
      final id = banner['id'];
      final title = banner['title'] ?? '';

      print('🔍 Fetching detail for: $title (ID: $id, Type: $mediaType)');

      Map<String, dynamic>? fullDetail;

      if (mediaType == 'tvseries' || mediaType == 'tv') {
        // ✅ Use TvSeriesService
        fullDetail = await _tvSeriesService.getTvSeriesDetail(id, title);
      } else if (mediaType == 'movie') {
        // ✅ Use MovieService
        fullDetail = await _movieService.getMovieDetail(id, title);
      }

      if (fullDetail != null) {
        print('✅ Detail from API: $fullDetail');
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
    if (_isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: CircularProgressIndicator(color: Colors.yellow),
        ),
      );
    }

    if (_banners.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: Text(
            'No new releases found.',
            style: TextStyle(color: Colors.grey),
          ),
        ),
      );
    }

    final currentBanner = _banners[_currentIndex];

    return Column(
      children: [
        Stack(
          children: [
            // ===== Carousel =====
            CarouselSlider.builder(
              carouselController: _controller,
              itemCount: _banners.length,
              itemBuilder: (context, index, _) {
                final banner = _banners[index];
                return Stack(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      height: 400,
                      child: Image.network(
                        banner['backdropUrl'] ?? '',
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: Colors.grey[900],
                          child: const Icon(Icons.broken_image,
                              color: Colors.white54, size: 60),
                        ),
                      ),
                    ),

                    // Dark gradient overlay
                    Container(
                      height: 400,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withOpacity(0.6),
                            Colors.black.withOpacity(0.9),
                          ],
                        ),
                      ),
                    ),
                  ],
                );
              },
              options: CarouselOptions(
                height: 400,
                autoPlay: true,
                autoPlayInterval: const Duration(seconds: 5),
                autoPlayCurve: Curves.easeInOutCubic,
                enlargeCenterPage: false,
                viewportFraction: 1.0,
                onPageChanged: (index, reason) {
                  setState(() => _currentIndex = index);
                },
              ),
            ),

            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // "New Release" badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Colors.red, Colors.orange],
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.red.withOpacity(0.4),
                            blurRadius: 8,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.fiber_new,
                              color: Colors.white, size: 16),
                          SizedBox(width: 4),
                          Text(
                            'NEW RELEASE',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Title
                    Text(
                      currentBanner['title'] ?? 'Untitled',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        shadows: [
                          Shadow(color: Colors.black, blurRadius: 10),
                        ],
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 8),

                    // Rating & Views only
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.yellow, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          '${currentBanner['rating'] ?? 'N/A'}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(width: 16),
                        const Icon(Icons.remove_red_eye,
                            color: Colors.grey, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          '${currentBanner['viewCount'] ?? 0}',
                          style: const TextStyle(
                            color: Colors.grey,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 10),

                    // Overview text
                    Text(
                      currentBanner['overview'] ?? 'No overview available.',
                      style: const TextStyle(
                        color: Colors.grey,
                        fontSize: 13,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 14),

                    // ===== Play Button =====
                    SizedBox(
                      width: 140,
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          // ✅ Show loading
                          showDialog(
                            context: context,
                            barrierDismissible: false,
                            builder: (context) => const Center(
                              child: CircularProgressIndicator(color: Colors.yellow),
                            ),
                          );

                          // ✅ Fetch full detail using service
                          final fullDetail = await _fetchFullDetail(currentBanner);

                          // ✅ Close loading
                          if (mounted) Navigator.pop(context);

                          if (fullDetail != null && mounted) {
                            // ✅ Map data với full detail
                            final movieData = {
                              'id': fullDetail['id'],
                              'title': fullDetail['title'],
                              'overview': fullDetail['overview'],
                              'description': fullDetail['overview'],
                              'image': fullDetail['posterUrl'] ?? fullDetail['backdropUrl'],
                              'posterUrl': fullDetail['posterUrl'],
                              'backdropUrl': fullDetail['backdropUrl'],
                              'rating': fullDetail['rating'],
                              'numberOfRatings': fullDetail['numberOfRatings'],
                              'votes': fullDetail['numberOfRatings'],
                              'viewCount': currentBanner['viewCount'],
                              'releaseDate': fullDetail['releaseDate'],
                              'type': currentBanner['mediaType'],
                              'mediaType': currentBanner['mediaType'],
                              'status': fullDetail['status'],
                              'director': fullDetail['director'],
                              'studio': fullDetail['studio'],
                              'genres': fullDetail['genres'], // ✅ Add genres
                              'actors': fullDetail['actors'], // ✅ Add actors
                              'trailerUrl': fullDetail['trailerUrl'],
                              'videoUrl': '',
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
                        icon: const Icon(Icons.play_arrow, size: 18),
                        label: const Text(
                          'Play Now',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(
                              vertical: 10, horizontal: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Dot indicators
            Positioned(
              top: 20,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: _banners.asMap().entries.map((entry) {
                  return Container(
                    width: _currentIndex == entry.key ? 24 : 8,
                    height: 8,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(4),
                      color: _currentIndex == entry.key
                          ? Colors.white
                          : Colors.white.withOpacity(0.4),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ],
    );
  }
}