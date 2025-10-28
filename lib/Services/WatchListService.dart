import 'package:dio/dio.dart';
import '../network/ApiClient.dart';
import '../utils/ParaUtil.dart';
import '../utils/TokenStorage.dart';

class WatchListService {
  /// ✅ Lấy danh sách WatchList
  Future<List<Map<String, dynamic>>> getWatchList() async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        print('⚠️ No token found');
        return [];
      }

      final response = await ApiClient.dio.get(
        ParaUtil.getWatchList,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200 && response.data is List) {
        return (response.data as List)
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      }
    } on DioException catch (e) {
      print('❌ Get WatchList error: ${e.response?.data ?? e.message}');
    }
    return [];
  }

  /// ❤️ Thêm phim vào WatchList
  Future<bool> addToWatchList(int mediaId, String mediaType) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        print('⚠️ No token found');
        return false;
      }

      final response = await ApiClient.dio.post(
        ParaUtil.addWatchList, // '/api/watchlist/add'
        data: {
          "mediaId": mediaId,
          "mediaType": mediaType,
        },
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Added to watchlist successfully');
        return true;
      } else {
        print('⚠️ Failed: ${response.statusCode}');
        return false;
      }
    } on DioException catch (e) {
      print('❌ Add WatchList error: ${e.response?.data ?? e.message}');
    } catch (e) {
      print('❌ Unexpected error: $e');
    }
    return false;
  }


  /// 🗑️ Xóa phim khỏi WatchList
  Future<bool> removeFromWatchList(int mediaId, String mediaType) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        print('⚠️ No token found');
        return false;
      }

      print('📤 DELETE Request:');
      print('   URL: ${ParaUtil.removeWatchList}');
      print('   Data: {"mediaId": $mediaId, "mediaType": "$mediaType"}');

      final response = await ApiClient.dio.delete(
        ParaUtil.removeWatchList,
        data: {
          "mediaId": mediaId,
          "mediaType": mediaType,
        },
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      print('✅ Response: ${response.statusCode} - ${response.data}');

      if (response.statusCode == 200) return true;
    } on DioException catch (e) {
      print('❌ Remove WatchList error:');
      print('   Status: ${e.response?.statusCode}');
      print('   Data: ${e.response?.data}');
      print('   Message: ${e.message}');
    }
    return false;
  }
  /// 🧡 Lấy danh sách phim được yêu thích nhiều nhất
  Future<List<Map<String, dynamic>>> getMostFavoriteMovies() async {
    try {
      final response = await ApiClient.dio.get(ParaUtil.mostFavoriteMovies);
      if (response.statusCode == 200) {
        final data = response.data;

        // Nếu backend trả về { data: [...] }
        if (data is Map && data.containsKey('data')) {
          final List<dynamic> list = data['data'];
          return list.map((e) => Map<String, dynamic>.from(e)).toList();
        }

        // Nếu backend trả về thẳng một list
        if (data is List) {
          return data.map((e) => Map<String, dynamic>.from(e)).toList();
        }

        return [];
      } else {
        print('⚠️ Error: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('❌ Error fetching most-favorited movies: $e');
      return [];
    }
  }
}
