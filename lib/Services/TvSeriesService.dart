import 'package:dio/dio.dart';
import '../network/ApiClient.dart';
import '../utils/ParaUtil.dart';

class TvSeriesService {
  Future<List<Map<String, dynamic>>> getAllTvSeries() async {
    try {
      final response = await ApiClient.dio.get(ParaUtil.getAllTvSeries);
      final List<dynamic> data = response.data;
      return data.map((e) => e as Map<String, dynamic>).toList();
    } on DioException catch (e) {
      print('❌ Error fetching TV Series: ${e.message}');
      return [];
    }
  }

  Future<Map<String, dynamic>?> getTvSeriesDetail(int id, String title) async {
    try {
      final slug = title.toLowerCase().replaceAll(' ', '-');
      final response = await ApiClient.dio.get(ParaUtil.getTvSeriesDetail(id, slug));

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

  Future<List<Map<String, dynamic>>> getSeasons(int seriesId) async {
    print('🌐 GET /api/tvseries/$seriesId/seasons');
    final response = await ApiClient.dio.get(ParaUtil.getSeasons(seriesId));
    print('📦 Data: ${response.data}');
    return List<Map<String, dynamic>>.from(response.data);
  }

  Future<List<Map<String, dynamic>>> getEpisodes(int seasonId) async {
    try {
      final response = await ApiClient.dio.get(ParaUtil.getEpisodes(seasonId));
      final List<dynamic> data = response.data;
      return data.map((e) => e as Map<String, dynamic>).toList();
    } catch (e) {
      print('❌ Error fetching episodes: $e');
      return [];
    }
  }
}
