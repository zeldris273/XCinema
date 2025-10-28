import 'package:dio/dio.dart';
import '../network/ApiClient.dart';
import '../utils/ParaUtil.dart';

class MovieService {
  Future<List<Map<String, dynamic>>> getAllMovies() async {
    try {
      final res = await ApiClient.dio.get(ParaUtil.getAllMovies);
      final List<dynamic> data = res.data;
      return data.map((e) => e as Map<String, dynamic>).toList();
    } on DioException catch (e) {
      print('❌ Fetch movies error: ${e.message}');
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getTopRatedMovies() async {
    try {
      final response = await ApiClient.dio.get(ParaUtil.topRatedMovies);
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((e) => Map<String, dynamic>.from(e)).toList();
      } else {
        print('Error: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('❌ Error fetching top-rated movies: $e');
      return [];
    }
  }

  // ✅ Thêm vào MovieService class

  Future<Map<String, dynamic>?> getMovieDetail(int id, String title) async {
    try {
      final slug = title.toLowerCase().replaceAll(' ', '-');
      final response = await ApiClient.dio.get(ParaUtil.getMovieDetail(id, slug));

      if (response.statusCode == 200 && response.data != null) {
        return Map<String, dynamic>.from(response.data);
      } else {
        print('❌ Error: ${response.statusCode}');
        return null;
      }
    } on DioException catch (e) {
      print('❌ Dio Error: ${e.response?.statusCode} - ${e.message}');
      return null;
    } catch (e) {
      print('❌ Exception: $e');
      return null;
    }
  }
}
