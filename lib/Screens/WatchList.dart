import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/WatchListProvider.dart';
import '../../screens/MovieDetail.dart';

class WatchListScreen extends StatefulWidget {
  const WatchListScreen({super.key});

  @override
  State<WatchListScreen> createState() => _WatchListScreenState();
}

class _WatchListScreenState extends State<WatchListScreen> {
  @override
  void initState() {
    super.initState();
    // ✅ Load watchlist khi vào màn hình
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WatchListProvider>().loadWatchList();
    });
  }

  void _removeItem(int mediaId, String mediaType) async {
    final provider = context.read<WatchListProvider>();

    // ✅ Chuẩn hóa mediaType
    String normalizedType = mediaType;
    if (mediaType == 'tvseries') {
      normalizedType = 'tv';
    }

    print('🗑️ Removing: mediaId=$mediaId, mediaType=$normalizedType');

    final success = await provider.removeFromWatchListById(mediaId, normalizedType);

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Removed from Watch List!'),
          backgroundColor: Colors.red[900],
          duration: const Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to remove item.'),
          backgroundColor: Colors.orange,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text(
          'My Watch List',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.black,
        actions: [
          // ✅ Nút refresh
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () {
              context.read<WatchListProvider>().loadWatchList();
            },
          ),
        ],
      ),
      body: Consumer<WatchListProvider>(
        builder: (context, provider, child) {
          final list = provider.watchList;

          // ✅ Empty state
          if (list.isEmpty) {
            return FutureBuilder(
              future: Future.delayed(const Duration(milliseconds: 500)),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: CircularProgressIndicator(color: Colors.yellow),
                  );
                }
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.favorite_border,
                        size: 80,
                        color: Colors.grey[700],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No movies in watch list',
                        style: TextStyle(
                          color: Colors.grey[400],
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Add some movies to get started!',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          }

          // ✅ Grid view with beautiful cards
          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.65,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: list.length,
            itemBuilder: (context, index) {
              final item = list[index];
              final mediaId = item['mediaId'] ?? item['id'];
              final mediaType = item['mediaType'] ?? item['type'] ?? 'movie';

              return GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => MovieDetailScreen(
                        movie: {
                          'id': mediaId,
                          'title': item['title'],
                          'image': item['posterUrl'] ?? item['image'],
                          'posterUrl': item['posterUrl'] ?? item['image'],
                          'type': mediaType,
                          'mediaType': mediaType,
                          'rating': item['rating'],
                          'releaseDate': item['releaseDate'],
                          'description': item['description'],
                          'overview': item['description'],
                        },
                      ),
                    ),
                  );
                },
                child: Container(
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
                      // ===== Poster Image =====
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          item['posterUrl'] ?? item['image'] ?? '',
                          width: double.infinity,
                          height: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            color: Colors.grey[900],
                            child: const Center(
                              child: Icon(
                                Icons.broken_image,
                                color: Colors.white54,
                                size: 50,
                              ),
                            ),
                          ),
                        ),
                      ),

                      // ===== Gradient Overlay =====
                      Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withOpacity(0.8),
                            ],
                            stops: const [0.5, 1.0],
                          ),
                        ),
                      ),

                      // ===== Remove Button (Top Right) =====
                      Positioned(
                        top: 8,
                        right: 8,
                        child: GestureDetector(
                          onTap: () => _removeItem(mediaId, mediaType),
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: Colors.red.withOpacity(0.9),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.red.withOpacity(0.5),
                                  blurRadius: 8,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.close,
                              color: Colors.white,
                              size: 18,
                            ),
                          ),
                        ),
                      ),

                      // ===== Movie Title (Bottom) =====
                      Positioned(
                        bottom: 0,
                        left: 0,
                        right: 0,
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                item['title'] ?? 'Unknown',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  shadows: [
                                    Shadow(
                                      color: Colors.black,
                                      blurRadius: 4,
                                    ),
                                  ],
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(
                                    mediaType == 'movie'
                                        ? Icons.movie
                                        : Icons.tv,
                                    color: Colors.yellow,
                                    size: 14,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    mediaType == 'movie' ? 'Movie' : 'TV Series',
                                    style: const TextStyle(
                                      color: Colors.grey,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),

                      // ===== Favorite Badge (Top Left) =====
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.red.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.red.withOpacity(0.4),
                                blurRadius: 6,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: const [
                              Icon(
                                Icons.favorite,
                                color: Colors.white,
                                size: 12,
                              ),
                              SizedBox(width: 4),
                              Text(
                                'SAVED',
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
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}