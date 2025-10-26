import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'MovieDetail.dart';
import '../component/movie_sections/BannerSection.dart';
import '../component/movie_sections/TrendingSection.dart';
import '../Services/ProfileService.dart';
import '../component/Footer.dart';
import '../component/movie_sections/MovieSectionsFetcher.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentBannerIndex = 0;
  final CarouselSliderController _carouselController = CarouselSliderController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            Image.asset(
              'assets/logoXcinema.png',
              width: 120,
              height: 120,
              fit: BoxFit.contain,
            ),
            const SizedBox(height: 0),
            const SizedBox(height: 0),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: FutureBuilder<Map<String, dynamic>?>(
              future: ProfileService().getProfile(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const CircleAvatar(
                    radius: 18,
                    backgroundColor: Colors.grey,
                    child: CircularProgressIndicator(
                      color: Colors.yellow,
                      strokeWidth: 2,
                    ),
                  );
                }

                final profile = snapshot.data;
                final avatarUrl = profile?['avatarUrl'];

                return GestureDetector(
                  onTapDown: (details) {
                    showMenu(
                      context: context,
                      position: RelativeRect.fromLTRB(
                        details.globalPosition.dx,
                        details.globalPosition.dy + 20,
                        0,
                        0,
                      ),
                      color: Colors.grey[900],
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      items: [
                        PopupMenuItem(
                          child: Row(
                            children: const [
                              Icon(Icons.list, color: Colors.white),
                              SizedBox(width: 8),
                              Text('Watch List', style: TextStyle(color: Colors.white)),
                            ],
                          ),
                          onTap: () => Navigator.pushNamed(context, '/watchlist'),
                        ),
                        PopupMenuItem(
                          child: Row(
                            children: const [
                              Icon(Icons.person, color: Colors.white),
                              SizedBox(width: 8),
                              Text('Profile', style: TextStyle(color: Colors.white)),
                            ],
                          ),
                          onTap: () => Navigator.pushNamed(context, '/profile'),
                        ),
                        PopupMenuItem(
                          child: Row(
                            children: const [
                              Icon(Icons.logout, color: Colors.red),
                              SizedBox(width: 8),
                              Text('Logout', style: TextStyle(color: Colors.red)),
                            ],
                          ),
                          onTap: () {
                            Future.delayed(const Duration(milliseconds: 100), () {
                              showDialog(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('Thông báo'),
                                  content:
                                  const Text('Bạn có muốn đăng xuất không?'),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context),
                                      child: const Text('Không'),
                                    ),
                                    TextButton(
                                      onPressed: () {
                                        Navigator.pop(context);
                                        Navigator.pushNamedAndRemoveUntil(
                                          context,
                                          '/SignIn',
                                              (route) => false,
                                        );
                                      },
                                      child: const Text('Có'),
                                    ),
                                  ],
                                ),
                              );
                            });
                          },
                        ),
                      ],
                    );
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.yellow.withOpacity(0.5),
                          blurRadius: 6,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                    child: CircleAvatar(
                      radius: 18,
                      backgroundColor: Colors.grey[800],
                      backgroundImage: (avatarUrl != null && avatarUrl.isNotEmpty)
                          ? NetworkImage(avatarUrl)
                          : null,
                      child: (avatarUrl == null || avatarUrl.isEmpty)
                          ? const Icon(Icons.person, color: Colors.white)
                          : null,
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),

      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const BannerSection(),
            const TrendingSection(title: 'Trending'),

            // MovieHorizontalListSection(
            //   title: 'Recommended For You',
            //   movies: ,
            // ),
            MovieSectionsFetcher(title: 'Fast Your Eyes on Movie Theaters', type: 'topRated'),
            MovieSectionsFetcher(title: 'Most Favorite Movies', type: 'mostFavorite'),
            const SizedBox(height: 16),
            const Footer(),
          ],
        ),
      ),
    );
  }
}

enum SectionType { trending, rated, viewed, recommended }

class MovieListSection extends StatelessWidget {
  final String title;
  final List<Map<String, dynamic>> movies;
  final SectionType sectionType;

