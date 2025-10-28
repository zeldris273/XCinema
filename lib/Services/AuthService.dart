import 'package:dio/dio.dart';
import '../network/ApiClient.dart';
import '../utils/TokenStorage.dart';
import '../utils/ParaUtil.dart';

class AuthService {

  /// Đăng ký tài khoản (gửi OTP)
  Future<String?> register(String email, String password) async {
    try {
      final response = await ApiClient.dio.post(
        ParaUtil.register,
        data: {'email': email, 'password': password},
      );
      if (response.statusCode == 200) {
        return response.data.toString();
      }
    } catch (e) {
      print('❌ Register error: $e');
    }
    return null;
  }

  /// Xác minh OTP và tạo tài khoản
  Future<String?> verifyOtp(String email, String otp, String password) async {
    try {
      final response = await ApiClient.dio.post(
        ParaUtil.verifyOtp,
        data: {'email': email, 'otp': otp, 'password': password},
      );
      if (response.statusCode == 200) {
        return response.data.toString();
      }
    } catch (e) {
      print('❌ Verify OTP error: $e');
    }
    return null;
  }

  Future<bool> login(String email, String password) async {
    try {
      final response = await ApiClient.dio.post(
        ParaUtil.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      // Lấy token từ response
      final token = response.data['accessToken'];
      if (token == null) return false;

      // Lưu token cục bộ
      await TokenStorage.saveToken(token);
      ApiClient.setAuthToken(token);

      print("✅ Login success, token: $token");
      return true;
    } on DioException catch (e) {
      print('❌ Login error: ${e.response?.data ?? e.message}');
      return false;
    }
  }

  /// Quên mật khẩu – gửi OTP
  Future<String?> forgotPassword(String email) async {
    try {
      final response = await ApiClient.dio.post(
        ParaUtil.forgotPassword,
        data: {'email': email},
      );
      if (response.statusCode == 200) {
        return response.data.toString();
      }
    } catch (e) {
      print('❌ Forgot password error: $e');
    }
    return null;
  }

  /// Đặt lại mật khẩu với OTP
  Future<String?> resetPassword(String email, String otp, String newPassword) async {
    try {
      final response = await ApiClient.dio.post(
        ParaUtil.resetPassword,
        data: {'email': email, 'otp': otp, 'password': newPassword},
      );
      if (response.statusCode == 200) {
        return response.data.toString();
      }
    } catch (e) {
      print('❌ Reset password error: $e');
    }
    return null;
  }
}
