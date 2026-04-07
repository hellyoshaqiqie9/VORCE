part of '../views/profile.dart';

class UserLeaveList extends HookConsumerWidget {
  final Profile? profile;
  final String? targetEmail;

  const UserLeaveList({
    super.key,
    required this.profile,
    this.targetEmail,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    useEffect(() {
      Future.microtask(() {
        ref.read(leaveIzinStateNotifierProvider.notifier).getNewIzinList();
      });
      return null;
    }, []);

    final leaveState = ref.watch(leaveIzinStateNotifierProvider);

    if (leaveState.isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20.0),
          child: CircularProgressIndicator(),
        ),
      );
    }

    List<dynamic> allLeaves = [];
    final rawData = leaveState.dataOrNull;

    if (rawData != null) {
      if (rawData is Map) {
        final mapData = rawData;
        if (mapData.containsKey('data') && mapData['data'] is List) {
          allLeaves = mapData['data'] as List;
        }
      } else if (rawData is List) {
        allLeaves = rawData;
      }
    }

    final filterEmail = (targetEmail ?? profile?.email ?? '').trim().toLowerCase();

    // Asumsi data izin memiliki field email untuk filter.
    final filteredLeaves = allLeaves.where((leave) {
      String leaveEmail = '';
      if (leave is Map) {
        leaveEmail = (leave['alamatEmail'] ?? leave['email'] ?? leave['userEmail'] ?? '').toString().trim().toLowerCase();

        // Fallback: Jika email kosong, coba filter by nama
        if (leaveEmail.isEmpty && profile != null) {
          String leaveName = (leave['namaKaryawan'] ?? leave['userName'] ?? '').toString().trim().toLowerCase();
          String myName = profile!.name.trim().toLowerCase();
          if (leaveName.isNotEmpty && myName.isNotEmpty && leaveName.contains(myName)) {
            return true;
          }
        }
      }
      return leaveEmail.isNotEmpty && leaveEmail == filterEmail;
    }).toList();

    // SORTING: Terbaru ke terlama
    filteredLeaves.sort((a, b) {
      DateTime dateA = DateTime(0);
      DateTime dateB = DateTime(0);
      try {
        if (a['createdAt'] != null) dateA = DateTime.parse(a['createdAt']);
        else if (a['tanggalDibuat'] != null) dateA = DateTime.parse(a['tanggalDibuat']);
      } catch (_) {}
      try {
        if (b['createdAt'] != null) dateB = DateTime.parse(b['createdAt']);
        else if (b['tanggalDibuat'] != null) dateB = DateTime.parse(b['tanggalDibuat']);
      } catch (_) {}
      return dateB.compareTo(dateA);
    });

    if (filteredLeaves.isEmpty) {
      return Center(
        child: Column(
          children: [
            const Icon(Icons.work_history_outlined, size: 48, color: AppColors.lightGrey),
            const SizedBox(height: 8),
            Text(
              "profile.no_leave_data".tr(context: context),
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
      itemCount: filteredLeaves.length,
      separatorBuilder: (context, index) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final item = filteredLeaves[index];

        String dateDisplay = '-';
        if (item['tanggalStart'] != null || item['startDate'] != null) {
          try {
            String d = item['tanggalStart'] ?? item['startDate'];
            dateDisplay = DateFormat('dd MMM yyyy').format(DateTime.parse(d));
          } catch (_) {}
        }

        String infoIzin = item['ijin'] ?? item['type'] ?? 'Izin';

        return InkWell(
          onTap: () {
            // PERUBAHAN: Langsung memanggil LeaveRequestDetailView asli dari halaman utama
            // Tanpa dibungkus Container yang membatasi height agar ukurannya natural
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (context) => LeaveRequestDetailView(item),
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
                    // Menampilkan Info Tipe Izin (Cuti/Sakit/Dinas)
                    Text(
                      infoIzin,
                      style: GoogleFonts.dmSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Icon Panah Down
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