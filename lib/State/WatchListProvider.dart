import 'package:flutter/foundation.dart';
import '../services/WatchListService.dart';

class WatchListProvider extends ChangeNotifier {
  final WatchListService _service = WatchListService();
  final List<Map<String, dynamic>> _watchList = [];

  List<Map<String, dynamic>> get watchList => _watchList;

  /// 📜 Lấy danh sách WatchList từ API
  Future<void> loadWatchList() async {
    try {
      final data = await _service.getWatchList();
      _watchList
        ..clear()
        ..addAll(data);
      notifyListeners();
    } catch (e) {
      print('❌ Error loading watchlist: $e');
    }
  }

  /// ✅ Check xem phim có trong WatchList không
  bool isInWatchList(int mediaId) {
    return _watchList.any((m) =>
    (m['mediaId'] ?? m['id']) == mediaId
    );
  }

  /// ❤️ Thêm phim vào WatchList (API)
  Future<bool> addToWatchList(Map<String, dynamic> movie) async {
    try {
      print('🔍 Adding movie: $movie');

      final mediaId = movie['id'];
      if (mediaId == null) {
        print('❌ Media ID is null!');
        return false;
      }

      var mediaType = movie['mediaType'] ?? movie['type'] ?? 'movie';
      if (mediaType == 'tvseries') mediaType = 'tv';

      print('📤 Calling API: addToWatchList($mediaId, $mediaType)');

      final success = await _service.addToWatchList(mediaId, mediaType);

      if (success) {
        // ✅ Thêm vào local nếu chưa có
        if (!isInWatchList(mediaId)) {
          _watchList.add({
            'mediaId': mediaId,
            'id': mediaId,
            'title': movie['title'],
            'posterUrl': movie['image'] ?? movie['posterUrl'],
            'mediaType': mediaType,
          });
          notifyListeners();
          print('✅ Added to local WatchList');
        }
        return true;
      }
      return false;
    } catch (e, stackTrace) {
      print('❌ Error adding to WatchList: $e');
      print('Stack trace: $stackTrace');
      return false;
    }
  }

  /// 🗑️ Xóa phim khỏi WatchList (API) - Sử dụng mediaId
  Future<bool> removeFromWatchListById(int mediaId, String mediaType) async {
    try {
      // ✅ Chuẩn hóa mediaType
      if (mediaType == 'tvseries') mediaType = 'tv';

      print('🗑️ Removing: mediaId=$mediaId, mediaType=$mediaType');

      final success = await _service.removeFromWatchList(mediaId, mediaType);

      if (success) {
        // ✅ Xóa khỏi local
        _watchList.removeWhere((m) =>
        (m['mediaId'] ?? m['id']) == mediaId
        );
        notifyListeners(); // ⚡ Cập nhật UI ngay lập tức
        print('✅ Removed from WatchList');
        return true;
      } else {
        print('⚠️ API returned false');
        return false;
      }
    } catch (e) {
      print('❌ Error removing from WatchList: $e');
      return false;
    }
  }
  /// 🗑️ Xóa phim khỏi WatchList (theo title) - deprecated, dùng removeById
  @Deprecated('Use removeFromWatchListById instead')
  Future<void> removeFromWatchList(String title) async {
    try {
      final movie = _watchList.firstWhere(
            (m) => m['title'] == title,
        orElse: () => {},
      );
      if (movie.isEmpty) return;

      final mediaId = movie['mediaId'] ?? movie['id'];
      var mediaType = movie['mediaType'] ?? 'movie';

      await removeFromWatchListById(mediaId, mediaType);
    } catch (e) {
      print('❌ Error removing from WatchList: $e');
    }
  }
}