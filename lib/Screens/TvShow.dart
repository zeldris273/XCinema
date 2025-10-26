import 'package:flutter/material.dart';
import '../services/TvSeriesService.dart';
import '../component/MediaCard.dart';

class TVShowsScreen extends StatefulWidget {
  const TVShowsScreen({super.key});

  @override
  State<TVShowsScreen> createState() => _TVShowsScreenState();
}

class _TVShowsScreenState extends State<TVShowsScreen> {
  List<Map<String, dynamic>> _tvShows = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadTvShows();
  }

  Future<void> _loadTvShows() async {
    final data = await TvSeriesService().getAllTvSeries();
    setState(() {
      _tvShows = data;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text(
          'Popular TV Series',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.yellow))
          : _tvShows.isEmpty
          ? const Center(
        child: Text(
          'No TV Series Found',
          style: TextStyle(color: Colors.white),
        ),
      )
          : GridView.builder(
        padding: const EdgeInsets.all(16.0),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.7,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
        ),
        itemCount: _tvShows.length,
        itemBuilder: (context, index) {
          return MediaCard(item: _tvShows[index]);
        },
      ),
    );
  }
}
