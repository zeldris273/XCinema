import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/MoviesProvider.dart';
import '../component/MediaCard.dart';

class MoviesScreen extends StatefulWidget {
  const MoviesScreen({super.key});

  @override
  State<MoviesScreen> createState() => _MoviesScreenState();
}

class _MoviesScreenState extends State<MoviesScreen> {
  @override
  void initState() {
    super.initState();
    // ✅ Load phim từ Provider khi khởi động
    Future.microtask(() => context.read<MoviesProvider>().fetchMovies());
  }

  @override
  Widget build(BuildContext context) {
    final movieProvider = context.watch<MoviesProvider>();
    final movies = movieProvider.movies;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text(
          '🎬 Popular Movies',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
      ),

      body: movieProvider.isLoading
          ? const Center(
        child: CircularProgressIndicator(color: Colors.yellow),
      )
          : movies.isEmpty
          ? const Center(
        child: Text(
          'No Movies Found',
          style: TextStyle(color: Colors.white70),
        ),
      )
          : RefreshIndicator(
        color: Colors.yellow,
        backgroundColor: Colors.black,
        onRefresh: () => movieProvider.fetchMovies(),
        child: GridView.builder(
          padding: const EdgeInsets.all(16.0),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.7,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
          ),
          itemCount: movies.length,
          itemBuilder: (context, index) {
            final movie = movies[index];
            return MediaCard(item: movie);
          },
        ),
      ),
    );
  }
}
