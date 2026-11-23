import 'package:flutter/material.dart';
import 'package:ota_update/ota_update.dart';

import '../services/release_check_service.dart';
import '../theme/app_theme.dart';

Future<void> showUpdateAvailableDialog(
  BuildContext context,
  ReleaseCheckResult update,
) {
  return showDialog<void>(
    context: context,
    barrierDismissible: true,
    builder: (dialogContext) {
      var downloading = false;
      var progress = 0;
      String? statusMessage;

      return StatefulBuilder(
        builder: (context, setState) {
          Future<void> startOta() async {
            final url = update.downloadUrl;
            if (url == null || url.isEmpty) {
              return;
            }

            setState(() {
              downloading = true;
              progress = 0;
              statusMessage = 'İndiriliyor…';
            });

            try {
              await for (final event in OtaUpdate().execute(
                url,
                destinationFilename: 'terminalssh-update.apk',
              )) {
                if (!context.mounted) {
                  return;
                }

                setState(() {
                  switch (event.status) {
                    case OtaStatus.DOWNLOADING:
                      progress = event.value ?? 0;
                      statusMessage = 'İndiriliyor… $progress%';
                      break;
                    case OtaStatus.INSTALLING:
                      statusMessage = 'Kurulum ekranı açılıyor…';
                      break;
                    case OtaStatus.PERMISSION_NOT_GRANTED_ERROR:
                      statusMessage =
                          'APK kurulum izni gerekli. Ayarlardan bilinmeyen kaynaklara izin verin.';
                      downloading = false;
                      break;
                    case OtaStatus.INTERNAL_ERROR:
                    case OtaStatus.DOWNLOAD_ERROR:
                      statusMessage = 'Güncelleme başarısız. Daha sonra tekrar deneyin.';
                      downloading = false;
                      break;
                    default:
                      break;
                  }
                });
              }
            } catch (_) {
              if (context.mounted) {
                setState(() {
                  downloading = false;
                  statusMessage = 'Güncelleme başarısız.';
                });
              }
            }
          }

          return AlertDialog(
            backgroundColor: AppColors.card,
            title: const Text('Güncelleme mevcut'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Yeni sürüm hazır. APK indirilip sistem kurulum ekranı açılacak (ekip içi dağıtım).',
                ),
                const SizedBox(height: 12),
                Text(
                  'Kurulu: ${update.currentVersion} → Yeni: ${update.latestVersion ?? '—'}',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                if (update.releaseNotes != null && update.releaseNotes!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(update.releaseNotes!),
                ],
                if (downloading) ...[
                  const SizedBox(height: 12),
                  LinearProgressIndicator(value: progress > 0 ? progress / 100 : null),
                  if (statusMessage != null) ...[
                    const SizedBox(height: 6),
                    Text(statusMessage!, style: const TextStyle(fontSize: 12)),
                  ],
                ] else if (statusMessage != null) ...[
                  const SizedBox(height: 8),
                  Text(statusMessage!, style: const TextStyle(color: Colors.amber)),
                ],
              ],
            ),
            actions: [
              TextButton(
                onPressed: downloading ? null : () => Navigator.of(dialogContext).pop(),
                child: const Text('Sonra'),
              ),
              FilledButton(
                onPressed: downloading ? null : () => startOta(),
                child: Text(downloading ? 'İndiriliyor…' : 'Güncelle'),
              ),
            ],
          );
        },
      );
    },
  );
}