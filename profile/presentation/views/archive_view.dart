// ignore_for_file: prefer_const_constructors

part of 'archive.dart';

class ArchiveView extends HookConsumerWidget {
  const ArchiveView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Definisi nama-nama Tab
    final List<String> tabNames = [
      "archive_page.tab_contact".tr(context: context),
      "archive_page.tab_files".tr(context: context),
      "archive_page.tab_attend".tr(context: context),
      "archive_page.tab_leave_short".tr(context: context),
      "archive_page.tab_reimburse".tr(context: context),
      "archive_page.tab_task".tr(context: context),
    ];

    // Controller Tab
    final tabController = useTabController(initialLength: tabNames.length);

    // Listen perubahan tab agar UI Chip terupdate saat di-swipe
    useListenable(tabController);

    // --- STATE PENCARIAN & SORTING ---
    final isSearching = useState(false);
    final searchText = useState("");
    final isDescending = useState(true);

    final focusSearch = useFocusNode();
    // ---------------------------------

    // State Tahun (Untuk Tab Hadir, Izin, Reimburse, Tugas)
    final selectedYear = useState<int?>(null);
    final sentStatus = useState<Map<String, String>>({});

    // State Admin Check
    final profile = ref.watch(profileStateNotifierProvider).dataOrNull;
    final isAdmin = useState(false);

    final List<String> months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    // Cek Status Admin secara reaktif
    useEffect(() {
      if (profile != null) {
        final cleanJabatan = profile.jabatan?.trim().toLowerCase() ?? '';
        final privilegedRoles = ['owner', 'hrd', 'manager', 'manajer', 'pimpinan', 'direktur', 'head', 'supervisor', 'spv', 'admin'];
        bool isRoleAdmin = privilegedRoles.any((r) => cleanJabatan.contains(r));
        isAdmin.value = isRoleAdmin;
      } else {
        Future.microtask(() async {
          try {
            final prefs = ref.read(appPreferenceProvider);

            // 1. Cek flag isAdmin
            final isAdminStr = await prefs.read<String>(AppPreferenceKey.isAdmin);
            bool isFlagAdmin = isAdminStr?.toLowerCase() == 'true';

            // 2. Cek Jabatan
            final jabatanStr = await prefs.read<String>(AppPreferenceKey.jabatan);

            // 3. Cek Role
            final roleStr = await prefs.read<String>(AppPreferenceKey.role);

            final privilegedRoles = ['owner', 'hrd', 'manager', 'manajer', 'pimpinan', 'direktur', 'head', 'supervisor', 'spv', 'admin'];

            bool isPrivilegedJabatan = false;
            if (jabatanStr != null) {
              isPrivilegedJabatan = privilegedRoles.any((r) => jabatanStr.toLowerCase().contains(r));
            }

            bool isPrivilegedRole = false;
            if (roleStr != null) {
              isPrivilegedRole = privilegedRoles.any((r) => roleStr.toLowerCase().contains(r));
            }

            if (context.mounted) {
              isAdmin.value = isFlagAdmin || isPrivilegedJabatan || isPrivilegedRole;
            }
          } catch (e) {
            debugPrint("Error checkAdmin: $e");
            if (context.mounted) isAdmin.value = false;
          }
        });
      }
      return null;
    }, [profile]);

    useEffect(() {
      void listener() {
        if (tabController.indexIsChanging) {
          isSearching.value = false;
          searchText.value = "";
          focusSearch.unfocus();
        }
      }
      tabController.addListener(listener);
      return () => tabController.removeListener(listener);
    }, [tabController]);

    String getReportKey(int year, int monthIndex, String type) {
      return "archive_sent_${year}_${monthIndex}_$type";
    }

    Future<void> loadSentStatus() async {
      if (selectedYear.value == null) return;
      final prefs = await SharedPreferences.getInstance();
      final Map<String, String> newStatus = {};
      final year = selectedYear.value!;
      final types = ['presence', 'leave', 'reimburse', 'tugas'];

      for (int i = 0; i < 12; i++) {
        for (var type in types) {
          String key = getReportKey(year, i, type);
          String? dateSent = prefs.getString(key);
          if (dateSent != null) newStatus[key] = dateSent;
        }
      }
      sentStatus.value = newStatus;
    }

