class ChatMessageSnippet {
  final int id;
  final String body;
  final int senderId;
  final bool isRead;
  final DateTime? readAt;
  final DateTime? createdAt;

  const ChatMessageSnippet({
    required this.id,
    required this.body,
    required this.senderId,
    required this.isRead,
    this.readAt,
    this.createdAt,
  });

  factory ChatMessageSnippet.fromJson(Map<String, dynamic> json) {
    return ChatMessageSnippet(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      body: json['body'] as String? ?? '',
      senderId: json['sender_id'] is int
          ? json['sender_id']
          : int.tryParse(json['sender_id'].toString()) ?? 0,
      isRead: json['is_read'] == true || json['is_read'] == 1,
      readAt: json['read_at'] != null ? DateTime.tryParse(json['read_at'].toString()) : null,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
    );
  }
}

class ChatContact {
  final int id;
  final String name;
  final String? username;
  final String? email;
  final String? phone;
  final String role;
  final String? department;
  final String? region;
  final String? wilaya;
  final bool isOnline;
  final DateTime? lastSeenAt;
  final int? conversationId;
  final int unreadCount;
  final ChatMessageSnippet? latestMessage;

  const ChatContact({
    required this.id,
    required this.name,
    this.username,
    this.email,
    this.phone,
    required this.role,
    this.department,
    this.region,
    this.wilaya,
    this.isOnline = false,
    this.lastSeenAt,
    this.conversationId,
    this.unreadCount = 0,
    this.latestMessage,
  });

  factory ChatContact.fromJson(Map<String, dynamic> json) {
    return ChatContact(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      name: json['name'] as String? ?? 'Utilisateur',
      username: json['username'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      role: json['role'] as String? ?? 'commercial',
      department: json['department'] as String?,
      region: json['region'] as String?,
      wilaya: json['wilaya'] as String?,
      isOnline: json['is_online'] == true || json['is_online'] == 1,
      lastSeenAt: json['last_seen_at'] != null
          ? DateTime.tryParse(json['last_seen_at'].toString())
          : null,
      conversationId: json['conversation_id'] is int
          ? json['conversation_id']
          : int.tryParse(json['conversation_id']?.toString() ?? ''),
      unreadCount: json['unread_count'] is int
          ? json['unread_count']
          : int.tryParse(json['unread_count']?.toString() ?? '') ?? 0,
      latestMessage: json['latest_message'] is Map<String, dynamic>
          ? ChatMessageSnippet.fromJson(json['latest_message'] as Map<String, dynamic>)
          : null,
    );
  }

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.isEmpty) return 'U';
    if (parts.length == 1) return parts[0].substring(0, parts[0].length >= 2 ? 2 : 1).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  bool get isDelegate => role == 'delegate';
  bool get isCommercial => role == 'commercial';
  bool get isAdmin => role == 'admin' || role == 'administrator';
  bool get isStaff => !isDelegate && !isCommercial;
}

class ChatMessage {
  final int id;
  final int conversationId;
  final int senderId;
  final String body;
  final String? attachmentUrl;
  final String? attachmentType;
  final bool isRead;
  final DateTime? readAt;
  final DateTime? deliveredAt;
  final DateTime createdAt;
  final bool isOptimistic;

  const ChatMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.body,
    this.attachmentUrl,
    this.attachmentType,
    required this.isRead,
    this.readAt,
    this.deliveredAt,
    required this.createdAt,
    this.isOptimistic = false,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      conversationId: json['conversation_id'] is int
          ? json['conversation_id']
          : int.tryParse(json['conversation_id'].toString()) ?? 0,
      senderId: json['sender_id'] is int
          ? json['sender_id']
          : int.tryParse(json['sender_id'].toString()) ?? 0,
      body: json['body'] as String? ?? '',
      attachmentUrl: json['attachment_url'] as String?,
      attachmentType: json['attachment_type'] as String?,
      isRead: json['is_read'] == true || json['is_read'] == 1,
      readAt: json['read_at'] != null ? DateTime.tryParse(json['read_at'].toString()) : null,
      deliveredAt: json['delivered_at'] != null ? DateTime.tryParse(json['delivered_at'].toString()) : null,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      isOptimistic: json['is_optimistic'] == true,
    );
  }

  ChatMessage copyWith({
    bool? isRead,
    DateTime? readAt,
    bool? isOptimistic,
  }) {
    return ChatMessage(
      id: id,
      conversationId: conversationId,
      senderId: senderId,
      body: body,
      attachmentUrl: attachmentUrl,
      attachmentType: attachmentType,
      isRead: isRead ?? this.isRead,
      readAt: readAt ?? this.readAt,
      deliveredAt: deliveredAt,
      createdAt: createdAt,
      isOptimistic: isOptimistic ?? this.isOptimistic,
    );
  }
}
