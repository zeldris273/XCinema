import 'package:dio/dio.dart';
import '../network/ApiClient.dart';
import '../utils/ParaUtil.dart';

class SearchService {
  Future<List<Map<String, dynamic>>> searchAll(String query) async {
    try {
      final response = await ApiClient.dio.get(
        ParaUtil.search,
        queryParameters: {'query': query},
      );

      if (response.statusCode == 200) {
        final data = response.data['results'];
        if (data is List) {
          return data.map((e) => Map<String, dynamic>.from(e)).toList();
        }
      }
    } catch (e) {
      print('❌ SearchService error: $e');
    }
    return [];
  }
}
