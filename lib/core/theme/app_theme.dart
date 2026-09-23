import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Admin Panel Teal & Crisp White Color Palette
  static const Color tealPrimary = Color(0xFF0F766E);
  static const Color tealHover = Color(0xFF115E59);
  static const Color tealSecondary = Color(0xFF14B8A6);
  static const Color tealLight = Color(0xFFCCFBF1);
  static const Color tealSubtle = Color(0xFFF0FDFA);
  
  static const Color lightBackground = Color(0xFFF8FAFC);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightCardBorder = Color(0xFFE2E8F0);

  static const Color textMain = Color(0xFF0F172A);
  static const Color textMuted = Color(0xFF64748B);

  static const Color primaryNavy = Color(0xFF0F172A);
  static const Color primaryBlue = Color(0xFF0F766E);
  static const Color accentCyan = Color(0xFF0F766E);
  static const Color successGreen = Color(0xFF16A34A);
  static const Color warningOrange = Color(0xFFD97706);
  static const Color dangerRed = Color(0xFFDC2626);

  static const Color darkBackground = Color(0xFFF8FAFC);
  static const Color darkSurface = Color(0xFFFFFFFF);
  static const Color darkSurfaceCard = Color(0xFFFFFFFF);
  static const Color borderSlate = Color(0xFFE2E8F0);

  static ThemeData get lightTheme {
    final baseTextTheme = GoogleFonts.poppinsTextTheme(ThemeData.light().textTheme);
    
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      fontFamily: GoogleFonts.poppins().fontFamily,
      scaffoldBackgroundColor: lightBackground,
      colorScheme: const ColorScheme.light(
        primary: tealPrimary,
        secondary: tealSecondary,
        surface: lightSurface,
        error: dangerRed,
        onPrimary: Colors.white,
        onSurface: textMain,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: textMain),
        titleTextStyle: TextStyle(color: textMain, fontSize: 18, fontWeight: FontWeight.bold),
      ),
      textTheme: baseTextTheme.copyWith(
        displayLarge: GoogleFonts.poppins(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: textMain,
          letterSpacing: -0.5,
        ),
        displayMedium: GoogleFonts.poppins(
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: textMain,
        ),
        titleLarge: GoogleFonts.poppins(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textMain,
        ),
        titleMedium: GoogleFonts.poppins(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: textMain,
        ),
        bodyLarge: GoogleFonts.poppins(
          fontSize: 14,
          color: textMuted,
          height: 1.4,
        ),
        bodyMedium: GoogleFonts.poppins(
          fontSize: 12,
          color: textMuted,
        ),
      ),
      cardTheme: CardThemeData(
        color: lightSurface,
        elevation: 1,
        shadowColor: Colors.black.withValues(alpha: 0.04),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: lightCardBorder, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: tealPrimary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          elevation: 2,
          shadowColor: tealPrimary.withValues(alpha: 0.2),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.poppins(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  static ThemeData get darkTheme => lightTheme;
}
