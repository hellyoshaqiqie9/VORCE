part of '../views/profile.dart';

class UserReimburseList extends HookConsumerWidget {
  final Profile? profile;
  // ADDED: Parameter targetEmail untuk filter data orang lain
  final String? targetEmail;

  const UserReimburseList({
    super.key,
    required this.profile,
    this.targetEmail,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    useEffect(() {
      Future.microtask(() {
        ref.read(reimbursementListStateNotifierProvider.notifier).getReimbursementList();
      });
      return null;
    }, []);

    final reimburseState = ref.watch(reimbursementListStateNotifierProvider);

    if (reimburseState.isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20.0),
          child: CircularProgressIndicator(),
        ),
      );
    }

    // --- FIX: LOGIKA PARSING DATA YANG AMAN (Mencegah Error Type Cast List) ---
    final rawData = reimburseState.dataOrNull;
    List<ReimbursementModel> allReimburses = [];

    if (rawData != null && rawData is List) {
      allReimburses = rawData.map((item) {
        if (item is ReimbursementModel) {
          return item;
        } else if (item is Map<String, dynamic>) {
          return ReimbursementModel.fromJson(item);
        } else if (item is Map) {
          return ReimbursementModel.fromJson(Map<String, dynamic>.from(item));
        }
        return null; // Abaikan jika tipe datanya tidak dikenali
      }).whereType<ReimbursementModel>().toList();
    }
    // -------------------------------------------------------------------------

    // --- FILTER LOGIC ---
    // Gunakan targetEmail jika ada (dari StaffProfileView), jika tidak gunakan email profile login
    final filterEmail = (targetEmail ?? profile?.email ?? '').trim().toLowerCase();

    // Lakukan filter jika data memiliki field email/userId yang bisa dicek
    final filteredReimburses = allReimburses.where((reimburse) {
      final assignedEmail = (reimburse.requestByEmail ?? '').trim().toLowerCase();
      return assignedEmail.isNotEmpty && assignedEmail == filterEmail;
    }).toList();

    filteredReimburses.sort((a, b) {
      DateTime dateA = DateTime(0);
      DateTime dateB = DateTime(0);

      try { if (a.createdAt != null) dateA = DateTime.parse(a.createdAt!); } catch (_) {}
      try { if (b.createdAt != null) dateB = DateTime.parse(b.createdAt!); } catch (_) {}

      return dateB.compareTo(dateA);
    });

    if (filteredReimburses.isEmpty) {
      return Center(
        child: Column(
          children: [
            const Icon(Icons.receipt_long_outlined, size: 48, color: AppColors.lightGrey),
            const SizedBox(height: 8),
            Text(
              "profile.no_reimburse_data".tr(context: context),
              style: GoogleFonts.dmSans(color: AppColors.darkGray),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      itemCount: filteredReimburses.length,
      separatorBuilder: (context, index) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final item = filteredReimburses[index];

        String dateDisplay = '-';
        if (item.createdAt != null) {
          try {
            dateDisplay = DateFormat('dd MMM yyyy').format(DateTime.parse(item.createdAt!));
          } catch (_) {}
        }

        String amountDisplay = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(item.amount ?? 0);

        // UPDATE: Menambahkan navigasi onTap untuk memunculkan Detail Sheet
        return InkWell(
          onTap: () {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true, // Memastikan sheet dapat membentang penuh bila isinya panjang
              backgroundColor: Colors.transparent,
              builder: (context) => ReimbursementDetailSheet(data: item),
            );
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.lightGrey,
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                )
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Text(
                    dateDisplay,
                    style: AppTheme.primaryTextStyle.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                ),

                const SizedBox(width: 8),

                Row(
                  children: [
                    Text(
                      amountDisplay,
                      style: GoogleFonts.dmSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Icon Panah Down disamakan dengan gaya Tugas (menandakan pop-up sheet dari bawah)
                    const Icon(
                      Icons.keyboard_arrow_down_rounded,
                      size: 20,
                      color: AppColors.black,
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}