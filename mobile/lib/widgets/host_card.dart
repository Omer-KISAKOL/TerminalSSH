import 'package:flutter/material.dart';

import '../models/server_profile.dart';
import '../theme/app_theme.dart';

class HostCard extends StatelessWidget {
  const HostCard({
    super.key,
    required this.profile,
    required this.onTap,
    this.onLongPress,
  });

  final ServerProfile profile;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  Color get _accentColor {
    final hash = profile.name.codeUnits.fold<int>(0, (sum, unit) => sum + unit);
    const colors = [
      Color(0xFFF97316),
      Color(0xFFEC4899),
      Color(0xFF3B82F6),
      Color(0xFFEAB308),
      Color(0xFF8B5CF6),
    ];
    return colors[hash % colors.length];
  }

  String get _initial => profile.name.isNotEmpty ? profile.name[0].toUpperCase() : '?';

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: _accentColor.withValues(alpha: 0.15),
                child: Text(
                  _initial,
                  style: TextStyle(
                    color: AppColors.greenDark,
                    fontWeight: FontWeight.w700,
                    fontSize: 18,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      profile.name,
                      style: Theme.of(context).textTheme.titleMedium,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'SSH, ${profile.username}, ${profile.host}',
                      style: Theme.of(context).textTheme.bodySmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: AppColors.greenMuted.withValues(alpha: 0.7)),
            ],
          ),
        ),
      ),
    );
  }
}
