import 'dart:io';
import 'package:dio/dio.dart';
import '../network/ApiClient.dart';
import '../utils/ParaUtil.dart';
import '../utils/TokenStorage.dart';

class ProfileService {
  /// ✅ Lấy thông tin người dùng
  Future<Map<String, dynamic>?> getProfile() async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        print('⚠️ No token found');
        return null;
      }

      final response = await ApiClient.dio.get(
        ParaUtil.getProfile,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.statusCode == 200) {
        return Map<String, dynamic>.from(response.data);
      }
    } on DioException catch (e) {
      print('❌ GetProfile error: ${e.response?.data ?? e.message}');
    }
    return null;
  }

  /// ✏️ Cập nhật thông tin người dùng (có thể có avatar)
  Future<bool> updateProfile({
    required String name,
    required String gender,
    File? avatar,
  }) async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        print('⚠️ No token found');
        return false;
      }

      final formData = FormData.fromMap({
        'displayName': name,
        'gender': gender,
        if (avatar != null)
          'avatar': await MultipartFile.fromFile(
            avatar.path,
            filename: avatar.path.split('/').last,
          ),
      });

      final response = await ApiClient.dio.put(
        ParaUtil.updateProfile,
        data: formData,
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'multipart/form-data',
          },
        ),
      );

      return response.statusCode == 200;
    } on DioException catch (e) {
      print('❌ UpdateProfile error: ${e.response?.data ?? e.message}');
    }
    return false;
  }
}
