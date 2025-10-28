import 'package:flutter/material.dart';
import '../services/MovieService.dart';
import '../component/MediaCard.dart';

class MoviesScreen extends StatefulWidget {
  const MoviesScreen({super.key});

  @override
  State<MoviesScreen> createState() => _MoviesScreenState();
}

class _MoviesScreenState extends State<MoviesScreen> {
  List<Map<String, dynamic>> _movies = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMovies();
  }

  Future<void> _loadMovies() async {
    final data = await MovieService().getAllMovies();
    setState(() {
      _movies = data;
      _isLoading = false;
    });
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Popular Movies',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.yellow))
          : _movies.isEmpty
          ? const Center(
        child: Text('No Movies Found',
            style: TextStyle(color: Colors.white)),
      )
          : SingleChildScrollView(
        child: GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          gridDelegate:
          const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.7,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
          ),
          itemCount: _movies.length,
          itemBuilder: (context, index) {
            return MediaCard(item :_movies[index]);
          },
        ),
      )
    );
  }
}
