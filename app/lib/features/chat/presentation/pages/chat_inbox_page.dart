import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../auth/presentation/controller/auth_provider.dart';
import '../../domain/models/chat_models.dart';
import '../providers/chat_provider.dart';

class ChatInboxPage extends ConsumerStatefulWidget {
  const ChatInboxPage({super.key});

  @override
  ConsumerState<ChatInboxPage> createState() => _ChatInboxPageState();
}

class _ChatInboxPageState extends ConsumerState<ChatInboxPage> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedFilter = 'all'; // 'all', 'online', 'delegate', 'commercial', 'staff'
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.trim().toLowerCase();
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final contactsAsync = ref.watch(chatContactsProvider);
    final totalUnread = ref.watch(chatUnreadCountProvider);
    final authState = ref.watch(authProvider);
    final currentUserId = int.tryParse(authState.user?['id']?.toString() ?? '0') ?? 0;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        systemNavigationBarColor: AppColors.background,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Column(
            children: [
              // Top Header
              _buildHeader(totalUnread),

              // Search Bar
              _buildSearchBar(),

              // Filter Chips
              _buildFilterChips(),

              // Body: Online Row + Contact List
              Expanded(
                child: RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: () => ref.read(chatContactsProvider.notifier).loadContacts(),
                  child: contactsAsync.when(
                    data: (contacts) {
                      // Filter by search query
                      final filtered = contacts.where((c) {
                        if (_searchQuery.isNotEmpty) {
                          final matchName = c.name.toLowerCase().contains(_searchQuery);
                          final matchWilaya = (c.wilaya ?? '').toLowerCase().contains(_searchQuery);
                          final matchRole = c.role.toLowerCase().contains(_searchQuery);
                          if (!matchName && !matchWilaya && !matchRole) return false;
                        }

                        if (_selectedFilter == 'online') {
                          return c.isOnline;
                        } else if (_selectedFilter == 'delegate') {
                          return c.isDelegate;
                        } else if (_selectedFilter == 'commercial') {
                          return c.isCommercial;
                        } else if (_selectedFilter == 'staff') {
                          return c.isStaff;
                        }
                        return true;
                      }).toList();

                      final onlineContacts = contacts.where((c) => c.isOnline).toList();

                      if (contacts.isEmpty) {
                        return _buildEmptyState(
                          icon: Icons.chat_bubble_outline_rounded,
                          title: 'Aucun contact disponible',
                          subtitle: 'Aucun utilisateur actif trouvé sur le serveur.',
                        );
                      }

                      if (filtered.isEmpty) {
                        return _buildEmptyState(
                          icon: Icons.search_off_rounded,
                          title: 'Aucun résultat trouvé',
                          subtitle: 'Essayez un autre mot-clé ou modifiez les filtres.',
                        );
                      }

                      return ListView(
                        physics: const AlwaysScrollableScrollPhysics(
                          parent: BouncingScrollPhysics(),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: AppConstants.lg),
                        children: [
                          // "En ligne maintenant" horizontal carousel
                          if (_selectedFilter == 'all' && onlineContacts.isNotEmpty && _searchQuery.isEmpty) ...[
                            _buildOnlineSection(onlineContacts),
                            const SizedBox(height: AppConstants.md),
                          ],

                          // Contacts Section Title
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: AppConstants.sm),
                            child: Row(
                              children: [
                                Text(
                                  'TOUTES LES DISCUSSIONS',
                                  style: AppTypography.caption.copyWith(
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 1.1,
                                    color: AppColors.textTertiary,
                                  ),
                                ),
                                const Spacer(),
                                Text(
                                  '${filtered.length} contact${filtered.length > 1 ? 's' : ''}',
                                  style: AppTypography.caption.copyWith(
                                    color: AppColors.textTertiary,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Contact List Cards
                          ...filtered.map((contact) {
                            return _ContactListItem(
                              contact: contact,
                              currentUserId: currentUserId,
                              onTap: () {
                                context.push('/chat/${contact.id}', extra: contact);
                              },
                            );
                          }),

                          const SizedBox(height: 32),
                        ],
                      );
                    },
                    loading: () => const Center(
                      child: CircularProgressIndicator(color: AppColors.primary),
                    ),
                    error: (err, _) => Center(
                      child: Padding(
                        padding: const EdgeInsets.all(AppConstants.xl),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.cloud_off_rounded, size: 54, color: AppColors.danger),
                            const SizedBox(height: AppConstants.md),
                            Text('Erreur de chargement', style: AppTypography.cardTitle),
                            const SizedBox(height: AppConstants.sm),
                            Text(
                              err.toString(),
                              textAlign: TextAlign.center,
                              style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
                            ),
                            const SizedBox(height: AppConstants.lg),
                            ElevatedButton.icon(
                              onPressed: () => ref.read(chatContactsProvider.notifier).loadContacts(),
                              icon: const Icon(Icons.refresh_rounded),
                              label: const Text('Réessayer'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(AppConstants.radiusMd),
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
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(int totalUnread) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppConstants.lg, vertical: AppConstants.md),
      child: Row(
        children: [
          // Back button
          InkWell(
            onTap: () => context.pop(),
            borderRadius: BorderRadius.circular(14),
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
                boxShadow: const [
                  BoxShadow(
                    color: AppColors.cardShadow,
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(
                Icons.arrow_back_ios_new_rounded,
                size: 18,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          const SizedBox(width: AppConstants.md),

          // Title
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Messagerie',
                      style: AppTypography.sectionTitle.copyWith(fontSize: 22),
                    ),
                    if (totalUnread > 0) ...[
                      const SizedBox(width: AppConstants.sm),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '$totalUnread non lu${totalUnread > 1 ? 's' : ''}',
                          style: AppTypography.caption.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                Text(
                  'Équipe STI • Délégués, Commerciaux & Direction',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),

          // Refresh action
          IconButton(
            onPressed: () => ref.read(chatContactsProvider.notifier).loadContacts(),
            icon: const Icon(Icons.sync_rounded, color: AppColors.textSecondary),
            tooltip: 'Actualiser',
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppConstants.lg, 0, AppConstants.lg, AppConstants.sm),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppConstants.radiusMd),
          border: Border.all(color: AppColors.border),
          boxShadow: const [
            BoxShadow(
              color: AppColors.cardShadow,
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: TextField(
          controller: _searchController,
          style: AppTypography.bodyMedium,
          decoration: InputDecoration(
            hintText: 'Rechercher un collègue, un rôle ou une région...',
            hintStyle: AppTypography.bodySmall.copyWith(color: AppColors.textTertiary),
            prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textTertiary, size: 22),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear_rounded, size: 18, color: AppColors.textTertiary),
                    onPressed: () => _searchController.clear(),
                  )
                : null,
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChips() {
    final filters = [
      {'key': 'all', 'label': 'Tous'},
      {'key': 'online', 'label': 'En ligne 🟢'},
      {'key': 'delegate', 'label': 'Délégués'},
      {'key': 'commercial', 'label': 'Commerciaux'},
      {'key': 'staff', 'label': 'Direction & Staff'},
    ];

    return SizedBox(
      height: 44,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: AppConstants.lg, vertical: 4),
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: filters.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final item = filters[index];
          final isSelected = _selectedFilter == item['key'];
          return ChoiceChip(
            label: Text(item['label']!),
            selected: isSelected,
            onSelected: (selected) {
              if (selected) {
                setState(() => _selectedFilter = item['key']!);
              }
            },
            selectedColor: AppColors.primary,
            backgroundColor: AppColors.surface,
            labelStyle: AppTypography.caption.copyWith(
              color: isSelected ? Colors.white : AppColors.textSecondary,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            ),
            side: BorderSide(
              color: isSelected ? AppColors.primary : AppColors.border,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
          );
        },
      ),
    );
  }

  Widget _buildOnlineSection(List<ChatContact> onlineContacts) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppConstants.radiusLg),
        border: Border.all(color: AppColors.border.withAlpha(120)),
        boxShadow: const [
          BoxShadow(
            color: AppColors.cardShadow,
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.success,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'EN LIGNE MAINTENANT',
                style: AppTypography.caption.copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 11,
                  letterSpacing: 0.8,
                  color: AppColors.textSecondary,
                ),
              ),
              const Spacer(),
              Text(
                '${onlineContacts.length}',
                style: AppTypography.caption.copyWith(
                  color: AppColors.success,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 74,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: onlineContacts.length,
              separatorBuilder: (context, index) => const SizedBox(width: 14),
              itemBuilder: (context, index) {
                final c = onlineContacts[index];
                return InkWell(
                  onTap: () => context.push('/chat/${c.id}', extra: c),
                  borderRadius: BorderRadius.circular(12),
                  child: SizedBox(
                    width: 58,
                    child: Column(
                      children: [
                        Stack(
                          clipBehavior: Clip.none,
                          children: [
                            CircleAvatar(
                              radius: 23,
                              backgroundColor: _getAvatarBg(c.role),
                              child: Text(
                                c.initials,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                            Positioned(
                              right: 0,
                              bottom: 0,
                              child: Container(
                                width: 13,
                                height: 13,
                                decoration: BoxDecoration(
                                  color: AppColors.success,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2.2),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 5),
                        Text(
                          c.name.split(' ').first,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.caption.copyWith(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.primary.withAlpha(20),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 48, color: AppColors.primary),
            ),
            const SizedBox(height: AppConstants.lg),
            Text(title, style: AppTypography.cardTitle, textAlign: TextAlign.center),
            const SizedBox(height: AppConstants.xs),
            Text(
              subtitle,
              style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  static Color _getAvatarBg(String role) {
    if (role == 'delegate') return const Color(0xFF2563EB); // Royal Blue
    if (role == 'commercial') return const Color(0xFFD97706); // Amber
    if (role == 'admin' || role == 'administrator') return const Color(0xFF7C3AED); // Purple
    return const Color(0xFF059669); // Emerald
  }
}

class _ContactListItem extends StatelessWidget {
  final ChatContact contact;
  final int currentUserId;
  final VoidCallback onTap;

  const _ContactListItem({
    required this.contact,
    required this.currentUserId,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final hasUnread = contact.unreadCount > 0;
    final latest = contact.latestMessage;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppConstants.radiusLg),
        border: Border.all(
          color: hasUnread ? AppColors.primary.withAlpha(80) : AppColors.border,
          width: hasUnread ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: hasUnread ? AppColors.primary.withAlpha(20) : AppColors.cardShadow,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppConstants.radiusLg),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              // Avatar + Presence Indicator
              Stack(
                clipBehavior: Clip.none,
                children: [
                  CircleAvatar(
                    radius: 25,
                    backgroundColor: _roleColor(contact.role),
                    child: Text(
                      contact.initials,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 13,
                      height: 13,
                      decoration: BoxDecoration(
                        color: contact.isOnline ? AppColors.success : AppColors.textTertiary,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 14),

              // Contact Details & Last Message
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Name + Role Badge
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            contact.name,
                            style: AppTypography.cardTitle.copyWith(
                              fontSize: 15,
                              fontWeight: hasUnread ? FontWeight.bold : FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        _buildRoleBadge(contact.role),
                      ],
                    ),
                    const SizedBox(height: 4),

                    // Last message snippet or Wilaya / Region
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            _buildSubtitle(),
                            style: AppTypography.caption.copyWith(
                              color: hasUnread ? AppColors.textPrimary : AppColors.textSecondary,
                              fontWeight: hasUnread ? FontWeight.w600 : FontWeight.normal,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),

              // Date/Time and Unread Badge
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (latest?.createdAt != null)
                    Text(
                      _formatDate(latest!.createdAt!),
                      style: AppTypography.caption.copyWith(
                        fontSize: 11,
                        color: hasUnread ? AppColors.primary : AppColors.textTertiary,
                        fontWeight: hasUnread ? FontWeight.bold : FontWeight.normal,
                      ),
                    )
                  else if (contact.isOnline)
                    Text(
                      'En ligne',
                      style: AppTypography.caption.copyWith(
                        fontSize: 11,
                        color: AppColors.success,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  const SizedBox(height: 6),
                  if (hasUnread)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withAlpha(60),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Text(
                        '${contact.unreadCount}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    )
                  else
                    const Icon(
                      Icons.chevron_right_rounded,
                      size: 20,
                      color: AppColors.textTertiary,
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleBadge(String role) {
    String label;
    Color bg;
    Color text;

    if (contact.isDelegate) {
      label = 'Délégué';
      bg = AppColors.infoLight;
      text = AppColors.info;
    } else if (contact.isCommercial) {
      label = 'Commercial';
      bg = AppColors.warningLight;
      text = AppColors.warning;
    } else if (contact.isAdmin) {
      label = 'Direction';
      bg = AppColors.purpleLight;
      text = AppColors.purple;
    } else {
      label = 'Staff';
      bg = AppColors.successLight;
      text = AppColors.success;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: text,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  String _buildSubtitle() {
    if (contact.latestMessage != null) {
      final isSelf = contact.latestMessage!.senderId == currentUserId;
      final prefix = isSelf ? 'Vous: ' : '';
      return '$prefix${contact.latestMessage!.body}';
    }
    if (contact.wilaya != null && contact.wilaya!.isNotEmpty) {
      return 'Région: ${contact.wilaya}';
    }
    if (contact.department != null && contact.department!.isNotEmpty) {
      return contact.department!;
    }
    return contact.email ?? 'Démarrer une conversation';
  }

  Color _roleColor(String role) {
    if (contact.isDelegate) return const Color(0xFF2563EB); // Royal Blue
    if (contact.isCommercial) return const Color(0xFFD97706); // Amber
    if (contact.isAdmin) return const Color(0xFF7C3AED); // Purple
    return const Color(0xFF059669); // Emerald
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final msgDate = DateTime(dt.year, dt.month, dt.day);

    final hour = dt.hour.toString().padLeft(2, '0');
    final min = dt.minute.toString().padLeft(2, '0');

    if (msgDate == today) {
      return '$hour:$min';
    } else if (today.difference(msgDate).inDays == 1) {
      return 'Hier';
    } else {
      final day = dt.day.toString().padLeft(2, '0');
      final month = dt.month.toString().padLeft(2, '0');
      return '$day/$month';
    }
  }
}
