import 'package:intl/intl.dart';

String formatDate(String? dateStr) {
  if (dateStr == null || dateStr.isEmpty) return '';
  try {
    DateTime date = DateTime.parse(dateStr).toLocal();
    return DateFormat('dd/MM/yyyy').format(date);
  } catch (e) {
    return dateStr;
  }
}