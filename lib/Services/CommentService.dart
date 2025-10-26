import 'package:dio/dio.dart';
import '../network/ApiClient.dart';
import '../utils/ParaUtil.dart';
import '../utils/TokenStorage.dart';

class CommentService {
  /// 📜 Lấy danh sách comments
  Future<List<Map<String, dynamic>>> getComments({
    int? movieId,
    int? tvSeriesId,
    int? episodeId,
  }) async {
    try {
      final token = await TokenStorage.getToken();

      final queryParams = <String, dynamic>{};
      if (movieId != null) queryParams['movieId'] = movieId;
      if (tvSeriesId != null) queryParams['tvSeriesId'] = tvSeriesId;
      if (episodeId != null) queryParams['episodeId'] = episodeId;

      print('🔵 Fetching comments with params: $queryParams');

      final response = await ApiClient.dio.get(
        ParaUtil.getComments,
        queryParameters: queryParams,
        options: Options(
          headers: token != null ? {'Authorization': 'Bearer $token'} : null,
        ),
      );

      if (response.statusCode == 200 && response.data is List) {
        print('✅ Fetched ${(response.data as List).length} comments');
        print('📦 Sample comment data: ${response.data.isNotEmpty ? response.data[0] : "empty"}');

        return (response.data as List)
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      print('❌ Get Comments error: ${e.response?.data ?? e.message}');
      return [];
    }
  }

  /// ✍️ Thêm comment mới
  Future<Map<String, dynamic>?> addComment({
    required int userId,
    required String commentText,
    int? movieId,
    int? tvSeriesId,
    int? episodeId,
    int? parentCommentId,
  }) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        print('⚠️ No token found');
        return null;
      }

      final data = {
        'userId': userId,
        'commentText': commentText,
        if (movieId != null) 'movieId': movieId,
        if (tvSeriesId != null) 'tvSeriesId': tvSeriesId,
        if (episodeId != null) 'episodeId': episodeId,
        if (parentCommentId != null) 'parentCommentId': parentCommentId,
      };

      print('📤 Adding comment: $data');

      final response = await ApiClient.dio.post(
        ParaUtil.addComment,
        data: data,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Comment added successfully');
        print('📦 Response data: ${response.data}');
        return Map<String, dynamic>.from(response.data);
      }
      return null;
    } on DioException catch (e) {
      print('❌ Add Comment error: ${e.response?.data ?? e.message}');
      return null;
    }
  }

  /// ✏️ Cập nhật comment
  Future<bool> updateComment({
    required int commentId,
    required int userId,
    required String commentText,
  }) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        print('⚠️ No token found');
        return false;
      }

      final response = await ApiClient.dio.put(
        ParaUtil.updateComment(commentId),
        data: {
          'userId': userId,
          'commentText': commentText,
        },
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        print('✅ Comment updated successfully');
        return true;
      }
      return false;
    } on DioException catch (e) {
      print('❌ Update Comment error: ${e.response?.data ?? e.message}');
      return false;
    }
  }

  /// 🗑️ Xóa comment
  Future<bool> deleteComment({
    required int commentId,
    required int userId,
  }) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        print('⚠️ No token found');
        return false;
      }

      final response = await ApiClient.dio.delete(
        ParaUtil.deleteComment(commentId),
        queryParameters: {'userId': userId},
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200 || response.statusCode == 204) {
        print('✅ Comment deleted successfully');
        return true;
      }
      return false;
    } on DioException catch (e) {
      print('❌ Delete Comment error: ${e.response?.data ?? e.message}');
      return false;
    }
  }
}