    useEffect(() {
      loadSentStatus();
      return null;
    }, [selectedYear.value]);

    final now = DateTime.now();
    List<String> displayedMonths = [];
    if (selectedYear.value == null) {
      displayedMonths = [];
    } else if (selectedYear.value! < now.year) {
      displayedMonths = months;
    } else if (selectedYear.value! == now.year) {
      // PERBAIKAN: Hanya tampilkan bulan yang sudah lewat (selesai).
      // Menggunakan now.month - 1 agar bulan yang sedang berjalan tidak muncul.
      // Contoh: Sekarang Februari (2), limit = 1 -> Sublist(0,1) = [Januari].
      int limit = now.month - 1;
      if (limit < 0) limit = 0; // Safety check untuk Januari (limit=0, list kosong)
      displayedMonths = months.sublist(0, limit);
    } else {
      displayedMonths = [];
    }

    Future<void> sendReport({
      required int monthIndex,
      required String type,
    }) async {
      if (selectedYear.value == null) return;
      final int year = selectedYear.value!;
      final int month = monthIndex + 1;
      final DateTime startDate = DateTime(year, month, 1, 0, 0, 0);
      final DateTime endDate = DateTime(year, month + 1, 0, 23, 59, 59);

      try {
        AppDialog.showLoading(context);

        if (type == 'presence') {
          final result = await ref
              .read(archiveStatKehadiranStateNotifierProvider.notifier)
              .getArchiveStatKehadiran(
            tglstart: startDate.toIso8601String(),
            tglend: endDate.toIso8601String(),
          );
          result.fold(
                (error) => AppToast.showToast(msg: "archive_page.failed_send".tr(context: context)),
                (success) async {
              AppToast.showToast(
                msg: "archive_page.success_send".tr(
                  args: ["archive_page.tab_presence".tr(context: context), months[monthIndex]],
                  context: context,
                ),
              );
              final prefs = await SharedPreferences.getInstance();
              final String key = getReportKey(year, monthIndex, type);
              final String dateStr = DateFormat('dd/MM/yyyy').format(DateTime.now());
              await prefs.setString(key, dateStr);
              loadSentStatus();
            },
          );
        } else if (type == 'leave') {
          final result = await ref
              .read(archiveStatLaporanStateNotifierProvider.notifier)
              .getArchiveStatLaporan(
            tglstart: startDate.toIso8601String(),
            tglend: endDate.toIso8601String(),
          );
          result.fold(
                (error) => AppToast.showToast(msg: "archive_page.failed_send".tr(context: context)),
                (success) async {
              AppToast.showToast(
                msg: "archive_page.success_send".tr(
                  args: ["archive_page.tab_leave".tr(context: context), months[monthIndex]],
                  context: context,
                ),
              );
              final prefs = await SharedPreferences.getInstance();
              final String key = getReportKey(year, monthIndex, type);
              final String dateStr = DateFormat('dd/MM/yyyy').format(DateTime.now());
              await prefs.setString(key, dateStr);
              loadSentStatus();
            },
          );
        } else if (type == 'reimburse') {
          final result = await ref
              .read(archiveStatReimburseStateNotifierProvider.notifier)
              .getArchiveStatReimburse(
            tglstart: startDate.toIso8601String(),
            tglend: endDate.toIso8601String(),
          );
          result.fold(
                (error) => AppToast.showToast(msg: "archive_page.failed_send_reimburse".tr(context: context)),
                (success) async {
              AppToast.showToast(
                msg: "archive_page.success_send_reimburse".tr(args: [months[monthIndex]], context: context),
              );
              final prefs = await SharedPreferences.getInstance();
              final String key = getReportKey(year, monthIndex, type);
              final String dateStr = DateFormat('dd/MM/yyyy').format(DateTime.now());
              await prefs.setString(key, dateStr);
              loadSentStatus();
            },
          );
        } else if (type == 'tugas') {
          final result = await ref
              .read(archiveStatTugasStateNotifierProvider.notifier)
              .getArchiveStatTugas(
            tglstart: startDate.toIso8601String(),
            tglend: endDate.toIso8601String(),
          );
          result.fold(
                (error) => AppToast.showToast(msg: "archive_page.failed_send_tugas".tr(context: context)),
                (success) async {
              AppToast.showToast(
                msg: "archive_page.success_send_tugas".tr(args: [months[monthIndex]], context: context),
              );
              final prefs = await SharedPreferences.getInstance();
              final String key = getReportKey(year, monthIndex, type);
              final String dateStr = DateFormat('dd/MM/yyyy').format(DateTime.now());
              await prefs.setString(key, dateStr);
              loadSentStatus();
            },
          );
        }
      } catch (e) {
        AppToast.showToast(msg: "archive_page.error".tr(args: [e.toString()], context: context));
      } finally {
        AppDialog.closeLoading(context);
      }
    }