  const MovieListSection({
    super.key,
    required this.title,
    required this.movies,
    required this.sectionType,
  });

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return DateFormat("MMMM dd'th', yyyy").format(date);
    } catch (e) {
      return dateString;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Text(
            title,
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ),
        SizedBox(
          height: 320,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.all(16.0),
            itemCount: movies.length,
            itemBuilder: (context, index) {
              final movie = movies[index];
              return Padding(
                padding: const EdgeInsets.only(right: 20.0),
                child: GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => MovieDetailScreen(
                          movie: {
                            'title': movie['title'],
                            'image': movie['image'],
                            'rating': movie['rating'] ?? 0.0,
                            'votes': movie['votes'] ?? 2,
                            'description': movie['description'] ?? 'No description available',
                            'releaseDate': movie['date'] ?? movie['year']?.toString() ?? movie['releaseDate'] ?? 'Unknown',
                            'director': movie['director'] ?? 'Unknown',
                            'studio': movie['studio'] ?? 'Unknown',
                          },
                        ),
                      ),
                    );
                  },
                  child: AnimatedScale(
                    scale: 1.0,
                    duration: const Duration(milliseconds: 200),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Stack(
                          children: [
                            Container(
                              decoration: sectionType == SectionType.viewed || sectionType == SectionType.recommended
                                  ? BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: sectionType == SectionType.viewed
                                    ? [
                                  BoxShadow(
                                    color: const Color.fromRGBO(255, 221, 0, 0.15294117647058825),
                                    blurRadius: 8,
                                    spreadRadius: 2,
                                  ),
                                ]
                                    : null,
                              )
                                  : null,
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(sectionType == SectionType.viewed || sectionType == SectionType.recommended ? 16 : 8),
                                child: Image.network(
                                  movie['image'],
                                  width: sectionType == SectionType.viewed || sectionType == SectionType.recommended ? 160 : (sectionType == SectionType.rated ? 160 : 180),
                                  height: sectionType == SectionType.viewed || sectionType == SectionType.recommended ? 200 : (sectionType == SectionType.rated ? 180 : 200),
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) => const SizedBox(),
                                ),
                              ),
                            ),
                            if (sectionType == SectionType.trending) ...[
                              Positioned(
                                top: 8,
                                left: 8,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.red,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Text('Hot', style: TextStyle(color: Colors.white, fontSize: 10)),
                                ),
                              ),
                              Positioned(
                                bottom: 8,
                                right: 8,
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: const BoxDecoration(
                                    color: Colors.black54,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.play_arrow, color: Colors.white, size: 16),
                                ),
                              ),
                              Positioned(
                                bottom: 8,
                                left: 8,
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: Image.network(
                                    movie['thumbnail'],
                                    width: 70,
                                    height: 94,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) => const SizedBox(),
                                  ),
                                ),
                              ),
                            ],
                            if (sectionType == SectionType.rated)
                              Positioned(
                                bottom: 8,
                                right: 8,
                                child: Row(
                                  children: [
                                    const Icon(Icons.star, color: Colors.yellow, size: 24),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${movie['rating']}',
                                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              ),
                            if (sectionType == SectionType.viewed) ...[
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
                                  ),
                                  child: const Text('Top View', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          width: sectionType == SectionType.viewed || sectionType == SectionType.recommended ? 160 : (sectionType == SectionType.rated ? 170 : 180),
                          child: Text(
                            movie['title'],
                            style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(height: 4),
                        if (sectionType == SectionType.trending)
                          Text(
                            '${movie['rating']} · ${movie['year']} · ${movie['duration']}',
                            style: const TextStyle(color: Colors.grey, fontSize: 10),
                          )
                        else if (sectionType == SectionType.rated)
                          Text(
                            'Votes: ${movie['votes']}',
                            style: const TextStyle(color: Colors.yellow, fontSize: 10),
                          )
                        else if (sectionType == SectionType.viewed) ...[
                            Text(
                              movie['releaseDate'] ?? 'Unknown',
                              style: const TextStyle(color: Colors.grey, fontSize: 10),
                            ),
                            Row(
                              children: [
                                const Icon(Icons.remove_red_eye, color: Colors.yellow, size: 12),
                                const SizedBox(width: 4),
                                Text(
                                  '${movie['views']}',
                                  style: const TextStyle(color: Colors.yellow, fontSize: 10),
                                ),
                              ],
                            ),
                          ]
                          else if (sectionType == SectionType.recommended)
                              Text(
                                _formatDate(movie['releaseDate'] ?? 'Unknown'),
                                style: const TextStyle(color: Colors.grey, fontSize: 10),
                              ),
                      ],
                    ),
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