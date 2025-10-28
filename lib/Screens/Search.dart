import 'package:flutter/material.dart';
import '../../services/SearchService.dart';
import '../component/MediaCard.dart';
import 'GenresScreen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen>
    with SingleTickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  final SearchService _searchService = SearchService();

  bool _isSearching = false;
  bool _isLoading = false;
  List<Map<String, dynamic>> _searchResults = [];

  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
  }

  Future<void> _performSearch(String query) async {
    if (query.isEmpty) {
      setState(() {
        _searchResults.clear();
        _isSearching = false;
      });
      return;
    }

    setState(() {
      _isSearching = true;
      _isLoading = true;
    });

    final results = await _searchService.searchAll(query);

    setState(() {
      _searchResults = results;
      _isLoading = false;
    });
  }

  void _onSearchChanged() {
    final text = _searchController.text.trim();
    _performSearch(text);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: Row(
          children: [
            const Expanded(
              child: Text(
                'Search',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 24,
                ),
              ),
            ),
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  PageRouteBuilder(
                    pageBuilder: (_, __, ___) => const GenresScreen(),
                    transitionsBuilder: (_, animation, __, child) {
                      const begin = Offset(1.0, 0.0);
                      const end = Offset.zero;
                      const curve = Curves.easeInOut;
                      var tween = Tween(begin: begin, end: end)
                          .chain(CurveTween(curve: curve));
                      return SlideTransition(
                          position: animation.drive(tween), child: child);
                    },
                  ),
                );
              },
              child: Container(
                padding:
                const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.yellow,
                  borderRadius: BorderRadius.circular(25),
                ),
                child: const Text(
                  'Genres',
                  style: TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 🔍 Ô tìm kiếm
            TextField(
              controller: _searchController,
              onChanged: (value) => _onSearchChanged(),
              decoration: InputDecoration(
                hintText: 'Search by title, overview',
                hintStyle: const TextStyle(color: Colors.grey),
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                filled: true,
                fillColor: Colors.grey[800],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
              ),
              style: const TextStyle(color: Colors.white),
            ),
            const SizedBox(height: 16),

            // 📊 Kết quả tìm kiếm
            Expanded(
              child: _isLoading
                  ? const Center(
                child: CircularProgressIndicator(color: Colors.yellow),
              )
                  : !_isSearching
                  ? const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.search,
                        color: Colors.grey, size: 64),
                    SizedBox(height: 16),
                    Text(
                      'Search for movies or TV shows',
                      style: TextStyle(
                          color: Colors.grey, fontSize: 16),
                    ),
                  ],
                ),
              )
                  : _searchResults.isEmpty
                  ? const Center(
                child: Text(
                  'No results found',
                  style: TextStyle(
                      color: Colors.grey, fontSize: 16),
                ),
              )
                  : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Results for: "${_searchController.text}"',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // 🟨 Dùng component MediaCard
                  Expanded(
                    child: GridView.builder(
                      gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.7,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                      ),
                      itemCount: _searchResults.length,
                      itemBuilder: (context, index) {
                        final item = _searchResults[index];
                        return MediaCard(item: item);
                      },
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
