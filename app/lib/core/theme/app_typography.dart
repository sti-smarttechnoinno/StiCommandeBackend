import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

abstract final class AppTypography {
  static TextStyle _base({
    required double fontSize,
    FontWeight fontWeight = FontWeight.w400,
    Color color = AppColors.textPrimary,
    double letterSpacing = -0.2,
    double height = 1.4,
  }) {
    return GoogleFonts.inter(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      letterSpacing: letterSpacing,
      height: height,
    );
  }

  static TextStyle get pageTitle => _base(
        fontSize: 32,
        fontWeight: FontWeight.bold,
        letterSpacing: -0.5,
        height: 1.2,
      );

  static TextStyle get sectionTitle => _base(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.3,
        height: 1.3,
      );

  static TextStyle get cardTitle => _base(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        letterSpacing: -0.2,
      );

  static TextStyle get bodyLarge => _base(
        fontSize: 15,
        fontWeight: FontWeight.w400,
      );

  static TextStyle get bodyMedium => _base(
        fontSize: 15,
        fontWeight: FontWeight.w400,
      );

  static TextStyle get bodySmall => _base(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: AppColors.textSecondary,
      );

  static TextStyle get caption => _base(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: AppColors.textTertiary,
      );

  static TextStyle get balanceAmount => _base(
        fontSize: 36,
        fontWeight: FontWeight.bold,
        color: AppColors.textOnPrimary,
        letterSpacing: -1.0,
        height: 1.1,
      );

  static TextStyle get statNumber => _base(
        fontSize: 28,
        fontWeight: FontWeight.bold,
        letterSpacing: -0.5,
        height: 1.1,
      );

  static TextStyle get chipText => _base(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: AppColors.textOnPrimary,
      );

  static TextStyle get badgeText => _base(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.2,
      );

  static TextStyle get bottomNavLabel => _base(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.1,
      );

  static TextStyle get headlineMedium => _base(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.3,
        height: 1.3,
      );

  static TextStyle get headlineSmall => _base(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.2,
        height: 1.3,
      );

  static TextStyle get titleMedium => _base(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.2,
        height: 1.3,
      );

  static TextStyle get titleSmall => _base(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.1,
        height: 1.3,
      );

  static TextStyle get labelSmall => _base(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.2,
      );
}
