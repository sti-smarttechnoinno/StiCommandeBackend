import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../router/app_router.dart';
import '../../utils/notification_translations.dart';

class InAppNotificationBanner {
  static OverlayEntry? _currentEntry;
  static _PendingBanner? _pendingBanner;
  static bool _retryScheduled = false;

  /// Show floating top notification banner across any screen reliably
  static void show({
    BuildContext? context,
    required String title,
    required String message,
    String? actionLabel,
    IconData icon = Icons.track_changes_rounded,
    VoidCallback? onTap,
    Duration duration = const Duration(seconds: 6),
  }) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      try {
        // Dismiss any active banner first
        dismiss();

        final overlayState = rootNavigatorKey.currentState?.overlay ??
            (context != null ? Overlay.maybeOf(context, rootOverlay: true) : null);

        if (overlayState == null) {
          // Queue banner and retry when overlay becomes available
          _pendingBanner = _PendingBanner(
            title: title,
            message: message,
            actionLabel: actionLabel,
            icon: icon,
            onTap: onTap,
            duration: duration,
          );
          _scheduleRetry();
          return;
        }

        _insertBanner(
          overlayState: overlayState,
          title: title,
          message: message,
          actionLabel: actionLabel,
          icon: icon,
          onTap: onTap,
          duration: duration,
        );
      } catch (_) {
        // Guard against transient overlay insertion errors
      }
    });
  }

  static void _scheduleRetry() {
    if (_retryScheduled) return;
    _retryScheduled = true;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _retryScheduled = false;

      if (_pendingBanner == null) return;

      final overlayState = rootNavigatorKey.currentState?.overlay;
      if (overlayState == null) {
        // Still not ready, try again
        _scheduleRetry();
        return;
      }

      final pending = _pendingBanner!;
      _pendingBanner = null;

      _insertBanner(
        overlayState: overlayState,
        title: pending.title,
        message: pending.message,
        actionLabel: pending.actionLabel,
        icon: pending.icon,
        onTap: pending.onTap,
        duration: pending.duration,
      );
    });
  }

  static void _insertBanner({
    required OverlayState overlayState,
    required String title,
    required String message,
    String? actionLabel,
    required IconData icon,
    VoidCallback? onTap,
    required Duration duration,
  }) {
    final isRtl = NotificationLocalizer.isArabic;
    final resolvedActionLabel = actionLabel ?? (isRtl ? 'عرض' : 'Voir');

    HapticFeedback.mediumImpact().catchError((_) {});

    _currentEntry = OverlayEntry(
      builder: (ctx) => _BannerWidget(
        title: title,
        message: message,
        actionLabel: resolvedActionLabel,
        isRtl: isRtl,
        icon: icon,
        onTap: () {
          dismiss();
          onTap?.call();
        },
        onDismiss: dismiss,
        duration: duration,
      ),
    );

    overlayState.insert(_currentEntry!);
  }

  static void dismiss() {
    try {
      _currentEntry?.remove();
    } catch (_) {
      // Ignored if already removed
    }
    _currentEntry = null;
  }
}

class _PendingBanner {
  final String title;
  final String message;
  final String? actionLabel;
  final IconData icon;
  final VoidCallback? onTap;
  final Duration duration;

  _PendingBanner({
    required this.title,
    required this.message,
    this.actionLabel,
    required this.icon,
    this.onTap,
    required this.duration,
  });
}

class _BannerWidget extends StatefulWidget {
  final String title;
  final String message;
  final String actionLabel;
  final bool isRtl;
  final IconData icon;
  final VoidCallback onTap;
  final VoidCallback onDismiss;
  final Duration duration;

  const _BannerWidget({
    required this.title,
    required this.message,
    required this.actionLabel,
    required this.isRtl,
    required this.icon,
    required this.onTap,
    required this.onDismiss,
    required this.duration,
  });

  @override
  State<_BannerWidget> createState() => _BannerWidgetState();
}

class _BannerWidgetState extends State<_BannerWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 380),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -1.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    ));

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(_controller);

    _controller.forward();

    // Auto dismiss after duration
    Future.delayed(widget.duration, () {
      if (mounted) {
        _dismissWithAnimation();
      }
    });
  }

  void _dismissWithAnimation() {
    _controller.reverse().then((_) {
      if (mounted) {
        widget.onDismiss();
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;
    final timeLabel = widget.isRtl ? 'الآن' : 'Maintenant';
    final dismissLabel = widget.isRtl ? 'تجاهل' : 'Ignorer';

    return Positioned(
      top: topPadding + 8,
      left: 14,
      right: 14,
      child: SlideTransition(
        position: _slideAnimation,
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: GestureDetector(
            onTap: widget.onTap,
            onVerticalDragUpdate: (details) {
              if (details.primaryDelta != null && details.primaryDelta! < -4) {
                _dismissWithAnimation();
              }
            },
            child: Directionality(
              textDirection: widget.isRtl ? TextDirection.rtl : TextDirection.ltr,
              child: Material(
                color: Colors.transparent,
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF111827), // Slate 900
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: const Color(0xFF374151), // Slate 700
                      width: 1.0,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(90),
                        blurRadius: 22,
                        offset: const Offset(0, 8),
                      ),
                      BoxShadow(
                        color: const Color(0xFFD71920).withAlpha(40),
                        blurRadius: 14,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top Row: Icon + Title & Time
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Notification Icon Bubble
                          Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  Color(0xFFE52E38),
                                  Color(0xFFB31219),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(11),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFD71920).withAlpha(70),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Icon(
                                widget.icon,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),

                          // Title and Time Tag Column
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        widget.title,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontSize: 13.5,
                                          fontWeight: FontWeight.w800,
                                          color: Colors.white,
                                          letterSpacing: -0.2,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      timeLabel,
                                      style: TextStyle(
                                        fontSize: 10.5,
                                        color: Colors.white.withAlpha(150),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 3.5),
                                // Description (full width)
                                Text(
                                  widget.message,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.white.withAlpha(210),
                                    height: 1.3,
                                    fontWeight: FontWeight.w400,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 10),

                      // Bottom Action Row: Action CTA Button & Dismiss
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          // Dismiss button
                          InkWell(
                            onTap: _dismissWithAnimation,
                            borderRadius: BorderRadius.circular(6),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              child: Text(
                                dismissLabel,
                                style: TextStyle(
                                  fontSize: 11.5,
                                  color: Colors.white.withAlpha(160),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Localized CTA Action Button
                          InkWell(
                            onTap: widget.onTap,
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    Color(0xFFE52E38),
                                    Color(0xFFB9141B),
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFFD71920).withAlpha(80),
                                    blurRadius: 6,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    widget.actionLabel,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Icon(
                                    widget.isRtl
                                        ? Icons.arrow_back_rounded
                                        : Icons.arrow_forward_rounded,
                                    size: 13,
                                    color: Colors.white,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
