import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../Network/ApiClient.dart';
import '../utils/ParaUtil.dart';
import '../utils/TokenStorage.dart';

class MoviesProvider extends ChangeNotifier {
  List<Map<String, dynamic>> _movies = [];
  bool _isLoading = false;

  List<Map<String, dynamic>> get movies => _movies;
  bool get isLoading => _isLoading;

  Future<void> fetchMovies() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await TokenStorage.getToken();
      final response = await ApiClient.dio.get(
        '${ParaUtil.apiUrl}${ParaUtil.getAllMovies}',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.statusCode == 200) {
        _movies = List<Map<String, dynamic>>.from(response.data);
      }
    } catch (e) {
      debugPrint('❌ Error fetching movies: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  void addMovie(Map<String, dynamic> newMovie) {
    _movies.insert(0, newMovie);
    notifyListeners();
  }

  void updateMovie(int id, Map<String, dynamic> updatedMovie) {
    final index = _movies.indexWhere((m) => m['id'] == id);
    if (index != -1) {
      _movies[index] = updatedMovie;
      notifyListeners();
    }
  }

  Future<void> deleteMovie(int id) async {
    try {
      final token = await TokenStorage.getToken();

      if (token == null || token.isEmpty) {
        throw Exception('Authentication token not found');
      }

      // Gọi API delete
      final response = await ApiClient.dio.delete(
        '${ParaUtil.apiUrl}${ParaUtil.deleteMovie(id)}',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      // Kiểm tra response thành công
      if (response.statusCode == 200 || response.statusCode == 204) {
        // Xóa khỏi UI sau khi API thành công
        _movies.removeWhere((m) => m['id'] == id);
        notifyListeners();
        debugPrint('✅ Movie deleted successfully');
      } else {
        throw Exception('Failed to delete movie: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('❌ Error deleting movie: $e');
      rethrow; // Ném lỗi lên để UI xử lý
    }
  }
}
