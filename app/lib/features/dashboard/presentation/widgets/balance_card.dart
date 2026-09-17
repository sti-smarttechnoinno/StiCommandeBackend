import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/extensions/string_extensions.dart';
import '../providers/dashboard_provider.dart';

class BalanceCard extends ConsumerWidget {
  const BalanceCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(dashboardProvider);

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppConstants.xl),
        child: Container(
          height: 195,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              stops: [0.0, 0.45, 1.0],
              colors: [
                Color(0xFFE31B23),
                Color(0xFF9E1015),
                Color(0xFF1A0F12),
              ],
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFD71920).withAlpha(90),
                blurRadius: 28,
                offset: const Offset(0, 12),
                spreadRadius: -4,
              ),
              BoxShadow(
                color: Colors.black.withAlpha(40),
                blurRadius: 14,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Stack(
              children: [
                // Cool Geometric Light Glow (Top Right)
                Positioned(
                  right: -40,
                  top: -50,
                  child: Container(
                    width: 180,
                    height: 180,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          Colors.white.withAlpha(40),
                          const Color(0xFFFF4D4D).withAlpha(20),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),

                // Diagonal Ambient Glow Overlay
                Positioned(
                  left: -60,
                  bottom: -60,
                  child: Container(
                    width: 200,
                    height: 200,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          const Color(0xFFD71920).withAlpha(60),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),

                // Watermark STI Background Text
                Positioned(
                  right: -8,
                  bottom: -18,
                  child: Opacity(
                    opacity: 0.06,
                    child: Text(
                      'STI',
                      style: const TextStyle(
                        fontSize: 110,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: -5,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                ),

                // Card Decorative Lines
                CustomPaint(
                  size: const Size(double.infinity, 195),
                  painter: _CardMeshPainter(),
                ),

                // Main Foreground Content
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Top Row: Brand Badge + EMV Chip / Contactless
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // STI Distribution Badge
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.black.withAlpha(40),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: Colors.white.withAlpha(45),
                                width: 0.8,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Color(0xFFFF5252),
                                  ),
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  'STI DISTRIBUTION',
                                  style: TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white.withAlpha(240),
                                    letterSpacing: 1.0,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Contactless & Metallic Chip Icon
                          Row(
                            children: [
                              Icon(
                                Icons.contactless_rounded,
                                color: Colors.white.withAlpha(180),
                                size: 18,
                              ),
                              const SizedBox(width: 8),
                              _EmvChipWidget(),
                            ],
                          ),
                        ],
                      ),

                      // Middle: Solde Header & Amount
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                'SOLDE DU MOIS EN COURS',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white.withAlpha(185),
                                  letterSpacing: 0.8,
                                ),
                              ),
                              const SizedBox(width: 6),
                              GestureDetector(
                                onTap: () => ref
                                    .read(dashboardProvider.notifier)
                                    .toggleBalanceVisibility(),
                                child: Container(
                                  padding: const EdgeInsets.all(2.5),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withAlpha(25),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    state.balanceVisible
                                        ? Icons.visibility_outlined
                                        : Icons.visibility_off_outlined,
                                    size: 13,
                                    color: Colors.white.withAlpha(220),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          if (state.isInitialLoading)
                            Container(
                              width: 160,
                              height: 26,
                              decoration: BoxDecoration(
                                color: Colors.white.withAlpha(50),
                                borderRadius: BorderRadius.circular(6),
                              ),
                            )
                                .animate(onPlay: (controller) => controller.repeat(reverse: true))
                                .fade(begin: 0.35, end: 0.85, duration: 800.ms)
                          else
                            Text(
                              state.balanceVisible
                                  ? state.balance.formattedDA
                                  : '•••••••• DA',
                              style: TextStyle(
                                fontSize: state.balanceVisible ? 24 : 20,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: state.balanceVisible ? -0.5 : 2.5,
                                fontFeatures: const [FontFeature.tabularFigures()],
                              ),
                            ),
                        ],
                      ),

                      // Bottom Chips: Orders Count & Live Sync Icon Badge (No text)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _BalanceGlassChip(
                            icon: Icons.receipt_long_rounded,
                            label: 'Commandes ce mois',
                            value: state.isInitialLoading ? '...' : '${state.monthlyOrdersCount}',
                          ),

                          // Live Sync Indicator (Icons Only)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.black.withAlpha(45),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: const Color(0xFF22C55E).withAlpha(120),
                                width: 0.8,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 5.5,
                                  height: 5.5,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Color(0xFF4ADE80),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.bolt_rounded,
                                  size: 14,
                                  color: Color(0xFF4ADE80),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _EmvChipWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 24,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFFFE082),
            Color(0xFFFFC107),
            Color(0xFFFFA000),
          ],
        ),
        borderRadius: BorderRadius.circular(5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(30),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
        border: Border.all(
          color: Colors.white.withAlpha(120),
          width: 0.5,
        ),
      ),
      child: Center(
        child: Container(
          width: 20,
          height: 14,
          decoration: BoxDecoration(
            border: Border.all(
              color: Colors.black.withAlpha(40),
              width: 0.8,
            ),
            borderRadius: BorderRadius.circular(3),
          ),
        ),
      ),
    );
  }
}

class _BalanceGlassChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _BalanceGlassChip({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.black.withAlpha(35),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withAlpha(35),
          width: 0.7,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 13,
            color: Colors.white.withAlpha(210),
          ),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w500,
              color: Colors.white.withAlpha(190),
            ),
          ),
          const SizedBox(width: 5),
          Text(
            value,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

class _CardMeshPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withAlpha(12)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    final path1 = Path()
      ..moveTo(-20, size.height * 0.7)
      ..quadraticBezierTo(size.width * 0.4, size.height * 0.2, size.width + 20, size.height * 0.45);

    final path2 = Path()
      ..moveTo(-20, size.height * 0.9)
      ..quadraticBezierTo(size.width * 0.5, size.height * 0.4, size.width + 20, size.height * 0.7);

    canvas.drawPath(path1, paint);
    canvas.drawPath(path2, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
