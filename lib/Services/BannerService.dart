import 'package:dio/dio.dart';
import '../network/ApiClient.dart';
import '../utils/ParaUtil.dart';

class BannerService {
  Future<List<Map<String, dynamic>>> fetchNewReleases({int limit = 10}) async {
    try {
      final res = await ApiClient.dio.get(
        ParaUtil.fetchNewReleases,
        queryParameters: {'limit': limit},
      );

      final List<dynamic> data = res.data['data'];
      return data.map((e) => e as Map<String, dynamic>).toList();
    } on DioException catch (e) {
      print('❌ Fetch error: ${e.message}');
      return [];
    }
  }
}
