enum AppEnvironment { development, production }

class EnvironmentConfig {
  static AppEnvironment _environment = AppEnvironment.development;

  static AppEnvironment get environment => _environment;
  static bool get isDevelopment => _environment == AppEnvironment.development;
  static bool get isProduction => _environment == AppEnvironment.production;

  static void setEnvironment(AppEnvironment env) {
    _environment = env;
  }

  static String get environmentName => isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION';
}
