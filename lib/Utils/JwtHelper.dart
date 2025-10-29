import 'dart:convert';

class JwtHelper {
  static Map<String, dynamic>? decodeToken(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) {
        print('❌ Invalid JWT format');
        return null;
      }

      final payload = json.decode(
        utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))),
      );

      return Map<String, dynamic>.from(payload);
    } catch (e) {
      print('❌ Error decoding JWT: $e');
      return null;
    }
  }

  static int? getUserId(String token) {
    final payload = decodeToken(token);
    if (payload == null) return null;

    final userIdString = payload['sub'];

    if (userIdString != null) {
      return int.tryParse(userIdString.toString());
    }

    return null;
  }

  static String? getEmail(String token) {
    final payload = decodeToken(token);
    if (payload == null) return null;

    return payload['email'];
  }

  static String? getRole(String token) {
    final payload = decodeToken(token);
    if (payload == null) return null;

    return payload['role'];
  }

  static bool isExpired(String token) {
    final payload = decodeToken(token);
    if (payload == null) return true;

    final exp = payload['exp'];
    if (exp == null) return true;

    final expiryDate = DateTime.fromMillisecondsSinceEpoch(exp * 1000);
    return DateTime.now().isAfter(expiryDate);
  }
}