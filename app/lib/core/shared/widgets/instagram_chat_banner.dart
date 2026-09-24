import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../router/app_router.dart';

/// An Instagram-style in-app Direct Message notification banner.
/// Slides down from the top edge with avatar, sender name, message snippet,
/// spring entrance animation, swipe-up to dismiss, and haptic feedback.
class InstagramChatBanner {
  static OverlayEntry? _currentEntry;
  static Timer? _dismissTimer;

  /// Display the Instagram-style DM banner across any screen
  static void show({
    BuildContext? context,
    required int senderId,
    required String senderName,
    String? senderRole,
    String? avatarUrl,
    required String message,
    VoidCallback? onTap,
    Duration duration = const Duration(milliseconds: 4500),
  }) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      try {
        dismiss();

        final overlayState = rootNavigatorKey.currentState?.overlay ??
            (context != null ? Overlay.maybeOf(context, rootOverlay: true) : null);

        if (overlayState == null) return;

        HapticFeedback.lightImpact().catchError((_) {});

        _currentEntry = OverlayEntry(
          builder: (ctx) => _InstagramBannerWidget(
            senderId: senderId,
            senderName: senderName,
            senderRole: senderRole,
            avatarUrl: avatarUrl,
            message: message,
            onTap: () {
              dismiss();
              if (onTap != null) {
                onTap();
              } else {
                appRouter.push('/chat/$senderId');
              }
            },
            onDismiss: dismiss,
            duration: duration,
          ),
        );

        overlayState.insert(_currentEntry!);
      } catch (_) {
        // Guard against transient overlay insertion errors
      }
    });
  }

  /// Dismiss the active banner immediately
  static void dismiss() {
    _dismissTimer?.cancel();
    _dismissTimer = null;
    try {
      _currentEntry?.remove();
    } catch (_) {}
    _currentEntry = null;
  }
}

class _InstagramBannerWidget extends StatefulWidget {
  final int senderId;
  final String senderName;
  final String? senderRole;
  final String? avatarUrl;
  final String message;
  final VoidCallback onTap;
  final VoidCallback onDismiss;
  final Duration duration;

  const _InstagramBannerWidget({
    required this.senderId,
    required this.senderName,
    this.senderRole,
    this.avatarUrl,
    required this.message,
    required this.onTap,
    required this.onDismiss,
    required this.duration,
  });

  @override
  State<_InstagramBannerWidget> createState() => _InstagramBannerWidgetState();
}

class _InstagramBannerWidgetState extends State<_InstagramBannerWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  Timer? _autoDismissTimer;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -1.1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutBack,
    ));

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );

    _scaleAnimation = Tween<double>(begin: 0.94, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );

    _controller.forward();

    _autoDismissTimer = Timer(widget.duration, () {
      if (mounted) {
        _dismissWithAnimation();
      }
    });
  }

  void _dismissWithAnimation() {
    _autoDismissTimer?.cancel();
    _controller.reverse().then((_) {
      if (mounted) {
        widget.onDismiss();
      }
    });
  }

  @override
  void dispose() {
    _autoDismissTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  String _getInitials(String name) {
    final clean = name.trim();
    if (clean.isEmpty) return 'U';
    final parts = clean.split(RegExp(r'\s+'));
    if (parts.length >= 2 && parts[0].isNotEmpty && parts[1].isNotEmpty) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return clean.substring(0, clean.length >= 2 ? 2 : 1).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Positioned(
      top: topPadding + 8,
      left: 14,
      right: 14,
      child: SlideTransition(
        position: _slideAnimation,
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: ScaleTransition(
            scale: _scaleAnimation,
            child: GestureDetector(
              onTap: widget.onTap,
              onVerticalDragUpdate: (details) {
                // Swipe up to dismiss like Instagram
                if (details.primaryDelta != null && details.primaryDelta! < -3) {
                  _dismissWithAnimation();
                }
              },
              child: Material(
                color: Colors.transparent,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF18181B), // Sleek obsidian dark
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: Colors.white.withAlpha(35),
                      width: 1.0,
                    ),
                    boxShadow: [
                      // Deep shadow
                      BoxShadow(
                        color: Colors.black.withAlpha(140),
                        blurRadius: 22,
                        offset: const Offset(0, 8),
                        spreadRadius: 0,
                      ),
                      // Ambient STI accent rim glow
                      BoxShadow(
                        color: const Color(0xFFD71920).withAlpha(45),
                        blurRadius: 18,
                        offset: const Offset(0, 2),
                        spreadRadius: -2,
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // Avatar with Instagram gradient ring
                      _buildAvatar(),

                      const SizedBox(width: 11),

                      // Sender Name, Time & Message Text
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Header Row: Name + dot + "maintenant"
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    widget.senderName,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                      letterSpacing: -0.2,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  '•',
                                  style: TextStyle(
                                    color: Colors.white.withAlpha(100),
                                    fontSize: 12,
                                  ),
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  'maintenant',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.white.withAlpha(150),
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 2),

                            // Message snippet
                            Text(
                              widget.message,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.white.withAlpha(210),
                                height: 1.25,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(width: 8),

                      // Instagram-style action cue
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withAlpha(18),
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.chat_bubble_outline_rounded,
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
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

  Widget _buildAvatar() {
    final initials = _getInitials(widget.senderName);

    return Container(
      width: 44,
      height: 44,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        // Instagram-style gradient ring
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFE31B23),
            Color(0xFFFF5252),
            Color(0xFF9E1015),
          ],
        ),
      ),
      padding: const EdgeInsets.all(2), // Gradient border width
      child: Container(
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          color: Color(0xFF1E1E24),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            if (widget.avatarUrl != null && widget.avatarUrl!.isNotEmpty)
              ClipOval(
                child: Image.network(
                  widget.avatarUrl!,
                  width: 40,
                  height: 40,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => _buildInitials(initials),
                ),
              )
            else
              _buildInitials(initials),

            // Subtle active dot at bottom right
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF22C55E), // Online green
                  border: Border.all(
                    color: const Color(0xFF18181B),
                    width: 1.5,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInitials(String initials) {
    return Center(
      child: Text(
        initials,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 13,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.2,
        ),
      ),
    );
  }
}