    Future<void> showYearPicker(BuildContext context) async {
      final int? result = await showDialog<int>(
        context: context,
        builder: (BuildContext context) {
          return _YearPickerDialog(initialYear: selectedYear.value ?? DateTime.now().year);
        },
      );
      if (result != null) {
        selectedYear.value = result;
      }
    }

    bool showSearchSort = tabController.index == 0 || tabController.index == 1;
    bool showCalendar = tabController.index >= 2;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        titleSpacing: 0,
        title: isSearching.value
            ? AppWidgets.textField(
          label: "archive_page.search_label".tr(context: context),
          name: 'search',
          hint: "archive_page.search_hint".tr(context: context),
          focusNode: focusSearch,
          keyboardType: TextInputType.text,
          initialValue: searchText.value,
          onChanged: (val) => searchText.value = val ?? '',
          withoutInputDecoration: true,
        )
            : Text(
          "archive_page.title".tr(context: context),
          style: AppTheme.primaryTextStyle.copyWith(
            fontWeight: FontWeight.w700,
            fontSize: 16,
            color: AppColors.black,
          ),
        ),
        leading: isSearching.value
            ? IconButton(
          icon: const Icon(Icons.close, color: Colors.black),
          onPressed: () {
            isSearching.value = false;
            searchText.value = "";
            focusSearch.unfocus();
          },
        )
            : null,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: Colors.white,
        centerTitle: false,
        iconTheme: const IconThemeData(color: AppColors.black),
        shape: const Border(bottom: BorderSide.none),
        actions: [
          if (showSearchSort) ...[
            if (!isSearching.value)
              IconButton(
                onPressed: () {
                  isSearching.value = true;
                  Future.microtask(() => focusSearch.requestFocus());
                },
                icon: const Icon(Icons.search, color: AppColors.black),
              ),
            IconButton(
              onPressed: () {
                isDescending.value = !isDescending.value;
                AppToast.showToast(msg: isDescending.value ? "archive_page.sort_newest".tr(context: context) : "archive_page.sort_oldest".tr(context: context));
              },
              icon: SvgPicture.asset(
                Assets.icons.icArrowSort,
                width: AppTheme.iconSize,
                height: AppTheme.iconSize,
                colorFilter: const ColorFilter.mode(AppColors.black, BlendMode.srcIn),
              ),
              tooltip: "Urutkan Waktu",
            ),
          ],
          if (showCalendar)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: InkWell(
                onTap: () => showYearPicker(context),
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: SvgPicture.asset(
                    Assets.icons.icDateEnd,
                    width: 24,
                    height: 24,
                    colorFilter: const ColorFilter.mode(AppColors.black, BlendMode.srcIn),
                  ),
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // --- CUSTOM SCROLLABLE TAB BAR (CHIPS STYLE) ---
          Container(
            height: 32, // UBAH: Tinggi jadi 32px
            width: double.infinity,
            decoration: const BoxDecoration(
              color: Colors.white,
            ),
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16), // UBAH: Hapus padding vertikal
              scrollDirection: Axis.horizontal,
              itemCount: tabNames.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final isActive = tabController.index == index;

                // Warna sesuai permintaan
                final Color activeBgColor = Colors.white;
                final Color inactiveBgColor = const Color(0xFFF2F2F7); // Warna dasar tab tidak aktif
                final Color borderColor = const Color(0xFFF2F2F7);

                return InkWell(
                  onTap: () {
                    // Pindah tab saat diklik
                    tabController.animateTo(index);
                  },
                  borderRadius: BorderRadius.circular(6.17),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: isActive ? activeBgColor : inactiveBgColor,
                      borderRadius: BorderRadius.circular(6.17), // Radius diubah menjadi 6.17px
                      border: isActive
                          ? Border.all(color: borderColor, width: 1.5) // Border #F2F2F7
                          : Border.all(color: Colors.transparent, width: 1.5),
                    ),
                    child: Text(
                      tabNames[index],
                      style: AppTheme.primaryTextStyle.copyWith(
                        color: isActive ? Colors.black : AppColors.darkGray, // Teks Hitam saat aktif
                        fontWeight: FontWeight.bold, // UBAH: Teks Bold semua
                        fontSize: 14, // UBAH: Ukuran 14px
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // --- CONTENT VIEW ---
          Expanded(
            child: TabBarView(
              controller: tabController,
              children: [
                ContactView(
                  isEmbedded: true,
                  externalSearchQuery: searchText.value,
                  externalIsDescending: isDescending.value,
                ),
                FilesCollectionView(
                  isEmbedded: true,
                  externalSearchQuery: searchText.value,
                  externalIsDescending: isDescending.value,
                ),
                _ArchiveReportPage(
                  months: displayedMonths,
                  year: selectedYear.value,
                  sentStatus: sentStatus.value,
                  reportType: 'presence',
                  onChooseYear: () => showYearPicker(context),
                  onDownload: (index) => sendReport(monthIndex: index, type: 'presence'),
                  isAdmin: isAdmin.value, // Pass admin status
                ),
                _ArchiveReportPage(
                  months: displayedMonths,
                  year: selectedYear.value,
                  sentStatus: sentStatus.value,
                  reportType: 'leave',
                  onChooseYear: () => showYearPicker(context),
                  onDownload: (index) => sendReport(monthIndex: index, type: 'leave'),
                  isAdmin: isAdmin.value, // Pass admin status
                ),
                _ArchiveReportPage(
                  months: displayedMonths,
                  year: selectedYear.value,
                  sentStatus: sentStatus.value,
                  reportType: 'reimburse',
                  onChooseYear: () => showYearPicker(context),
                  onDownload: (index) => sendReport(monthIndex: index, type: 'reimburse'),
                  isAdmin: isAdmin.value, // Pass admin status
                ),
                // --- Page untuk Tugas ---
                _ArchiveReportPage(
                  months: displayedMonths,
                  year: selectedYear.value,
                  sentStatus: sentStatus.value,
                  reportType: 'tugas',
                  onChooseYear: () => showYearPicker(context),
                  onDownload: (index) => sendReport(monthIndex: index, type: 'tugas'),
                  isAdmin: isAdmin.value, // Pass admin status
                ),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: (tabController.index == 0 || tabController.index == 1)
          ? FloatingActionButton(
        onPressed: () async {
          if (tabController.index == 0) {
            final permissionGranted = await AppPermission.showPermissionModal(
              context,
              permissions: [PermissionModal.contact],
            );
            if (permissionGranted) {
              final res = await context.pushNamed(Routes.contactUpload);
              if (res == true) {
                ref.read(contactStateNotifierProvider.notifier).getContact();
              }
            }
          } else {
            final permissionGranted = await AppPermission.showPermissionModal(
              context,
              permissions: [
                PermissionModal.photos,
                PermissionModal.videos,
                PermissionModal.audio,
                PermissionModal.storage,
              ],
            );
            if (permissionGranted) {
              final res = await context.pushNamed(Routes.fileCollectionSelect);
              if (res != null) {
                ref.read(fileCollectionStateNotifierProvider.notifier).fetchCollectionData();
              }
            }
          }
        },
        backgroundColor: AppColors.featurePurple,
        shape: const CircleBorder(),
        elevation: 4,
        child: const Icon(Icons.add, color: Colors.white, size: 28),
      )
          : null,
    );
  }
}

// ... Widget _ArchiveReportPage, _MonthListComponent, _MonthReportTile, _YearPickerDialog ...
class _ArchiveReportPage extends StatelessWidget {
  final List<String> months;
  final int? year;
  final Map<String, String> sentStatus;
  final String reportType;
  final VoidCallback onChooseYear;
  final Function(int) onDownload;
  final bool isAdmin; // Tambahan properti isAdmin

  const _ArchiveReportPage({
    required this.months,
    required this.year,
    required this.sentStatus,
    required this.reportType,
    required this.onChooseYear,
    required this.onDownload,
    required this.isAdmin,
  });

  @override
  Widget build(BuildContext context) {
    // KONDISI: Jika bukan admin, tampilkan akses dibatasi
    if (!isAdmin) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.lightGrey,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.lock_outline, size: 48, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            Text(
              "archive_page.access_restricted_title".tr(context: context),
              style: AppTheme.primaryTextStyle.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: AppColors.black,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "archive_page.access_restricted_desc".tr(context: context),
              style: AppTheme.secondaryTextStyle.copyWith(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start, // Align kiri
      children: [
        // 1. TAMPILAN TAHUN DI ATAS
        if (year != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: Text(
              "$year",
              style: AppTheme.primaryTextStyle.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 10,
                color: AppColors.black,
              ),
            ),
          ),

        // --- INFO CARD DIHILANGKAN ---

        Expanded(
          child: _MonthListComponent(
            months: months,
            year: year ?? 0,
            sentStatus: sentStatus,
            reportType: reportType,
            onDownload: onDownload,
          ),
        ),
      ],
    );
  }
}

class _MonthListComponent extends StatelessWidget {
  final List<String> months;
  final int year;
  final Map<String, String> sentStatus;
  final String reportType;
  final Function(int) onDownload;

  const _MonthListComponent({
    required this.months,
    required this.year,
    required this.sentStatus,
    required this.reportType,
    required this.onDownload,
  });

  @override
  Widget build(BuildContext context) {
    if (months.isEmpty) {
      return Center(
        child: Text(
          "archive_page.empty_state".tr(context: context),
          style: AppTheme.primaryTextStyle.copyWith(color: Colors.grey),
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
      itemCount: months.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final key = "archive_sent_${year}_${index}_$reportType";
        final sentDate = sentStatus[key];
        return _MonthReportTile(
          monthName: months[index],
          year: year,
          sentDate: sentDate,
          onDownload: () => onDownload(index),
        );
      },
    );
  }
}

class _MonthReportTile extends StatelessWidget {
  final String monthName;
  final int year;
  final String? sentDate;
  final VoidCallback onDownload;

  const _MonthReportTile({
    required this.monthName,
    required this.year,
    this.sentDate,
    required this.onDownload,
  });

  @override
  Widget build(BuildContext context) {
    // Logic Warna Button:
    // Jika sentDate != null (sudah dikirim) -> Warna Abu (tapi tetap bisa diklik)
    // Jika sentDate == null (belum dikirim) -> Warna Ungu Utama
    final Color buttonColor = sentDate != null ? AppColors.pesanAbu : AppColors.featurePurple;
    final Color buttonTextColor = sentDate != null ? AppColors.darkGray : Colors.white;

    return Container(
      // UBAH: Tinggi fix 57px sesuai request
      height: 57,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      // Alignment center agar konten vertikal rata tengah karena tinggi sudah fix
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE0E0E0)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Icon + Nama Bulan
          Row(
            children: [
              SvgPicture.asset(
                Assets.icons.icCalendar,
                width: 20,
                height: 20,
                colorFilter: const ColorFilter.mode(AppColors.black, BlendMode.srcIn),
              ),
              const SizedBox(width: 8),
              Text(
                monthName,
                style: AppTheme.primaryTextStyle.copyWith(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  color: AppColors.black,
                ),
              ),
            ],
          ),

          // Tombol (Kirim / Sudah Terkirim) - SEKARANG SELALU BISA DIKLIK
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onDownload, // Tetap jalankan fungsi onDownload/Send walaupun sudah terkirim
              borderRadius: BorderRadius.circular(6),
              child: Container(
                height: 25,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: buttonColor, // Warna berubah dinamis
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  "archive_page.btn_send".tr(context: context),
                  style: AppTheme.secondaryTextStyle.copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: buttonTextColor, // Warna teks berubah dinamis
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _YearPickerDialog extends HookWidget {
  final int initialYear;
  const _YearPickerDialog({required this.initialYear});

  @override
  Widget build(BuildContext context) {
    final currentYear = DateTime.now().year;
    final allYears = useMemoized(() => List.generate(16, (index) => (currentYear - 10) + index).toList());
    final searchController = useTextEditingController(text: initialYear.toString());
    final filteredYears = useState<List<int>>(allYears);
    final selectedTempYear = useState<int>(initialYear);

    void onSearchChanged(String query) {
      if (query.isEmpty) {
        filteredYears.value = allYears;
      } else {
        filteredYears.value = allYears.where((year) => year.toString().contains(query)).toList();
      }
      if (query.isNotEmpty) {
        final int? parsedYear = int.tryParse(query);
        if (parsedYear != null && allYears.contains(parsedYear)) {
          selectedTempYear.value = parsedYear;
        }
      }
    }

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: Colors.white,
      child: Container(
        width: 320,
        height: 480,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "archive_page.btn_choose_year".tr(context: context),
                    style: AppTheme.primaryTextStyle.copyWith(
                      fontWeight: FontWeight.w500,
                      color: AppColors.black,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: searchController,
                    onChanged: onSearchChanged,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.start,
                    style: GoogleFonts.roboto(
                      fontSize: 30,
                      fontWeight: FontWeight.w400,
                      color: AppColors.black,
                    ),
                    decoration: InputDecoration(
                      hintText: "archive_page.search_year_hint".tr(context: context),
                      hintStyle: AppTheme.primaryTextStyle.copyWith(color: Colors.grey),
                      suffixIcon: const Icon(Icons.edit, color: Colors.grey, size: 20),
                      border: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                      enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                      focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppColors.blue, width: 2)),
                      contentPadding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: filteredYears.value.isEmpty
                    ? Center(
                  child: Text(
                    "archive_page.year_not_found".tr(context: context),
                    style: AppTheme.primaryTextStyle.copyWith(color: Colors.grey),
                  ),
                )
                    : GridView.builder(
                  padding: const EdgeInsets.all(0),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    childAspectRatio: 1.5,
                  ),
                  itemCount: filteredYears.value.length,
                  itemBuilder: (context, index) {
                    final year = filteredYears.value[index];
                    final isSelected = year == selectedTempYear.value;
                    return Center(
                      child: InkWell(
                        onTap: () {
                          selectedTempYear.value = year;
                          searchController.text = year.toString();
                          searchController.selection = TextSelection.fromPosition(
                              TextPosition(offset: searchController.text.length));
                        },
                        borderRadius: BorderRadius.circular(24),
                        child: Container(
                          width: 70,
                          height: 40,
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.blue : Colors.transparent,
                            borderRadius: BorderRadius.circular(24),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            year.toString(),
                            style: GoogleFonts.roboto(
                              fontSize: 16,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                              color: isSelected ? Colors.white : AppColors.black,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 10),
            const Divider(height: 1, thickness: 1, color: Color(0xFFEEEEEE)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text(
                      "cancel".tr(context: context),
                      style: AppTheme.primaryTextStyle.copyWith(color: Colors.grey.shade700, fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: () {
                      Navigator.pop(context, selectedTempYear.value);
                    },
                    child: Text(
                      "archive_page.btn_select".tr(context: context),
                      style: AppTheme.primaryTextStyle.copyWith(color: AppColors.blue, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}