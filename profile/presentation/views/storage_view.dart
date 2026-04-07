part of 'profile.dart';

class _StorageCategoryItem {
  final String label;
  final String iconPath;
  final double bytes;
  final double iconWidth;
  final double iconHeight;
  final bool showArrow;
  final String? route;

  _StorageCategoryItem({
    required this.label,
    required this.iconPath,
    required this.bytes,
    required this.iconWidth,
    required this.iconHeight,
    this.showArrow = true,
    this.route,
  });
}

class StorageView extends HookConsumerWidget {
  const StorageView({super.key});

  // Helper untuk mengubah bytes menjadi format yang mudah dibaca (MB / GB)
  String _formatBytes(double bytes) {
    if (bytes >= 1073741824) {
      return "${(bytes / 1073741824).toStringAsFixed(2)} GB";
    } else if (bytes >= 1048576) {
      return "${(bytes / 1048576).toStringAsFixed(2)} MB";
    } else if (bytes >= 1024) {
      return "${(bytes / 1024).toStringAsFixed(2)} KB";
    } else {
      return "${bytes.toStringAsFixed(0)} B";
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoading = useState(true);
    final hiddenTapCount = useState(0); // Secret tap counter

    // State untuk Global Storage
    final usedStorageBytes = useState<double>(0);
    final maxStorageBytes = useState<double>(1); // Default 1 agar tidak error division by zero

    // Merekam penyimpanan dari API secara murni untuk penghitungan sisa (Lainnya)
    final pureApiStorageBytes = useState<double>(0);

    // State Sorting (0: Default, 1: Terbesar/Descending, 2: Terkecil/Ascending)
    final sortMode = useState<int>(0);

    // State untuk raw bytes tiap kategori
    final infoBytes = useState<double>(0);
    final staffBytes = useState<double>(0);
    final faceIdBytes = useState<double>(0);

    final arsipBytes = useState<double>(0);
    final kehadiranBytes = useState<double>(0);
    final pesanBytes = useState<double>(0);
    final reimburseBytes = useState<double>(0);
    final tugasBytes = useState<double>(0);
    final izinBytes = useState<double>(0);
    final kinerjaBytes = useState<double>(0);

    useEffect(() {
      Future<void> fetchStorageData() async {
        try {
          final api = ref.read(profileApiProvider);

          // 1. Ambil data total & max dari API Company List
          double apiUsedStorage = 0.0;
          double maxStorage = 1.0;

          final companyRes = await api.getCompanyStaffList();
          if (companyRes.response.statusCode == 200) {
            final data = companyRes.response.data;
            if (data is Map<String, dynamic> && data['storage'] != null) {
              apiUsedStorage = (data['storage']['used'] ?? 0).toDouble();
              maxStorage = (data['storage']['max'] ?? 1).toDouble();
            }
          }
          pureApiStorageBytes.value = apiUsedStorage;

          // --- Helper untuk fetch double totalBytes dari API ---
          Future<double> fetchCategoryBytes(String category) async {
            try {
              final res = await api.getTotalFileSize(category: category);
              if (res.response.statusCode == 200 && res.response.data['totalBytes'] != null) {
                return (res.response.data['totalBytes'] as num).toDouble();
              }
            } catch (e) {
              debugPrint("Bytes fetch error for $category: $e");
            }
            return 0.0;
          }

          // 2. Ambil data spesifik per kategori (Container 1)
          infoBytes.value = await fetchCategoryBytes("info");
          staffBytes.value = await fetchCategoryBytes("staff");

          // 3. Ambil data spesifik per kategori (Container 2)
          arsipBytes.value = await fetchCategoryBytes("general");

          // --- MENGHITUNG STORAGE PESAN (CHAT) LEWAT FIRESTORE SAJA ---
          double firestoreChatBytes = 0.0;
          try {
            final pref = ref.read(appPreferenceProvider);
            final companyId = await pref.read<String>(AppPreferenceKey.idperusahaan);

            if (companyId != null && companyId.isNotEmpty) {

              // Mengambil dokumen Firestore (Sangat cepat dibanding memanggil Firebase Storage)
              final chatSnapshot = await FirebaseFirestore.instance
                  .collection('companies')
                  .doc(companyId)
                  .collection('messages')
                  .get();

              for (var doc in chatSnapshot.docs) {
                final data = doc.data();
                final type = data['type'] as String?;

                // Jika pesan memiliki ukuran akurat (pesan baru)
                if (data['size'] != null) {
                  firestoreChatBytes += (data['size'] as num).toDouble();
                }
                // ESTIMASI UNTUK PESAN LAMA YANG TIDAK MEMILIKI FIELD 'SIZE'
                else {
                  if (type == 'image') {
                    firestoreChatBytes += 512000.0; // Estimasi rata-rata gambar: ~500 KB
                  } else if (type == 'video') {
                    firestoreChatBytes += 3145728.0; // Estimasi rata-rata video: ~3 MB
                  } else if (type == 'file' || type == 'audio' || type == 'document') {
                    firestoreChatBytes += 1048576.0; // Estimasi rata-rata file: ~1 MB
                  } else if (type == 'text' && data['text'] != null) {
                    firestoreChatBytes += (data['text'] as String).length.toDouble(); // 1 char = 1 byte
                  }
                }

                // Tambahkan estimasi ukuran metadata bawaan dokumen Firestore (±150 bytes/doc)
                firestoreChatBytes += 150.0;
              }
            }
          } catch (e) {
            debugPrint("Error fetching Firestore chat storage: $e");
          }

          pesanBytes.value = firestoreChatBytes;

          // SINKRONISASI TOTAL: API Storage (42MB) + Chat Firestore Storage
          usedStorageBytes.value = pureApiStorageBytes.value + firestoreChatBytes;
          maxStorageBytes.value = maxStorage;

          reimburseBytes.value = await fetchCategoryBytes("reimbursement");
          tugasBytes.value = await fetchCategoryBytes("task");
          izinBytes.value = await fetchCategoryBytes("LEAVE_ATTACHMENT");
          kinerjaBytes.value = await fetchCategoryBytes("performance");

        } catch (e) {
          debugPrint("Error fetching storage data: $e");
        } finally {
          if (context.mounted) {
            isLoading.value = false;
          }
        }
      }

      fetchStorageData();
      return null;
    }, []);

    // Hitung progress (0.0 sampai 1.0)
    final double progressValue = (usedStorageBytes.value / maxStorageBytes.value).clamp(0.0, 1.0);
    final double percentage = progressValue * 100;

    // Logika warna Peringatan (Warning) jika Storage > 80%
    final bool isWarning = percentage > 80.0;
    final Color barColor = isWarning ? const Color(0xFFFF0000) : AppColors.featurePurple;
    final Color percentTextColor = isWarning ? const Color(0xFFFF0000) : const Color(0xFF797979);

    // Format teks storage keseluruhan
    final String globalStorageText = "${_formatBytes(usedStorageBytes.value)} / ${_formatBytes(maxStorageBytes.value)}";

    // --- HITUNG PENYIMPANAN LAINNYA (SISA STORAGE) ---
    double totalKategoriApiBytes = infoBytes.value +
        staffBytes.value +
        arsipBytes.value +
        reimburseBytes.value +
        tugasBytes.value +
        izinBytes.value +
        kinerjaBytes.value;

    double lainnyaBytes = pureApiStorageBytes.value - totalKategoriApiBytes;
    if (lainnyaBytes < 0) lainnyaBytes = 0.0; // Mencegah nilai minus jika ada ketidaksesuaian API

    // --- Pembuatan List Kategori ---
    List<_StorageCategoryItem> container1 = [
      _StorageCategoryItem(label: "storage.cat_info".tr(context: context), iconPath: Assets.icons.icInfo, bytes: infoBytes.value, iconWidth: 20, iconHeight: 20, showArrow: false),
      _StorageCategoryItem(label: "storage.cat_staff".tr(context: context), iconPath: Assets.icons.icGroups, bytes: staffBytes.value, iconWidth: 20, iconHeight: 20, showArrow: false),
    ];

    List<_StorageCategoryItem> container2 = [
      _StorageCategoryItem(label: "storage.cat_archive".tr(context: context), iconPath: Assets.icons.icFilesOutline, bytes: arsipBytes.value, iconWidth: 20, iconHeight: 16, route: Routes.archive),
      _StorageCategoryItem(label: "storage.cat_message".tr(context: context), iconPath: Assets.icons.icChatOutlined, bytes: pesanBytes.value, iconWidth: 20, iconHeight: 19, route: Routes.chat),
      _StorageCategoryItem(label: "storage.cat_reimburse".tr(context: context), iconPath: Assets.icons.icReimburst, bytes: reimburseBytes.value, iconWidth: 18, iconHeight: 20, route: Routes.reimbursement),
      _StorageCategoryItem(label: "storage.cat_task".tr(context: context), iconPath: Assets.icons.icChecRound, bytes: tugasBytes.value, iconWidth: 20, iconHeight: 20, route: Routes.task),
      _StorageCategoryItem(label: "storage.cat_leave".tr(context: context), iconPath: Assets.icons.icWorkHistoryOutlined, bytes: izinBytes.value, iconWidth: 16, iconHeight: 17, route: Routes.leaveRequest),
      _StorageCategoryItem(label: "storage.cat_performance".tr(context: context), iconPath: Assets.icons.icLeaderboard, bytes: kinerjaBytes.value, iconWidth: 20, iconHeight: 18, route: Routes.performance),

      // --- PENAMBAHAN KATEGORI LAINNYA ---
      _StorageCategoryItem(label: "storage.cat_others".tr(context: context), iconPath: Assets.icons.icStorage, bytes: lainnyaBytes, iconWidth: 20, iconHeight: 14, showArrow: false),
    ];

    // --- Logika Sorting ---
    if (sortMode.value == 1) { // Descending (Terbesar ke Terkecil)
      container1.sort((a, b) => b.bytes.compareTo(a.bytes));
      container2.sort((a, b) => b.bytes.compareTo(a.bytes));
    } else if (sortMode.value == 2) { // Ascending (Terkecil ke Terbesar)
      container1.sort((a, b) => a.bytes.compareTo(b.bytes));
      container2.sort((a, b) => a.bytes.compareTo(b.bytes));
    }

    // --- Helper Widget Pembentuk Baris Kategori Custom ---
    Widget buildCategoryRow(_StorageCategoryItem item) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: item.route != null ? () {
            // Jika menuju 'Presence' (Kehadiran), push ke Dashboard tab 1 agar Navbar muncul
            if (item.route == Routes.presence) {
              GoRouter.of(context).pushNamed(Routes.dashboard, extra: {'initialTab': 1});
            } else {
              GoRouter.of(context).pushNamed(item.route!);
            }
          } : null,
          child: Padding(
            // Menggunakan Padding "Hug Contents" agar ukuran baris mengikuti desain dan ter-center
            padding: const EdgeInsets.symmetric(vertical: 6.0), // DIUBAH DARI 14.0 MENJADI 6.0
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                SizedBox(
                  width: 28, // Lebar tetap agar ikon rata tengah dan sejajar satu sama lain
                  child: Center(
                    child: SvgPicture.asset(
                      item.iconPath,
                      width: item.iconWidth,
                      height: item.iconHeight,
                      colorFilter: const ColorFilter.mode(AppColors.darkGray, BlendMode.srcIn),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    item.label,
                    style: GoogleFonts.dmSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w600, // Ketebalan 600
                      color: AppColors.black, // Warna hitam
                    ),
                  ),
                ),
                Text(
                  _formatBytes(item.bytes),
                  style: GoogleFonts.dmSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w500, // Ketebalan 500
                    color: AppColors.greyIconUnselected, // Warna #797979
                  ),
                ),
                if (item.showArrow) ...[
                  const SizedBox(width: 8),
                  const Icon(
                    Icons.keyboard_arrow_right,
                    size: 20,
                    color: AppColors.black, // Warna arrow menjadi hitam
                  ),
                ],
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          "storage.title".tr(context: context),
          style: AppTheme.primaryTextStyle.copyWith(
            fontWeight: FontWeight.w700,
            fontSize: 16,
            color: AppColors.black,
          ),
        ),
        centerTitle: false, // Align Left
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: AppColors.black),
        // MENAMBAHKAN GARIS PEMBATAS HEADBAR (DIVIDER)
        shape: const Border(
          bottom: BorderSide(
            color: AppColors.lightGrey,
            width: 1,
          ),
        ),
        actions: [
          IconButton(
            onPressed: () {
              sortMode.value = (sortMode.value + 1) % 3;
            },
            icon: SvgPicture.asset(
              Assets.icons.icSortStorage,
              width: 20, // Mengubah ukuran ikon jadi 20x16
              height: 16,
              colorFilter: const ColorFilter.mode(AppColors.black, BlendMode.srcIn),
            ),
          ),
        ],
      ),
      body: Skeletonizer(
        enabled: isLoading.value,
        child: SingleChildScrollView(
          // MARGIN TOTAL 10px DI SEMUA SISI DARI BORDER HP
          padding: const EdgeInsets.all(10.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // --- CONTAINER STORAGE UTAMA ---
              GestureDetector(
                onTap: () {
                  hiddenTapCount.value++;
                  if (hiddenTapCount.value >= 3) {
                    hiddenTapCount.value = 0;
                    context.pushNamed(Routes.subscription);
                  }
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.lightGrey, width: 1.5),
                    boxShadow: AppTheme.cardShadow,
                  ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Padding khusus area info storage (Teks dan Progress Bar)
                    Padding(
                      padding: const EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 6),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                globalStorageText,
                                style: GoogleFonts.dmSans(
                                  fontSize: 14, // Ukuran diubah menjadi 14px
                                  fontWeight: FontWeight.w600, // Weight diubah ke 600
                                  color: AppColors.black,
                                ),
                              ),
                              Text(
                                "${percentage.toStringAsFixed(1)}%",
                                style: GoogleFonts.dmSans(
                                  fontSize: 14, // Ukuran 14px
                                  fontWeight: FontWeight.w500, // Weight 500
                                  color: percentTextColor, // Berubah jadi merah (#FF0000) jika > 80%
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Progress Bar
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: LinearProgressIndicator(
                              value: isLoading.value ? 0.3 : progressValue,
                              minHeight: 10,
                              backgroundColor: AppColors.lightGrey,
                              valueColor: AlwaysStoppedAnimation<Color>(barColor), // Berubah jadi merah (#FF0000) jika > 80%
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Tombol Tingkatkan dengan margin spesifik (10px) dan tinggi 28px
                    // Tombol Tingkatkan disembunyikan sesuai request
                    /*
                    Padding(
                      padding: const EdgeInsets.all(10.0), // Margin 10px atas, bawah, kiri, kanan
                      child: SizedBox(
                        height: 28, // Tinggi tombol persis 28px
                        width: double.infinity, // Full Width
                        child: ElevatedButton(
                          onPressed: () {
                            context.pushNamed(Routes.subscription);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.featurePurple,
                            foregroundColor: Colors.white,
                            padding: EdgeInsets.zero, // Padding 0 agar teks pas di tengah untuk tombol kecil
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: Text(
                            "storage.upgrade".tr(context: context),
                            style: GoogleFonts.dmSans(
                              fontSize: 12, // Dikecilkan sedikit agar selaras dengan tinggi 28px
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                    */
                  ],
                ),
              ),
              ),

              const SizedBox(height: 10), // Jarak antar container menyesuaikan konsep 10px

              // --- CONTAINER CATEGORY BREAKDOWN 1 ---
              AppWidgets.infoContainer(
                children: container1.map((item) => buildCategoryRow(item)).toList(),
              ),

              const SizedBox(height: 10), // Jarak antar container menyesuaikan konsep 10px

              // --- CONTAINER CATEGORY BREAKDOWN 2 ---
              AppWidgets.infoContainer(
                children: container2.map((item) => buildCategoryRow(item)).toList(),
              ),

              const SizedBox(height: 10), // Spacer bawah minimal 10px
            ],
          ),
        ),
      ),
    );
  }
}