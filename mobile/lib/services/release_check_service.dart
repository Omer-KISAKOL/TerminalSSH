import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';

import 'api_config.dart';

class ReleaseCheckResult {
  const ReleaseCheckResult({
    required this.updateAvailable,
    required this.currentVersion,
    required this.latestVersion,
    required this.downloadUrl,
    this.releaseNotes,
  });

  final bool updateAvailable;
  final String currentVersion;
  final String? latestVersion;
  final String? downloadUrl;
  final String? releaseNotes;

  factory ReleaseCheckResult.fromJson(Map<String, dynamic> json) {
    return ReleaseCheckResult(
      updateAvailable: json['updateAvailable'] == true,
      currentVersion: json['currentVersion'] as String? ?? '',
      latestVersion: json['latestVersion'] as String?,
      downloadUrl: json['downloadUrl'] as String?,
      releaseNotes: json['releaseNotes'] as String?,
    );
  }
}

class ReleaseCheckService {
  ReleaseCheckService._();

  static final ReleaseCheckService instance = ReleaseCheckService._();

  static bool _checkedThisRun = false;

  Future<ReleaseCheckResult?> checkOnceOnAppOpen() async {
    if (_checkedThisRun) {
      return null;
    }

    _checkedThisRun = true;

    try {
      final packageInfo = await PackageInfo.fromPlatform();
      final current = packageInfo.version;
      final baseUrl = resolveApiBaseUrl();
      final uri = Uri.parse('$baseUrl/releases/check').replace(
        queryParameters: {
          'platform': 'android',
          'current': current,
        },
      );

      final response = await http.get(uri).timeout(const Duration(seconds: 12));

      if (response.statusCode != 200) {
        return null;
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final result = ReleaseCheckResult.fromJson(json);

      if (!result.updateAvailable) {
        return null;
      }

      return result;
    } catch (_) {
      return null;
    }
  }
}