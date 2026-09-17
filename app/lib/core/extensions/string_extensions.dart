import 'package:intl/intl.dart';

extension StringExtensions on String {
  String get capitalize {
    if (isEmpty) return this;
    return '${this[0].toUpperCase()}${substring(1)}';
  }
}

extension DateTimeExtensions on DateTime {
  String get formattedFrench {
    final day = this.day.toString().padLeft(2, '0');
    final months = [
      '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return '$day ${months[month]} $year';
  }

  String get shortFrenchDate {
    final day = this.day.toString().padLeft(2, '0');
    final months = [
      '', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
    ];
    return '$day ${months[month]} $year';
  }

  String get timeFormatted {
    final h = hour.toString().padLeft(2, '0');
    final m = minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}

extension NumberFormatting on num {
  String get formattedDA {
    final formatter = NumberFormat('#,##0', 'fr_FR');
    return '${formatter.format(this)} DA';
  }

  String get formattedCompact {
    if (this >= 1000000) {
      return '${(this / 1000000).toStringAsFixed(1)}M';
    }
    if (this >= 1000) {
      return '${(this / 1000).toStringAsFixed(0)}K';
    }
    return toString();
  }
}
