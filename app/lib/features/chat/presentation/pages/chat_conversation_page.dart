import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../auth/presentation/controller/auth_provider.dart';
import '../../domain/models/chat_models.dart';
import '../../domain/services/active_chat_tracker.dart';
import '../providers/chat_provider.dart';

class ChatConversationPage extends ConsumerStatefulWidget {
  final int userId;
  final ChatContact? initialContact;

  const ChatConversationPage({
    super.key,
    required this.userId,
    this.initialContact,
  });

  @override
  ConsumerState<ChatConversationPage> createState() => _ChatConversationPageState();
}

class _ChatConversationPageState extends ConsumerState<ChatConversationPage> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _canSend = false;

  @override
  void initState() {
    super.initState();
    ActiveChatTracker.setViewing(widget.userId);
    _textController.addListener(_onTextChanged);
  }

  @override
  void didUpdateWidget(covariant ChatConversationPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.userId != widget.userId) {
      ActiveChatTracker.clearViewing(oldWidget.userId);
      ActiveChatTracker.setViewing(widget.userId);
    }
  }

  void _onTextChanged() {
    final canSend = _textController.text.trim().isNotEmpty;
    if (canSend != _canSend) {
      setState(() => _canSend = canSend);
    }
  }

  @override
  void dispose() {
    ActiveChatTracker.clearViewing(widget.userId);
    _textController.removeListener(_onTextChanged);
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom({bool animated = true}) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        if (animated) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOut,
          );
        } else {
          _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // 1. Resolve contact details (either passed directly or found in provider)
    final contactsList = ref.watch(chatContactsProvider).valueOrNull;
    final liveContact = contactsList?.where((c) => c.id == widget.userId).firstOrNull ?? widget.initialContact;

    // 2. Resolve conversation ID
    final knownConvId = liveContact?.conversationId;

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
        backgroundColor: const Color(0xFFF1F5F9), // Light slate gray background for chat
        appBar: _buildAppBar(liveContact),
        body: SafeArea(
          bottom: true,
          child: Column(
            children: [
              // Message list area
              Expanded(
                child: knownConvId != null
                    ? _buildMessageList(knownConvId, currentUserId)
                    : _buildResolvingConversation(currentUserId),
              ),

              // Bottom input bar
              _buildInputBar(knownConvId),
            ],
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(ChatContact? contact) {
    final name = contact?.name ?? 'Utilisateur STI';
    final role = contact?.role ?? 'commercial';
    final isOnline = contact?.isOnline ?? false;
    final lastSeen = contact?.lastSeenAt;

    return AppBar(
      elevation: 0.5,
      backgroundColor: AppColors.surface,
      surfaceTintColor: Colors.transparent,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.textPrimary, size: 20),
        onPressed: () => context.pop(),
      ),
      titleSpacing: 0,
      title: Row(
        children: [
          // Avatar + Online indicator
          Stack(
            clipBehavior: Clip.none,
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: _roleColor(role),
                child: Text(
                  contact?.initials ?? 'U',
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
                  width: 11,
                  height: 11,
                  decoration: BoxDecoration(
                    color: isOnline ? AppColors.success : AppColors.textTertiary,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 12),

          // Name and presence
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        name,
                        style: AppTypography.cardTitle.copyWith(fontSize: 16),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    _buildRoleTag(role),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  isOnline ? 'En ligne' : _formatLastSeen(lastSeen),
                  style: AppTypography.caption.copyWith(
                    color: isOnline ? AppColors.success : AppColors.textTertiary,
                    fontWeight: isOnline ? FontWeight.w600 : FontWeight.normal,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.info_outline_rounded, color: AppColors.textSecondary),
          tooltip: 'Infos contact',
          onPressed: () => _showContactDetailsModal(contact),
        ),
      ],
    );
  }

  Widget _buildRoleTag(String role) {
    String label;
    Color bg;
    Color text;

    if (role == 'delegate') {
      label = 'Délégué';
      bg = AppColors.infoLight;
      text = AppColors.info;
    } else if (role == 'commercial') {
      label = 'Commercial';
      bg = AppColors.warningLight;
      text = AppColors.warning;
    } else if (role == 'admin' || role == 'administrator') {
      label = 'Direction';
      bg = AppColors.purpleLight;
      text = AppColors.purple;
    } else {
      label = 'Staff';
      bg = AppColors.successLight;
      text = AppColors.success;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: text,
          fontSize: 9.5,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _buildResolvingConversation(int currentUserId) {
    final directConvAsync = ref.watch(directConversationIdProvider(widget.userId));

    return directConvAsync.when(
      data: (convId) => _buildMessageList(convId, currentUserId),
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      ),
      error: (err, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.danger),
              const SizedBox(height: 12),
              Text('Impossible d\'ouvrir la conversation', style: AppTypography.cardTitle),
              const SizedBox(height: 8),
              Text(
                err.toString(),
                textAlign: TextAlign.center,
                style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(directConversationIdProvider(widget.userId)),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                child: const Text('Réessayer', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMessageList(int convId, int currentUserId) {
    final messagesAsync = ref.watch(chatMessagesProvider(convId));

    return messagesAsync.when(
      data: (messages) {
        // Auto scroll to bottom whenever messages update
        _scrollToBottom();

        if (messages.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      shape: BoxShape.circle,
                      boxShadow: const [
                        BoxShadow(
                          color: AppColors.cardShadow,
                          blurRadius: 10,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.mark_chat_unread_rounded, size: 40, color: AppColors.primary),
                  ),
                  const SizedBox(height: 16),
                  Text('Démarrez la conversation', style: AppTypography.cardTitle),
                  const SizedBox(height: 6),
                  Text(
                    'Envoyez un premier message pour échanger des informations, des commandes ou des retours de visite.',
                    textAlign: TextAlign.center,
                    style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
          );
        }

        // Group messages with date separators
        final items = <_ListItem>[];
        DateTime? lastDate;

        for (final msg in messages) {
          final msgDate = DateTime(msg.createdAt.year, msg.createdAt.month, msg.createdAt.day);
          if (lastDate == null || msgDate != lastDate) {
            items.add(_DateSeparatorItem(msgDate));
            lastDate = msgDate;
          }
          items.add(_MessageItem(msg));
        }

        return ListView.builder(
          controller: _scrollController,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          physics: const BouncingScrollPhysics(),
          itemCount: items.length,
          itemBuilder: (context, index) {
            final item = items[index];
            if (item is _DateSeparatorItem) {
              return _buildDateHeader(item.date);
            } else if (item is _MessageItem) {
              final msg = item.message;
              final isMe = msg.senderId == currentUserId;
              return _MessageBubble(message: msg, isMe: isMe);
            }
            return const SizedBox.shrink();
          },
        );
      },
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      ),
      error: (err, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off_rounded, size: 48, color: AppColors.danger),
              const SizedBox(height: 12),
              Text('Erreur de chargement', style: AppTypography.cardTitle),
              const SizedBox(height: 8),
              Text(
                err.toString(),
                textAlign: TextAlign.center,
                style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDateHeader(DateTime date) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 14),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
        decoration: BoxDecoration(
          color: Colors.white.withAlpha(220),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: const [
            BoxShadow(
              color: AppColors.cardShadow,
              blurRadius: 4,
              offset: Offset(0, 1),
            ),
          ],
        ),
        child: Text(
          _formatDay(date),
          style: AppTypography.caption.copyWith(
            fontWeight: FontWeight.w700,
            fontSize: 11,
            color: AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildInputBar(int? convId) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border.withAlpha(150))),
        boxShadow: const [
          BoxShadow(
            color: AppColors.cardShadow,
            blurRadius: 8,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Text Input field
          Expanded(
            child: Container(
              constraints: const BoxConstraints(maxHeight: 120),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppColors.border),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
              child: TextField(
                controller: _textController,
                style: AppTypography.bodyMedium.copyWith(fontSize: 14),
                maxLines: null,
                textCapitalization: TextCapitalization.sentences,
                keyboardType: TextInputType.multiline,
                decoration: InputDecoration(
                  hintText: 'Écrivez votre message...',
                  hintStyle: AppTypography.bodySmall.copyWith(color: AppColors.textTertiary),
                  border: InputBorder.none,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 10),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Send button
          InkWell(
            onTap: _canSend ? () => _handleSend(convId) : null,
            borderRadius: BorderRadius.circular(24),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: _canSend ? AppColors.primary : AppColors.border,
                shape: BoxShape.circle,
                boxShadow: _canSend
                    ? [
                        BoxShadow(
                          color: AppColors.primary.withAlpha(80),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ]
                    : null,
              ),
              child: Icon(
                Icons.send_rounded,
                color: _canSend ? Colors.white : AppColors.textTertiary,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _handleSend(int? convId) async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    _textController.clear();
    setState(() => _canSend = false);

    int? targetConvId = convId;
    if (targetConvId == null) {
      try {
        targetConvId = await ref.read(directConversationIdProvider(widget.userId).future);
      } catch (_) {
        return;
      }
    }

    final finalConvId = targetConvId;
    if (finalConvId == null) return;

    ref.read(chatMessagesProvider(finalConvId).notifier).sendMessage(text);
    _scrollToBottom();
  }

  void _showContactDetailsModal(ChatContact? contact) {
    if (contact == null) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              CircleAvatar(
                radius: 36,
                backgroundColor: _roleColor(contact.role),
                child: Text(
                  contact.initials,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 24,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(contact.name, style: AppTypography.sectionTitle.copyWith(fontSize: 20)),
              const SizedBox(height: 6),
              _buildRoleTag(contact.role),
              const SizedBox(height: 20),
              const Divider(height: 1),
              const SizedBox(height: 16),
              if (contact.email != null && contact.email!.isNotEmpty)
                _buildInfoRow(Icons.email_outlined, 'Email', contact.email!),
              if (contact.phone != null && contact.phone!.isNotEmpty)
                _buildInfoRow(Icons.phone_outlined, 'Téléphone', contact.phone!),
              if (contact.wilaya != null && contact.wilaya!.isNotEmpty)
                _buildInfoRow(Icons.location_on_outlined, 'Wilaya', contact.wilaya!),
              if (contact.department != null && contact.department!.isNotEmpty)
                _buildInfoRow(Icons.business_outlined, 'Département', contact.department!),
              _buildInfoRow(
                Icons.circle,
                'Statut',
                contact.isOnline ? 'En ligne actuellement' : _formatLastSeen(contact.lastSeenAt),
                iconColor: contact.isOnline ? AppColors.success : AppColors.textTertiary,
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, {Color? iconColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: iconColor ?? AppColors.textSecondary),
          const SizedBox(width: 14),
          Text(label, style: AppTypography.bodySmall.copyWith(color: AppColors.textTertiary)),
          const Spacer(),
          Text(value, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  static Color _roleColor(String role) {
    if (role == 'delegate') return const Color(0xFF2563EB); // Royal Blue
    if (role == 'commercial') return const Color(0xFFD97706); // Amber
    if (role == 'admin' || role == 'administrator') return const Color(0xFF7C3AED); // Purple
    return const Color(0xFF059669); // Emerald
  }

  static String _formatDay(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final day = DateTime(date.year, date.month, date.day);
    final diff = today.difference(day).inDays;

    if (diff == 0) return "Aujourd'hui";
    if (diff == 1) return 'Hier';

    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year != now.year ? date.year : ''}'.trim();
  }

  static String _formatLastSeen(DateTime? lastSeen) {
    if (lastSeen == null) return 'Hors ligne';
    final now = DateTime.now();
    final diff = now.difference(lastSeen);
    if (diff.inMinutes < 2) return 'Vu(e) à l\'instant';
    if (diff.inMinutes < 60) return 'Vu(e) il y a ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'Vu(e) il y a ${diff.inHours} h';
    final day = lastSeen.day.toString().padLeft(2, '0');
    final month = lastSeen.month.toString().padLeft(2, '0');
    return 'Vu(e) le $day/$month';
  }
}

abstract class _ListItem {}

class _DateSeparatorItem extends _ListItem {
  final DateTime date;
  _DateSeparatorItem(this.date);
}

class _MessageItem extends _ListItem {
  final ChatMessage message;
  _MessageItem(this.message);
}

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMe;

  const _MessageBubble({
    required this.message,
    required this.isMe,
  });

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 3),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.76,
        ),
        decoration: BoxDecoration(
          color: isMe ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
          ),
          border: isMe ? null : Border.all(color: AppColors.border.withAlpha(120)),
          boxShadow: [
            BoxShadow(
              color: isMe ? AppColors.primary.withAlpha(35) : AppColors.cardShadow,
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 8),
        child: Column(
          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            // Message content
            Text(
              message.body,
              style: TextStyle(
                color: isMe ? Colors.white : AppColors.textPrimary,
                fontSize: 14.5,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 4),

            // Time & Seen Status
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _formatTime(message.createdAt),
                  style: TextStyle(
                    fontSize: 10.5,
                    color: isMe ? Colors.white.withAlpha(200) : AppColors.textTertiary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (isMe) ...[
                  const SizedBox(width: 5),
                  if (message.isOptimistic)
                    Icon(
                      Icons.schedule_rounded,
                      size: 13,
                      color: Colors.white.withAlpha(180),
                    )
                  else if (message.isRead) ...[
                    // Seen Badge: Cyan double checkmarks + "Vu HH:mm"
                    const Icon(
                      Icons.done_all_rounded,
                      size: 15,
                      color: Color(0xFF38BDF8), // Bright Cyan
                    ),
                    const SizedBox(width: 3),
                    Text(
                      message.readAt != null
                          ? 'Vu ${_formatTime(message.readAt!)}'
                          : 'Vu',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF38BDF8),
                      ),
                    ),
                  ] else ...[
                    // Delivered / Sent: Double checkmarks
                    Icon(
                      Icons.done_all_rounded,
                      size: 15,
                      color: Colors.white.withAlpha(180),
                    ),
                  ],
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final hour = dt.hour.toString().padLeft(2, '0');
    final minute = dt.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}
