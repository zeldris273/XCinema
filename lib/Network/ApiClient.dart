import 'package:dio/dio.dart';
import '../utils/ParaUtil.dart';
class ApiClient {
  static final Dio dio = Dio(

    BaseOptions(
      baseUrl: ParaUtil.apiUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  );

  // Hàm thêm token vào header (khi user đăng nhập)
  static void setAuthToken(String token) {
    dio.options.headers['Authorization'] = 'Bearer $token';
  }
}
