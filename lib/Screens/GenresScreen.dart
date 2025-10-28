import 'package:flutter/material.dart';
import '../../services/GenreService.dart';
import 'MovieDetail.dart';

class GenresScreen extends StatefulWidget {
  const GenresScreen({super.key});

  @override
  State<GenresScreen> createState() => _GenresScreenState();
}

class _GenresScreenState extends State<GenresScreen> {
  final GenreService _genreService = GenreService();

  String? selectedGenre;
  List<Map<String, dynamic>> genres = [];
  List<Map<String, dynamic>> filteredMovies = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchGenres();
  }

  Future<void> fetchGenres() async {
    final data = await _genreService.getAllGenres();
    setState(() {
      genres = data;
      isLoading = false;
    });
  }

  Future<void> fetchMediaByGenre(int genreId, String genreName) async {
    setState(() {
      selectedGenre = genreName;
      isLoading = true;
    });

    final media = await _genreService.getMediaByGenre(genreId);

    setState(() {
      filteredMovies = media.map((m) {
        return {
          'title': m['title'] ?? '',
          'image': m['posterUrl'] ?? '',
          'rating': m['rating'] ?? 'N/A',
          'releaseDate': m['releaseDate'] ?? 'Unknown',
          'type': m['type'] ?? '',
        };
      }).toList();
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context), // 🔙 Quay lại SearchScreen
        ),
        title: const Text(
          'Genres',
          style: TextStyle(
            color: Colors.yellow,
            fontWeight: FontWeight.bold,
            fontSize: 22,
          ),
        ),
        centerTitle: true,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.yellow))
          : selectedGenre == null
          ? _buildGenresGrid()
          : _buildMoviesSection(),
    );
  }

  // 🔸 Hiển thị danh sách thể loại
  Widget _buildGenresGrid() {
    if (genres.isEmpty) {
      return const Center(
        child: Text('No genres found', style: TextStyle(color: Colors.white)),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 1.2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: genres.length,
        itemBuilder: (context, index) {
          final genre = genres[index];
          final genreName = genre['name'];
          final genreId = genre['id'];
          final isSelected = selectedGenre == genreName;

          return GestureDetector(
            onTap: () => fetchMediaByGenre(genreId, genreName),
            child: Container(
              decoration: BoxDecoration(
                color: isSelected ? Colors.yellow : Colors.grey[850],
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected ? Colors.yellow : Colors.transparent,
                  width: 2,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    _getGenreIcon(genreName),
                    color: isSelected ? Colors.black : Colors.white,
                    size: 40,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    genreName,
                    style: TextStyle(
                      color: isSelected ? Colors.black : Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // 🔸 Hiển thị danh sách phim theo thể loại
  Widget _buildMoviesSection() {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator(color: Colors.yellow));
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              GestureDetector(
                onTap: () => setState(() {
                  selectedGenre = null;
                  filteredMovies.clear();
                }),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.grey[800],
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(Icons.arrow_back, color: Colors.white),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '$selectedGenre (${filteredMovies.length})',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.7,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
              ),
              itemCount: filteredMovies.length,
              itemBuilder: (context, index) {
                final item = filteredMovies[index];
                return GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => MovieDetailScreen(movie: item),
                      ),
                    );
                  },
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        Image.network(
                          item['image'],
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            color: Colors.grey[800],
                            child: const Icon(Icons.movie,
                                color: Colors.white, size: 50),
                          ),
                        ),
                        Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.bottomCenter,
                              end: Alignment.topCenter,
                              colors: [
                                Colors.black.withOpacity(0.7),
                                Colors.transparent,
                              ],
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 8,
                          left: 8,
                          right: 8,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                item['releaseDate'],
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 10),
                              ),
                              Row(
                                children: [
                                  const Icon(Icons.star,
                                      color: Colors.yellow, size: 12),
                                  const SizedBox(width: 2),
                                  Text(
                                    item['rating'].toString(),
                                    style: const TextStyle(
                                        color: Colors.white, fontSize: 10),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Positioned(
                          bottom: 28,
                          left: 8,
                          right: 8,
                          child: Text(
                            item['title'],
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  // 🔸 Icon theo thể loại
  IconData _getGenreIcon(String genre) {
    switch (genre.toLowerCase()) {
      case 'action':
        return Icons.flash_on;
      case 'adventure':
        return Icons.explore;
      case 'animation':
        return Icons.movie_creation;
      case 'dark fantasy':
        return Icons.dark_mode;
      case 'drama':
        return Icons.theater_comedy;
      case 'fantasy':
        return Icons.auto_awesome;
      case 'history':
        return Icons.history;
      case 'isekai':
        return Icons.public;
      case 'mystery':
        return Icons.visibility_off;
      case 'religion':
        return Icons.family_restroom;
      case 'romance':
        return Icons.favorite;
      case 'anime':
        return Icons.animation;
      case 'war':
        return Icons.security;
      case 'sci-fi':
        return Icons.rocket_launch;
      default:
        return Icons.movie;
    }
  }
}
