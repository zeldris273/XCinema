import 'package:dio/dio.dart';
import '../utils/ParaUtil.dart';
import '../utils/TokenStorage.dart';

class RatingService {
  // ✅ Tạo Dio instance riêng với validateStatus
  late final Dio _dio;

  RatingService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ParaUtil.apiUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        // ✅ QUAN TRỌNG: Không throw exception cho status code < 500
        validateStatus: (status) {
          return status != null && status < 500;
        },
      ),
    );

    // ✅ Thêm logging interceptor để debug
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          print('🌐 [REQUEST] ${options.method} ${options.uri}');
          print('📋 Headers: ${options.headers}');
          print('📦 Data: ${options.data}');
          return handler.next(options);
        },
        onResponse: (response, handler) {
          print('✅ [RESPONSE] ${response.statusCode} ${response.requestOptions.uri}');
          print('📦 Data: ${response.data}');
          return handler.next(response);
        },
        onError: (error, handler) {
          print('❌ [ERROR] ${error.requestOptions.method} ${error.requestOptions.uri}');
          print('❌ Status: ${error.response?.statusCode}');
          print('❌ Message: ${error.message}');
          print('❌ Data: ${error.response?.data}');
          return handler.next(error);
        },
      ),
    );
  }

  // Submit rating (1-10)
  Future<bool> submitRating({
    required int mediaId,
    required String mediaType, // 'movie' hoặc 'tv'
    required int rating, // 1-10
  }) async {
    final token = await TokenStorage.getToken();
    if (token == null) {
      print('❌ Rating failed: No token');
      return false;
    }

    print('📤 Submitting rating: mediaId=$mediaId, type=$mediaType, rating=$rating');

    try {
      final response = await _dio.post(
        ParaUtil.submitRating,
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
        data: {
          'mediaId': mediaId,
          'mediaType': mediaType,
          'rating': rating,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Rating submitted successfully');
        return true;
      } else if (response.statusCode == 400) {
        final error = response.data['error'] ?? response.data['message'] ?? 'Unknown error';
        print('⚠️ Rating error (400): $error');
        return false;
      } else if (response.statusCode == 404) {
        print('❌ Rating endpoint not found (404)');
        return false;
      } else {
        print('❌ Failed with status: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      print('❌ Unexpected error: $e');
      return false;
    }
  }
}