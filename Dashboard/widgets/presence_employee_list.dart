part of '../views/presence.dart';

// TAMBAHAN: Provider untuk menyimpan opsi sortir (Default: Terlama - Terbaru)
final presenceSortOptionProvider = StateProvider<String>((ref) => 'sort_time');

class _PresenceEmployeeList extends ConsumerWidget {
  const _PresenceEmployeeList({
    required this.scrollController,
    required this.isVisible,
    required this.onRefresh,
    required this.searchQuery,
    this.selectedShift,
  });

  final ScrollController scrollController;
  final bool isVisible;
  final Future<void> Function() onRefresh;
  final String searchQuery;
  final String? selectedShift; // Parameter filter status (Masuk, Pulang, Izin)

  // Helper untuk mengecek status izin pada tanggal tertentu
  bool _isLeaveActive(Map<String, dynamic> leave, DateTime targetDate) {
    final status = leave['status']?.toString().toLowerCase();
    if (status != 'approved' && status != 'diterima' && status != 'dikonfirmasi') return false;

    DateTime? start;
    if (leave['startDate'] != null) start = DateTime.tryParse(leave['startDate'].toString());
    else if (leave['tanggalStart'] != null) start = DateTime.tryParse(leave['tanggalStart'].toString());

    DateTime? end;
    if (leave['endDate'] != null) end = DateTime.tryParse(leave['endDate'].toString());
    else if (leave['tanggalAkhir'] != null) end = DateTime.tryParse(leave['tanggalAkhir'].toString());

    if (start == null || end == null) return false;

    // Normalisasi jam ke 00:00:00 untuk perbandingan akurat
    final target = DateTime(targetDate.year, targetDate.month, targetDate.day);
    final s = DateTime(start.year, start.month, start.day);
    final e = DateTime(end.year, end.month, end.day);

    return target.compareTo(s) >= 0 && target.compareTo(e) <= 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Ambil state Company List (Daftar semua karyawan dari API api/company/list)
    // Di API inilah terdapat data 'email' dan 'username'
    final companyListState = ref.watch(companyListStateNotifierProvider);

    // Ambil state Attendance List (Data absensi dari API)
    final attendanceListState = ref.watch(attendanceListStateNotifierProvider);

    // Ambil data Izin
    final leaveListState = ref.watch(leaveListStreamProvider);

    // Ambil tanggal filter
    final selectedDate = ref.watch(selectedPresenceDateProvider);

    // Ambil opsi sortir saat ini
    final sortOption = ref.watch(presenceSortOptionProvider);

    return Expanded(
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: isVisible ? 1.0 : 0.0,
        child: companyListState.when(
          initial: () => const SizedBox.shrink(),
          loading: () => const Center(child: CircularProgressIndicator()),
          success: (companyData) {

            // 1. Ambil data absensi
            List<dynamic> attendanceList = [];
            attendanceListState.when(
              initial: () {},
              loading: () {},
              success: (data) {
                if (data is List) attendanceList = data;
              },
              failed: (e) {},
            );

            // 1.1 Ambil data Izin
            List<Map<String, dynamic>> leaves = [];
            leaveListState.whenData((data) => leaves = data);

            // 2. Filter Search Query
            List<dynamic> filteredBySearch = [];
            if (companyData is List) {
              if (searchQuery.isEmpty) {
                filteredBySearch = companyData;
              } else {
                filteredBySearch = companyData.where((member) {
                  final String name = (member as dynamic).username ?? "";
                  return name.toLowerCase().contains(searchQuery.toLowerCase());
                }).toList();
              }
            }

            if (filteredBySearch.isEmpty) {
              return _buildEmptyState(context, "presence.employee_not_found".tr());
            }

            // 3. Mapping Data (Gabungkan Company + Attendance + Leave)
            final List<Map<String, dynamic>> mappedList = [];
            final Set<String> processedIds = {};

            for (var member in filteredBySearch) {
              final String name = (member as dynamic).username ?? "Unknown";

              // EKSTRAKSI EMAIL SEBAGAI PRIMARY KEY (Murni sesuai data API Company List)
              String mEmail = '';
              try { mEmail = (member as dynamic).email?.toString().trim() ?? ''; } catch (_) {}
              if (mEmail.isEmpty) {
                try { mEmail = (member as dynamic).alamatEmail?.toString().trim() ?? ''; } catch (_) {}
              }

              // PENENTUAN UNIQUE KEY AGAR NAMA YANG SAMA TIDAK DIANGGAP DUPLIKAT
              String uniqueKey = mEmail.isNotEmpty ? mEmail.toLowerCase() : name.toLowerCase();

              if (processedIds.contains(uniqueKey)) {
                continue;
              }
              processedIds.add(uniqueKey);

              final bool isMe = (member as dynamic).isMe ?? false;

              DateTime? checkInTime;
              DateTime? checkOutTime;
              dynamic matchingAbsence;
              Map<String, dynamic>? activeLeave;

              // Cari data absensi karyawan ini (DILARANG MENGGUNAKAN NAMA, MURNI MENGGUNAKAN EMAIL)
              try {
                final userAbsences = attendanceList.where(
                      (absen) {
                    String absenEmail = '';
                    String absenId = '';

                    if (absen is Map) {
                      absenEmail = (absen['email'] ?? absen['alamatEmail'] ?? '').toString().trim();
                      absenId = (absen['IDKaryawan'] ?? absen['idKaryawan'] ?? '').toString().trim();
                    } else {
                      try { absenEmail = (absen as dynamic).email?.toString().trim() ?? ''; } catch (_) {}
                      if (absenEmail.isEmpty) try { absenEmail = (absen as dynamic).alamatEmail?.toString().trim() ?? ''; } catch (_) {}
                      try { absenId = (absen as dynamic).idKaryawan?.toString().trim() ?? ''; } catch (_) {}
                      if (absenId.isEmpty) try { absenId = (absen as dynamic).IDKaryawan?.toString().trim() ?? ''; } catch (_) {}
                    }

                    // FILTER 1: PENCOCOKAN EMAIL UTAMA (Paling Akurat & Sesuai Arahan)
                    // Karena field email sudah ada di absence.dart, sekarang filter ini akan TERPICU DENGAN SUKSES!
                    if (mEmail.isNotEmpty && absenEmail.isNotEmpty && absenEmail.toLowerCase() == mEmail.toLowerCase()) {
                      return true;
                    }

                    // FILTER 2: BACKUP (Berjaga-jaga apabila IDKaryawan pada API Absensi berisi format Email)
                    if (mEmail.isNotEmpty && absenId.isNotEmpty && absenId.toLowerCase() == mEmail.toLowerCase()) {
                      return true;
                    }

                    // KUNCI PERBAIKAN: TIDAK ADA LAGI PENCOCOKAN NAMA/USERNAME (Menghindari Pencurian Absen)
                    return false;
                  },
                ).toList();

                if (userAbsences.isNotEmpty) {
                  matchingAbsence = userAbsences.firstWhere(
                        (absen) {
                      bool hasOut = false;
                      if (absen is Map) {
                        hasOut = absen['waktuCheckOut'] != null || absen['FotoCheckOut'] != null;
                      } else {
                        try { hasOut = (absen as dynamic).waktuCheckOut != null; } catch (_) {}
                        if (!hasOut) try { hasOut = (absen as dynamic).FotoCheckOut != null; } catch (_) {}
                      }
                      return hasOut;
                    },
                    orElse: () => userAbsences.first,
                  );

                  dynamic wCheckIn;
                  dynamic wCheckOut;

                  if (matchingAbsence is Map) {
                    wCheckIn = matchingAbsence['waktuCheckIn'] ?? matchingAbsence['tanggal'];
                    wCheckOut = matchingAbsence['waktuCheckOut'];
                  } else {
                    try { wCheckIn = (matchingAbsence as dynamic).waktuCheckIn; } catch (_) {}
                    if (wCheckIn == null) try { wCheckIn = (matchingAbsence as dynamic).tanggal; } catch (_) {}
                    try { wCheckOut = (matchingAbsence as dynamic).waktuCheckOut; } catch (_) {}
                  }

                  DateTime? _parseTime(dynamic val) {
                    if (val == null) return null;
                    if (val is DateTime) return val;
                    if (val is String) return DateTime.tryParse(val);
                    if (val is Map && val.containsKey('_seconds')) {
                      return DateTime.fromMillisecondsSinceEpoch((val['_seconds'] as int) * 1000);
                    }
                    try { return (val as dynamic).toDate(); } catch (_) {}
                    return null;
                  }

                  checkInTime = _parseTime(wCheckIn);
                  checkOutTime = _parseTime(wCheckOut);
                }
              } catch (e) {
                // Ignore parsing errors for individual items
              }

              // Cari data izin (leave) MURNI DENGAN EMAIL ATAU NAMA
              for (var l in leaves) {
                String lEmail = (l['email'] ?? l['alamatEmail'] ?? '').toString().trim();
                String lName = (l['userName'] ?? l['namaKaryawan'] ?? '').toString().trim();

                bool isMatch = false;
                if (mEmail.isNotEmpty && lEmail.isNotEmpty && lEmail.toLowerCase() == mEmail.toLowerCase()) {
                  isMatch = true;
                } else if (name.isNotEmpty && lName.isNotEmpty && lName.toLowerCase() == name.toLowerCase()) {
                  isMatch = true;
                }

                if (isMatch) {
                  if (_isLeaveActive(l, selectedDate)) {
                    activeLeave = l;
                    break;
                  }
                }
              }

              // --- LOGIKA FILTER STATUS ---
              bool shouldInclude = false;

              if (selectedShift != null && selectedShift!.isNotEmpty) {
                if (selectedShift!.toLowerCase() == 'masuk') {
                  shouldInclude = checkInTime != null && checkOutTime == null && activeLeave == null;
                } else if (selectedShift!.toLowerCase() == 'pulang') {
                  shouldInclude = checkInTime != null && checkOutTime != null && activeLeave == null;
                } else if (selectedShift!.toLowerCase() == 'izin') {
                  shouldInclude = activeLeave != null;
                }
              } else {
                shouldInclude = true;
              }

              if (shouldInclude) {
                mappedList.add({
                  'member': member,
                  'name': name,
                  'isMe': isMe,
                  'checkInTime': checkInTime,
                  'checkOutTime': checkOutTime,
                  'attendance': matchingAbsence,
                  'leave': activeLeave,
                });
              }
            }

            if (mappedList.isEmpty) {
              if (searchQuery.isNotEmpty) {
                return _buildEmptyState(context, "presence.employee_not_found".tr());
              }

              String displayedShift = selectedShift ?? "";
              if (displayedShift.toLowerCase() == 'masuk') displayedShift = "presence.chip_in".tr();
              else if (displayedShift.toLowerCase() == 'pulang') displayedShift = "presence.chip_out".tr();
              else if (displayedShift.toLowerCase() == 'izin') displayedShift = "presence.chip_leave".tr();

              return _buildEmptyState(
                context,
                selectedShift != null
                    ? "presence.no_data_for_status".tr(args: [displayedShift])
                    : "presence.no_attendance_data".tr(),
              );
            }

            // 4. Sorting (Disesuaikan berdasarkan Pilihan)
            mappedList.sort((a, b) {
              // Diri sendiri (isMe) selalu diutamakan paling atas
              if (a['isMe'] == true && b['isMe'] != true) return -1;
              if (b['isMe'] == true && a['isMe'] != true) return 1;

              if (sortOption == 'sort_az') {
                final nameA = (a['name'] as String).toLowerCase();
                final nameB = (b['name'] as String).toLowerCase();
                return nameA.compareTo(nameB);
              } else {
                final tA = a['checkInTime'] as DateTime?;
                final tB = b['checkInTime'] as DateTime?;

                if (tA != null && tB != null) return tA.compareTo(tB);
                if (tA != null) return -1;
                if (tB != null) return 1;

                return 0;
              }
            });

            // 5. Build List & Timer
            return StreamBuilder<int>(
                stream: Stream.periodic(const Duration(seconds: 1), (i) => i),
                builder: (context, snapshot) {
                  final now = DateTime.now();

                  return RefreshIndicator(
                    onRefresh: onRefresh,
                    color: AppColors.blue,
                    backgroundColor: Colors.white,
                    child: ListView.builder(
                      controller: scrollController,
                      physics: const AlwaysScrollableScrollPhysics(),
                      itemCount: mappedList.length,
                      padding: const EdgeInsets.fromLTRB(10, 0, 10, 80),
                      itemBuilder: (context, index) {
                        final item = mappedList[index];
                        final String name = item['name'];
                        final bool isMe = item['isMe'];
                        final DateTime? checkInTime = item['checkInTime'];
                        final DateTime? checkOutTime = item['checkOutTime'];
                        final activeLeave = item['leave'];

                        final timeStyle = AppTheme.secondaryTextStyle.copyWith(
                          color: const Color(0xFF000000),
                          fontWeight: FontWeight.w400,
                        );

                        Widget timeWidget;

                        if (activeLeave != null) {
                          final type = activeLeave['tipeIzin'] ?? activeLeave['ijin'] ?? 'Izin';
                          String typeStr = type.toString();
                          if (typeStr.toLowerCase() == 'cuti') typeStr = 'leave_type.leave'.tr(context: context);
                          else if (typeStr.toLowerCase() == 'dinas') typeStr = 'leave_type.business_trip'.tr(context: context);
                          else if (typeStr.toLowerCase() == 'sakit') typeStr = 'leave_type.sick'.tr(context: context);
                          else if (typeStr.toLowerCase() == 'pulang') typeStr = 'leave_type.early_home'.tr(context: context);

                          timeWidget = Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            child: Text(
                              typeStr,
                              textAlign: TextAlign.right,
                              style: GoogleFonts.dmSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: AppColors.darkGray,
                              ),
                            ),
                          );

                        } else if (checkInTime != null) {
                          final checkInLocal = checkInTime.toLocal();
                          final bool isSameDay = checkInLocal.year == now.year &&
                              checkInLocal.month == now.month &&
                              checkInLocal.day == now.day;

                          if (checkOutTime == null && !isSameDay) {
                            timeWidget = Text(
                              "presence.not_check_out".tr(),
                              style: timeStyle.copyWith(
                                color: const Color(0xFFD32F2F),
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            );
                          } else {
                            final DateTime endTime = checkOutTime ?? now;
                            final duration = endTime.difference(checkInTime.toLocal());
                            final int durationMillis = duration.isNegative ? 0 : duration.inMilliseconds;

                            final text = StopWatchTimer.getDisplayTime(
                              durationMillis,
                              hours: true,
                              minute: true,
                              second: true,
                              milliSecond: false,
                            );
                            timeWidget = Text(text, style: timeStyle);
                          }

                        } else {
                          timeWidget = Text(
                            "presence.not_present_yet".tr(),
                            style: timeStyle.copyWith(color: Colors.grey[400]),
                          );
                        }

                        return InkWell(
                          onTap: () {
                            if (activeLeave != null) {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                backgroundColor: Colors.transparent,
                                builder: (context) => LeaveRequestDetailView(activeLeave),
                              );
                            } else {
                              Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => PresenceDetailView(employee: item),
                                  )
                              );
                            }
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            constraints: const BoxConstraints(minHeight: AppTheme.cardHeight),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isMe ? Colors.blue.withOpacity(0.5) : AppColors.lightGrey,
                                width: 1.0,
                              ),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Row(
                                      children: [
                                        Flexible(
                                          child: Text(
                                            name,
                                            overflow: TextOverflow.ellipsis,
                                            style: AppTheme.primaryTextStyle.copyWith(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Row(
                                    children: [
                                      timeWidget,
                                      const SizedBox(width: 8),
                                      Icon(
                                          activeLeave != null ? Icons.keyboard_arrow_down : Icons.arrow_forward_ios_rounded,
                                          size: activeLeave != null ? 20 : 14,
                                          color: const Color(0xFF000000)
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  );
                }
            );
          },
          failed: (exception) => _buildEmptyState(context, "presence.failed_to_load".tr(args: [exception.message.toString()])),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, String message) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        controller: scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.2),
          Center(
            child: Text(
              message,
              style: AppTheme.secondaryTextStyle.copyWith(color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}