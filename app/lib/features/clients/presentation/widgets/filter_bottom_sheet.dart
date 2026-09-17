import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/client.dart';
import '../providers/clients_provider.dart';

class FilterBottomSheet extends ConsumerStatefulWidget {
  const FilterBottomSheet({super.key});

  @override
  ConsumerState<FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends ConsumerState<FilterBottomSheet> {
  late String? _wilaya;
  late BusinessType? _businessType;
  late ClientStatus? _status;
  late bool? _hasDebt;
  late ClientSortBy _sortBy;

  @override
  void initState() {
    super.initState();
    final current = ref.read(clientsFilterProvider);
    _wilaya = current.wilaya;
    _businessType = current.businessType;
    _status = current.status;
    _hasDebt = current.hasDebt;
    _sortBy = current.sortBy;
  }

  @override
  Widget build(BuildContext context) {
    final clients = ref.watch(clientsProvider);
    final assignedWilayas = ref.watch(delegateAssignedWilayasProvider);

    final Set<String> distinctWilayas = {};
    for (final c in clients) {
      final w = c.wilaya.trim();
      if (w.isNotEmpty) {
        distinctWilayas.add(w);
      }
    }
    for (final w in assignedWilayas) {
      final trimmed = w.trim();
      if (trimmed.isNotEmpty) {
        distinctWilayas.add(trimmed);
      }
    }
    final sortedWilayas = distinctWilayas.toList()..sort();

    // Dynamic counts from real loaded clients
    final int retailCount = clients.where((c) => c.businessType == BusinessType.retail).length;
    final int wholesaleCount = clients.where((c) => c.businessType == BusinessType.wholesaler).length;
    final int distributorCount = clients.where((c) => c.businessType == BusinessType.distributor).length;

    final int activeCount = clients.where((c) => c.status == ClientStatus.active).length;
    final int inactiveCount = clients.where((c) => c.status == ClientStatus.inactive).length;
    final int suspendedCount = clients.where((c) => c.status == ClientStatus.suspended).length;

    final int withDebtCount = clients.where((c) => c.hasDebt).length;
    final int withoutDebtCount = clients.where((c) => !c.hasDebt).length;

    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      padding: EdgeInsets.fromLTRB(
        24,
        12,
        24,
        bottomPadding > 0 ? bottomPadding + 16 : 24,
      ),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Filtrer les clients',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    '${clients.length} client${clients.length > 1 ? 's' : ''}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Wilaya
              _FilterSection(
                label: 'Wilaya',
                child: DropdownButtonFormField<String>(
                  initialValue: _wilaya,
                  isExpanded: true,
                  decoration: _inputDecoration('Toutes les wilayas'),
                  items: [
                    DropdownMenuItem(
                      value: null,
                      child: Text('Toutes les wilayas (${clients.length})'),
                    ),
                    ...sortedWilayas.map((w) {
                      final count = clients.where((c) => c.wilaya.trim().toLowerCase() == w.toLowerCase()).length;
                      return DropdownMenuItem(
                        value: w,
                        child: Text(count > 0 ? '$w ($count)' : w),
                      );
                    }),
                  ],
                  onChanged: (v) => setState(() => _wilaya = v),
                ),
              ),
              const SizedBox(height: 16),

              // Business Type
              _FilterSection(
                label: 'Type d\'activité',
                child: DropdownButtonFormField<BusinessType>(
                  initialValue: _businessType,
                  isExpanded: true,
                  decoration: _inputDecoration('Tous les types'),
                  items: [
                    DropdownMenuItem(
                      value: null,
                      child: Text('Tous les types (${clients.length})'),
                    ),
                    DropdownMenuItem(
                      value: BusinessType.retail,
                      child: Text('Détaillant ($retailCount)'),
                    ),
                    DropdownMenuItem(
                      value: BusinessType.wholesaler,
                      child: Text('Grossiste ($wholesaleCount)'),
                    ),
                    DropdownMenuItem(
                      value: BusinessType.distributor,
                      child: Text('Distributeur ($distributorCount)'),
                    ),
                  ],
                  onChanged: (v) => setState(() => _businessType = v),
                ),
              ),
              const SizedBox(height: 16),

              // Status
              _FilterSection(
                label: 'Statut',
                child: DropdownButtonFormField<ClientStatus>(
                  initialValue: _status,
                  isExpanded: true,
                  decoration: _inputDecoration('Tous les statuts'),
                  items: [
                    DropdownMenuItem(
                      value: null,
                      child: Text('Tous les statuts (${clients.length})'),
                    ),
                    DropdownMenuItem(
                      value: ClientStatus.active,
                      child: Text('Actif ($activeCount)'),
                    ),
                    DropdownMenuItem(
                      value: ClientStatus.inactive,
                      child: Text('Inactif ($inactiveCount)'),
                    ),
                    DropdownMenuItem(
                      value: ClientStatus.suspended,
                      child: Text('Suspendu ($suspendedCount)'),
                    ),
                  ],
                  onChanged: (v) => setState(() => _status = v),
                ),
              ),
              const SizedBox(height: 16),

              // Debt / Credit status
              _FilterSection(
                label: 'Créances / Dettes',
                child: DropdownButtonFormField<bool?>(
                  initialValue: _hasDebt,
                  isExpanded: true,
                  decoration: _inputDecoration('Toutes les situations'),
                  items: [
                    DropdownMenuItem(
                      value: null,
                      child: Text('Toutes les situations (${clients.length})'),
                    ),
                    DropdownMenuItem(
                      value: true,
                      child: Text('Avec impayés ($withDebtCount)'),
                    ),
                    DropdownMenuItem(
                      value: false,
                      child: Text('Sans impayé ($withoutDebtCount)'),
                    ),
                  ],
                  onChanged: (v) => setState(() => _hasDebt = v),
                ),
              ),
              const SizedBox(height: 16),

              // Sort
              _FilterSection(
                label: 'Trier par',
                child: DropdownButtonFormField<ClientSortBy>(
                  initialValue: _sortBy,
                  isExpanded: true,
                  decoration: _inputDecoration(''),
                  items: const [
                    DropdownMenuItem(
                      value: ClientSortBy.name,
                      child: Text('A-Z (Nom)'),
                    ),
                    DropdownMenuItem(
                      value: ClientSortBy.recent,
                      child: Text('Plus récent'),
                    ),
                    DropdownMenuItem(
                      value: ClientSortBy.orders,
                      child: Text('Plus de commandes'),
                    ),
                    DropdownMenuItem(
                      value: ClientSortBy.revenue,
                      child: Text('Plus de chiffre d\'affaires'),
                    ),
                  ],
                  onChanged: (v) {
                    if (v != null) setState(() => _sortBy = v);
                  },
                ),
              ),
              const SizedBox(height: 24),

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        HapticFeedback.lightImpact();
                        ref.read(clientsFilterProvider.notifier).state =
                            const ClientsFilter();
                        Navigator.pop(context);
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.textSecondary,
                        side: const BorderSide(color: AppColors.border),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text('Réinitialiser'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        HapticFeedback.mediumImpact();
                        ref.read(clientsFilterProvider.notifier).state =
                            ClientsFilter(
                          wilaya: _wilaya,
                          businessType: _businessType,
                          status: _status,
                          hasDebt: _hasDebt,
                          sortBy: _sortBy,
                        );
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text('Appliquer'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: AppColors.textTertiary, fontSize: 15),
      filled: true,
      fillColor: const Color(0xFFF9FAFB),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
      ),
    );
  }
}

class _FilterSection extends StatelessWidget {
  final String label;
  final Widget child;

  const _FilterSection({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}
