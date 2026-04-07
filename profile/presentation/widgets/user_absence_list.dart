part of '../views/profile.dart';

class UserAbsenceList extends HookConsumerWidget {
  // Parameter untuk ID user lain (opsional)
  final String? targetUserId;

  const UserAbsenceList({
    super.key,
    this.targetUserId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    useEffect(() {
      Future.microtask(() {
        final now = DateTime.now();
        // Start date 0001-01-01 agar semua history tertarik
        const start = "0001-01-01";
        final lastDay = DateTime(now.year, now.month + 1, 0);
        final end = DateFormat('yyyy-MM-dd').format(lastDay);

        ref.read(profileAttendanceStateNotifierProvider.notifier).getAttendanceHistory(
          start: start,
          end: end,
          userId: targetUserId,
        );
      });
      return null;
    }, []);

    final attendanceState = ref.watch(profileAttendanceStateNotifierProvider);

    if (attendanceState.isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20.0),
          child: CircularProgressIndicator(),
        ),
      );
    }

    final rawData = attendanceState.dataOrNull;
    final List<Absence> absences = (rawData is List)
        ? (rawData).cast<Absence>()
        : [];

    if (absences.isEmpty) {
      return Center(
        child: Column(
          children: [
            const Icon(Icons.history_toggle_off_outlined, size: 48, color: AppColors.lightGrey),
            const SizedBox(height: 8),
            Text(
              "profile.no_absence_data".tr(context: context),
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
      itemCount: absences.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final absence = absences[index];

        // --- LOGIC MENGHITUNG DURASI ---
        String durationDisplay = '--:--:--';

        if (absence.waktuCheckIn != null && absence.waktuCheckOut != null) {
          // Hitung selisih waktu
          final duration = absence.waktuCheckOut!.difference(absence.waktuCheckIn!);

          final hours = duration.inHours.toString().padLeft(2, '0');
          final minutes = (duration.inMinutes % 60).toString().padLeft(2, '0');
          final seconds = (duration.inSeconds % 60).toString().padLeft(2, '0');

          // Format JJ:MM:DD (Jam:Menit:Detik)
          durationDisplay = '$hours:$minutes:$seconds';
        }

        String dateHeader = '-';
        if (absence.waktuCheckIn != null) {
          dateHeader = DateFormat('dd MMM yyyy').format(absence.waktuCheckIn!);
        } else if (absence.tanggal != null) {
          dateHeader = DateFormat('dd MMM yyyy').format(absence.tanggal!);
        }

        // UPDATE: Navigasi ke Halaman Presence Detail View
        return InkWell(
          onTap: () {
            // Ambil data profil user saat ini untuk melengkapi header detail
            final profile = ref.read(profileStateNotifierProvider).dataOrNull;

            // FIX FOTO: Coba ambil dari fotoKaryawan (jika ada) atau fallback ke foto
            // Menggunakan casting dynamic untuk mengakses properti fotoKaryawan jika di model Absence
            // properti tersebut ada tapi tidak terdeteksi secara statis, atau gunakan absence.foto
            dynamic checkInPhoto = absence.foto;
            try {
              // Mencoba mengambil properti fotoKaryawan jika ada
              checkInPhoto = (absence as dynamic).fotoKaryawan ?? absence.foto;
            } catch (_) {}

            // Konstruksi Object Map Employee yang dibutuhkan oleh PresenceDetailView
            // PresenceDetailView mengharapkan struktur Map<String, dynamic>
            final Map<String, dynamic> employeeData = {
              'id': profile?.id ?? 0,
              'uid': profile?.idkaryawan ?? '', // Digunakan untuk filter history lokasi
              'name': profile?.name ?? 'User',
              'email': profile?.email ?? '',
              'idKaryawan': profile?.idkaryawan ?? '',
              'photoURL': profile?.photo ?? '',
              // Masukkan data absensi dari item list ke dalam key 'attendance'
              'attendance': {
                'waktuCheckIn': absence.waktuCheckIn,
                'waktuCheckOut': absence.waktuCheckOut,

                // --- PERBAIKAN DI SINI ---
                // Pastikan key yang dikirim sesuai dengan prioritas di PresenceDetailView
                'fotoKaryawan': checkInPhoto, // Priority 1 di PresenceDetailView
                'fotoCheckIn': checkInPhoto,  // Priority 2 di PresenceDetailView

                // Foto Pulang
                'fotoPulang': absence.fotoPulang,
                'fotoCheckOut': absence.fotoPulang, // Tambahan redundansi

                'idKaryawan': profile?.idkaryawan,
              },
              // Field Top Level untuk Fallback Logic di PresenceDetailView
              'checkInTime': absence.waktuCheckIn,
              'checkOutTime': absence.waktuCheckOut,
            };

            // Navigasi langsung menggunakan MaterialPageRoute karena PresenceDetailView
            // diimport dari presence.dart (bukan route string)
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => PresenceDetailView(
                  employee: employeeData,
                  initialIndex: 1, // Buka Tab 1 (Detail Masuk/Pulang) secara default
                ),
              ),
            );
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.lightGrey.withOpacity(1),
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
                // --- Kiri: Tanggal (Bold, Hitam) ---
                Expanded(
                  child: Text(
                    dateHeader,
                    style: AppTheme.primaryTextStyle.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                ),

                const SizedBox(width: 8),

                // --- Kanan: Durasi Kerja + Arrow Right ---
                Row(
                  children: [
                    Text(
                      durationDisplay,
                      style: GoogleFonts.dmSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Icon Panah
                    const Icon(
                      Icons.keyboard_arrow_right,
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