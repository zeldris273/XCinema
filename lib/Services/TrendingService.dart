import 'package:dio/dio.dart';
import 'package:xcinema/network/ApiClient.dart';
import '../Utils/ParaUtil.dart';

class TrendingService {

  Future<List<Map<String, dynamic>>> getTrendingAll() async {
    try {
      final response = await ApiClient.dio.get('/api/trending/all');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((e) => Map<String, dynamic>.from(e)).toList();
      } else {
        print('Error: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('❌ Error fetching trending: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>?> getTrendingDetail(
      int id, String title, String type) async {
    try {
      final slug = title.toLowerCase().replaceAll(' ', '-');
      late String endpoint;

      if (type == 'movie') {
        endpoint = ParaUtil.getMovieDetail(id, slug);
      } else if (type == 'tvseries') {
        endpoint = ParaUtil.getTvSeriesDetail(id, slug);
      } else {
        throw Exception('Invalid content type: $type');
      }

      final response = await ApiClient.dio.get(endpoint);
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
