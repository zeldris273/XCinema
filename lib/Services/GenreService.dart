import 'package:dio/dio.dart';
import '../network/ApiClient.dart';
import '../utils/ParaUtil.dart';

class GenreService {
  // Lấy danh sách thể loại (dropdown)
  Future<List<Map<String, dynamic>>> getAllGenres() async {
    try {
      final response = await ApiClient.dio.get(ParaUtil.getAllGenres);

      if (response.statusCode == 200) {
        final data = response.data;

        // Một số API trả về { data: [...] }, ta linh hoạt xử lý cả 2
        if (data is Map && data.containsKey('data')) {
          final List<dynamic> list = data['data'];
          return list.map((e) => Map<String, dynamic>.from(e)).toList();
        }

        if (data is List) {
          return data.map((e) => Map<String, dynamic>.from(e)).toList();
        }

        return [];
      } else {
        print('⚠️ Failed to load genres: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('❌ GenreService error: $e');
      return [];
    }
  }

  /// ✅ Lấy danh sách phim & TV theo genreId
  Future<List<Map<String, dynamic>>> getMediaByGenre(int genreId) async {
    try {
      final url = ParaUtil.getMediaByGenre(genreId);
      final response = await ApiClient.dio.get(url);
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((e) => Map<String, dynamic>.from(e)).toList();
      }
    } catch (e) {
      print('❌ GenreService error (getMediaByGenre): $e');
    }
    return [];
  }
}
