import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'features/retailer/models/retailer_session.dart';
import 'features/retailer/screens/retailer_login_screen.dart';
import 'features/retailer/screens/retailer_main_shell.dart';
import 'features/retailer/services/retailer_api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final apiService = RetailerApiService();
  final session = await apiService.getStoredSession();

  runApp(RetailerApp(initialSession: session));
}

class RetailerApp extends StatelessWidget {
  final RetailerSession? initialSession;

  const RetailerApp({super.key, this.initialSession});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Installment Guard - Partner Store',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      home: (initialSession != null && initialSession!.token.isNotEmpty)
          ? RetailerMainShell(initialSession: initialSession!)
          : const RetailerLoginScreen(),
    );
  }
}
