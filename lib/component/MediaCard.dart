import 'package:flutter/material.dart';
import '../utils/FormatDate.dart';
import '../screens/MovieDetail.dart';

class MediaCard extends StatelessWidget {
  final Map<String, dynamic> item;

  const MediaCard({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    // ✅ Map data đầy đủ từ item, bao gồm genres và actors
    final movie = {
      'id': item['id'],
      'title': item['title'] ?? '',
      'image': item['poster'] ?? item['posterUrl'] ?? item['image'] ?? '',
      'posterUrl': item['posterUrl'],
      'backdrop': item['backdrop'] ?? item['backdropUrl'] ?? '',
      'backdropUrl': item['backdropUrl'],
      'rating': item['rating'] ?? 0.0,
      'numberOfRatings': item['numberOfRatings'],
      'votes': item['numberOfRatings'],
      'releaseDate': item['releaseDate'],
      'description': item['description'] ?? item['overview'] ?? 'No overview available',
      'overview': item['overview'],
      'studio': item['studio'] ?? 'Unknown',
      'director': item['director'] ?? 'Unknown',
      'status': item['status'],
      'type': item['type'] ?? 'movie',
      'mediaType': item['type'] ?? 'movie',
      'genres': item['genres'] ?? [], // ✅ Pass genres
      'actors': item['actors'] ?? [], // ✅ Pass actors
      'trailerUrl': item['trailerUrl'],
      'videoUrl': item['videoUrl'] ?? '',
    };

    return GestureDetector(
      onTap: () {
        print('🎬 MediaCard navigate with:');
        print('   Genres: ${movie['genres']}');
        print('   Actors: ${movie['actors']}');

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => MovieDetailScreen(movie: movie),
          ),
        );
      },
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // --- Poster image ---
            Image.network(
              movie['image'],
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                color: Colors.grey[800],
                child: const Icon(Icons.broken_image, color: Colors.white, size: 40),
              ),
            ),

            // --- Gradient overlay ---
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withOpacity(0.75),
                    Colors.transparent,
                  ],
                ),
              ),
            ),

            // --- Title ---
            Positioned(
              bottom: 30,
              left: 8,
              right: 8,
              child: Text(
                movie['title'],
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),

            // --- Rating + Release Date ---
            Positioned(
              bottom: 8,
              left: 8,
              right: 8,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // 🗓 Release date
                  Text(
                    movie['releaseDate'] != null
                        ? formatDate(movie['releaseDate'])
                        : 'Unknown',
                    style: const TextStyle(color: Colors.white70, fontSize: 10),
                  ),

                  // ⭐ Rating
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.star, color: Colors.yellow, size: 12),
                        const SizedBox(width: 3),
                        Text(
                          movie['rating']?.toStringAsFixed(1) ?? 'N/A',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}