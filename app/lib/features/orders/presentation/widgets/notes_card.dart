import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/order_provider.dart';

class NotesCard extends ConsumerStatefulWidget {
  final String? notes;
  final String author;
  final bool isEditable;

  const NotesCard({
    super.key,
    this.notes,
    this.author = '',
    this.isEditable = false,
  });

  @override
  ConsumerState<NotesCard> createState() => _NotesCardState();
}

class _NotesCardState extends ConsumerState<NotesCard> {
  late final TextEditingController _controller;

  static const List<String> _quickChips = [
    'Livraison urgente',
    'Appeler avant passage',
    'Livrer le matin',
    'Paiement à la livraison',
    'Facture requise',
  ];

  @override
  void initState() {
    super.initState();
    final initialText = widget.notes ?? (widget.isEditable ? ref.read(orderNotesProvider) : '');
    _controller = TextEditingController(text: initialText);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _addChipText(String text) {
    final current = _controller.text.trim();
    if (current.isEmpty) {
      _controller.text = text;
    } else if (!current.contains(text)) {
      _controller.text = '$current • $text';
    }
    _controller.selection = TextSelection.fromPosition(
      TextPosition(offset: _controller.text.length),
    );
    ref.read(orderNotesProvider.notifier).state = _controller.text;
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isEditable) {
      return _buildReadOnlyCard();
    }
    return _buildEditableCard();
  }

  Widget _buildReadOnlyCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border.withAlpha(50)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(5),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: AppColors.info.withAlpha(15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.note_alt_outlined,
                    color: AppColors.info, size: 15),
              ),
              const SizedBox(width: 8),
              const Text(
                'Notes & Remarques',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (widget.notes != null && widget.notes!.isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.infoLight.withAlpha(60),
                borderRadius: BorderRadius.circular(10),
                border: const Border(
                  left: BorderSide(
                    color: AppColors.info,
                    width: 3,
                  ),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '"${widget.notes}"',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textPrimary,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  if (widget.author.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      '— ${widget.author}',
                      style: const TextStyle(
                        fontSize: 10.5,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ],
              ),
            )
          else
            const Text(
              'Aucune note pour cette commande.',
              style: TextStyle(
                fontSize: 11.5,
                color: AppColors.textTertiary,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEditableCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border.withAlpha(50)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(6),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.primary.withAlpha(15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.edit_note_rounded,
                  color: AppColors.primary,
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              const Text(
                'Notes & Remarques',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.border.withAlpha(50),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Optionnel',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textTertiary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: _quickChips.map((chip) {
                final isIncluded = _controller.text.contains(chip);
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: InkWell(
                    onTap: () => _addChipText(chip),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                      decoration: BoxDecoration(
                        color: isIncluded
                            ? AppColors.primary.withAlpha(15)
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isIncluded
                              ? AppColors.primary.withAlpha(50)
                              : Colors.transparent,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isIncluded ? Icons.check_rounded : Icons.add_rounded,
                            size: 12,
                            color: isIncluded ? AppColors.primary : AppColors.textSecondary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            chip,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: isIncluded ? FontWeight.w700 : FontWeight.w500,
                              color: isIncluded ? AppColors.primary : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _controller,
            minLines: 3,
            maxLines: 5,
            textInputAction: TextInputAction.newline,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textPrimary,
              height: 1.4,
            ),
            onChanged: (val) {
              ref.read(orderNotesProvider.notifier).state = val;
              setState(() {});
            },
            decoration: InputDecoration(
              hintText: 'Ajouter une instruction particulière, remarque client ou note de livraison...',
              hintStyle: TextStyle(
                fontSize: 12.5,
                color: AppColors.textTertiary.withAlpha(180),
              ),
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              contentPadding: const EdgeInsets.all(14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: AppColors.border.withAlpha(70)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: AppColors.border.withAlpha(70)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
              ),
              suffixIcon: _controller.text.isNotEmpty
                  ? IconButton(
                      tooltip: 'Effacer',
                      icon: const Icon(Icons.clear_rounded, size: 18),
                      onPressed: () {
                        _controller.clear();
                        ref.read(orderNotesProvider.notifier).state = '';
                        setState(() {});
                      },
                    )
                  : null,
            ),
          ),
        ],
      ),
    );
  }
}
