part of 'presence.dart';

// Provider untuk sinyal "Find Me" (Recenter Map)
final recenterMapSignalProvider = StateProvider<int>((ref) => 0);

class PresenceView extends HookConsumerWidget {
  const PresenceView({super.key});

  // HELPER BARU: Parser Tanggal yang tahan banting (Support Firestore Timestamp & String ISO)
  DateTime? _parseDate(dynamic dateVal) {
    if (dateVal == null) return null;
    if (dateVal is DateTime) return dateVal;
    try {
      return (dateVal as dynamic).toDate() as DateTime;
    } catch (_) {}
    return DateTime.tryParse(dateVal.toString());
  }

  // Helper untuk mengecek status izin harian
  bool _isLeaveActive(Map<String, dynamic> leave, DateTime targetDate) {
    final status = (leave['status'] ?? leave['status_izin'] ?? '').toString().trim().toLowerCase();
    if (status != 'approved' && status != 'diterima' && status != 'dikonfirmasi') return false;

    DateTime? start = _parseDate(leave['startDate'] ?? leave['tanggalStart'] ?? leave['start_date']);
    DateTime? end = _parseDate(leave['endDate'] ?? leave['tanggalAkhir'] ?? leave['end_date']);

    if (start == null || end == null) return false;

    // Normalisasi jam ke 00:00:00 untuk perbandingan
    final target = DateTime(targetDate.year, targetDate.month, targetDate.day);
    final s = DateTime(start.year, start.month, start.day);
    final e = DateTime(end.year, end.month, end.day);

    return target.compareTo(s) >= 0 && target.compareTo(e) <= 0;
  }

  // Helper khusus untuk mengecek validasi "Apakah bisa mengajukan izin?"
  bool _checkIsLeaveFormDisabled(List<dynamic> requests, String? currentUserId) {
    if (requests.isEmpty) return false;
    if (currentUserId == null || currentUserId.isEmpty || currentUserId == 'null') return false;

    final now = DateTime.now();
    final myId = currentUserId.toString().trim().toLowerCase();

    for (var item in requests) {
      String? userIdStr;
      if (item['userId'] != null) userIdStr = item['userId'].toString();
      else if (item['user_id'] != null) userIdStr = item['user_id'].toString();
      else if (item['idkaryawan'] != null) userIdStr = item['idkaryawan'].toString();
      else if (item['idKaryawan'] != null) userIdStr = item['idKaryawan'].toString();
      else if (item['user'] is Map && item['user']['email'] != null) {
        userIdStr = item['user']['email'].toString();
      }

      if (userIdStr?.trim().toLowerCase() != myId) continue;

      String statusStr = (item['status']?.toString() ?? '').toLowerCase();
      bool isPending = statusStr == 'created' || statusStr == 'diajukan' || statusStr == 'pending' || statusStr == 'dikirim ke admin' || statusStr == 'menunggu';
      bool isApproved = statusStr == 'approved' || statusStr == 'diterima' || statusStr == 'dikonfirmasi';

      if (isPending) return true; // Disable jika ada yang pending

      if (isApproved) {
        DateTime? end;
        dynamic cAt = item['endDate'] ?? item['tanggalAkhir'];
        if (cAt != null) {
          if (cAt is DateTime) end = cAt;
          else if (cAt.toString().contains('Timestamp')) {
            try { end = (cAt as dynamic).toDate(); } catch (_) {}
          } else end = DateTime.tryParse(cAt.toString());
        }

        if (end != null) {
          final endOfLeaveDay = DateTime(end.year, end.month, end.day, 23, 59, 59);
          if (now.isBefore(endOfLeaveDay)) return true; // Disable jika izin masih berjalan
        }
      }
    }
    return false; // Aman
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    useAutomaticKeepAlive(wantKeepAlive: true);

    // --- STATES ---
    final checkIn = useState<OnCaptureData?>(null);
    final restStart = useState<OnCaptureData?>(null);
    final restEnd = useState<OnCaptureData?>(null);
    final checkOut = useState<OnCaptureData?>(null);

    // State untuk menyimpan filter status (Value: 'Masuk', 'Pulang', 'Izin')
    // Set nilai default filter ke 'Masuk'
    final selectedTimeChip = useState<String?>('Masuk');

    // --- WATCH SETTINGS ---
    final isShiftFilterEnabled = ref.watch(showShiftFilterProvider);

    final stopWatchTimer = useMemoized(() => StopWatchTimer(mode: StopWatchMode.countUp));
    final searchController = useTextEditingController();
    useListenable(searchController);
    final sheetController = useMemoized(() => DraggableScrollableController());
    final isContentVisible = useState(false);

    // --- PROVIDERS ---
    final appPreference = ref.watch(appPreferenceProvider);
    final firebaseFirestoreService = ref.read(firebaseFirestoreServiceProvider);

    // AMBIL DATA DARI PROVIDER
    final companyListState = ref.watch(companyListStateNotifierProvider);
    final attendanceListState = ref.watch(attendanceListStateNotifierProvider);
    final leaveListState = ref.watch(leaveListStreamProvider); // Provider Izin
    final selectedDate = ref.watch(selectedPresenceDateProvider);

    // TAMBAHAN PROVIDER USER UNTUK LOGIKA FORM IZIN
    final currentUserAsync = ref.watch(currentUserProvider);

    // --- CONSTANTS ---
    const double minSheetSize = 0.18;
    const double maxSheetSize = 0.65;
    const int cooldownMinutes = 60;

    // --- EFFECTS ---
    useEffect(() {
      return () async {
        await stopWatchTimer.dispose();
      };
    }, []);

    Future<void> loadAllData() async {
      await ref.read(companyListStateNotifierProvider.notifier).getCompanyList();
      final selectedDateLoad = ref.read(selectedPresenceDateProvider);

      // --- PERBAIKAN FATAL ZONA WAKTU ---
      // Konversi jam 00:00 - 23:59 waktu lokal HP ke UTC.
      // Jika di Indonesia (WIB/UTC+7), jam 06:50 pagi hari ini dihitung sebagai 23:50 malam KEMARIN di UTC.
      // Jika kita langsung menggunakan T00:00:00Z secara statis, maka absen pagi sebelum jam 07:00 akan terpotong.

      final startLocal = DateTime(selectedDateLoad.year, selectedDateLoad.month, selectedDateLoad.day, 0, 0, 0);
      final endLocal = DateTime(selectedDateLoad.year, selectedDateLoad.month, selectedDateLoad.day, 23, 59, 59);

      final startUtc = startLocal.toUtc();
      final endUtc = endLocal.toUtc();

      final startOfDay = "${startUtc.toIso8601String().substring(0, 19)}Z";
      final endOfDay = "${endUtc.toIso8601String().substring(0, 19)}Z";

      await ref.read(attendanceListStateNotifierProvider.notifier).getAttendanceList(
          start: startOfDay,
          end: endOfDay
      );
    }

    // --- PERUBAHAN UTAMA: Tambahkan selectedDate ke dependency array ---
    // Dengan ini, loadAllData() akan otomatis dijalankan setiap kali kalender diganti
    useEffect(() {
      Future.microtask(() => loadAllData());
      return null;
    }, [selectedDate]);

    ref.listen<String>(refreshAbsenceProvider, (prev, next) {
      if (prev != next) loadAllData();
    });

    Future<void> updateLocation() async {
      Future.microtask(() {
        if (context.mounted) {
          AppPermission.requestPermissionLocation(context).then((value) async {
            if (value && context.mounted) {
              bool isGranted = await AppPermission.showPermissionModal(context, permissions: [PermissionModal.location]);
              if (isGranted) {
                await LocationService.getPosition().then((result) async {
                  await LocationService.getAddress(result?.latitude, result?.longitude).then((address) async {
                    await ref.read(appPreferenceProvider).write(AppPreferenceKey.posName, address);
                  });
                  await ref.read(appPreferenceProvider).write(AppPreferenceKey.posLat, result?.latitude.toString());
                  await ref.read(appPreferenceProvider).write(AppPreferenceKey.posLng, result?.longitude.toString());
                });
              }
            }
          });
        }
      });
    }

    Future<void> loadSavedSession() async {
      try {
        final pref = ref.read(appPreferenceProvider);
        final savedId = await pref.read<String>(AppPreferenceKey.currentAbsenceId);
        if (savedId != null && savedId.isNotEmpty && savedId != "true") {
          ref.read(currentIdAbsenceProvider.notifier).state = savedId;
        }
      } catch (e) {
        debugPrint("Error loading session: $e");
      }
    }

    useEffect(() {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        updateLocation();
        loadSavedSession();
      });
      return null;
    }, []);

    // --- LOGIC SINKRONISASI ID ABSEN ---
    useEffect(() {
      if (companyListState is! AsyncData || attendanceListState is! AsyncData) return null;

      String? myName;

      companyListState.whenOrNull(
        success: (data) {
          if (data is List) {
            final me = data.firstWhereOrNull((m) => (m as dynamic).isMe == true);
            if (me != null) myName = (me as dynamic).username;
          }
        },
      );

      if (myName != null) {
        attendanceListState.whenOrNull(
          success: (data) {
            if (data is List) {
              final myAbsence = data.firstWhereOrNull((a) {
                final aName = (a as dynamic).namaKaryawan;
                return (aName ?? '').toString().toLowerCase() == myName!.toLowerCase();
              });

              if (myAbsence != null) {
                final inTime = (myAbsence as dynamic).waktuCheckIn;
                final outTime = (myAbsence as dynamic).waktuCheckOut;
                final String? serverDocId = (myAbsence as dynamic).id;

                if (inTime != null && outTime == null && serverDocId != null) {
                  Future.microtask(() {
                    final currentStoredId = ref.read(currentIdAbsenceProvider);
                    if (currentStoredId != serverDocId) {
                      ref.read(currentIdAbsenceProvider.notifier).state = serverDocId;
                      ref.read(appPreferenceProvider).write(AppPreferenceKey.currentAbsenceId, serverDocId);
                    }
                  });
                }
              }
            }
          },
        );
      }
      return null;
    }, [attendanceListState, companyListState]);

    // --- VIEW LOGIC ---
    DateTime? serverCheckInTime;
    DateTime? serverCheckOutTime;

    String? myNameForUI;
    companyListState.whenOrNull(success: (d) { if(d is List) { final m=d.firstWhereOrNull((x)=>(x as dynamic).isMe==true); if(m!=null) myNameForUI=(m as dynamic).username; }});

    if (myNameForUI != null) {
      attendanceListState.whenOrNull(success: (d) { if(d is List) {
        final m = d.firstWhereOrNull((x) => (x as dynamic).namaKaryawan?.toString().toLowerCase() == myNameForUI!.toLowerCase());
        if(m!=null) {
          if((m as dynamic).waktuCheckIn != null) serverCheckInTime = DateTime.tryParse((m as dynamic).waktuCheckIn.toString());
          if((m as dynamic).waktuCheckOut != null) serverCheckOutTime = DateTime.tryParse((m as dynamic).waktuCheckOut.toString());
        }
      }});
    }

    // --- CEK TANGGAL HARI INI ---
    final DateTime now = DateTime.now();
    final bool isToday = selectedDate.year == now.year &&
        selectedDate.month == now.month &&
        selectedDate.day == now.day;
    final bool isNotToday = !isToday; // True jika melihat tanggal masa lalu/depan

    // --- LOGIKA CEK STATUS IZIN (CURRENT USER) ---
    bool isCurrentUserOnLeave = false;
    if (myNameForUI != null && leaveListState.value != null) {
      for (var l in leaveListState.value!) {
        final lName = l['userName'] ?? l['namaKaryawan'] ?? '';
        if (lName.toString().toLowerCase() == myNameForUI!.toLowerCase()) {
          if (_isLeaveActive(l, selectedDate)) {
            isCurrentUserOnLeave = true;
            break;
          }
        }
      }
    }

    // --- LOGIKA DISABLE TOMBOL ---
    bool isLeaveFormDisabled = false;
    if (leaveListState.value != null && currentUserAsync.value != null) {
      isLeaveFormDisabled = _checkIsLeaveFormDisabled(leaveListState.value!, currentUserAsync.value);
    } else if (leaveListState.isLoading || currentUserAsync.isLoading) {
      isLeaveFormDisabled = true; // Disable selagi loading agar aman
    }

    // Tambahan logika disable berbasis tanggal untuk Absensi & Map
    final bool isAbsenceDisabled = isCurrentUserOnLeave || isNotToday || isSessionFinished;
    final bool isShareLocDisabled = isCurrentUserOnLeave || isNotToday;

    final isCheckedIn = checkIn.value != null || serverCheckInTime != null;
    final isCheckedOut = checkOut.value != null || serverCheckOutTime != null;
    final isSessionActive = isCheckedIn && !isCheckedOut;
    final isSessionFinished = isCheckedIn && isCheckedOut;

    bool isPostCheckOutCooldown = false;
    int minutesRemaining = 0;

    if (isSessionFinished) {
      final finishTime = checkOut.value?.dateTime ?? serverCheckOutTime;
      if (finishTime != null) {
        final diff = now.difference(finishTime);
        if (diff.inMinutes < cooldownMinutes) {
          // --- NONAKTIFKAN COOLDOWN SEMENTARA ---
          // isPostCheckOutCooldown = true; // Dulu: True
          isPostCheckOutCooldown = false; // Sekarang: False agar bisa langsung absen lagi
          minutesRemaining = cooldownMinutes - diff.inMinutes;
        }
      }
    }

    // --- UPDATED: SECURITY BOTTOM SHEET WITH EXIT CALLBACK ---
    void showSecurityBottomSheet({
      required String title,
      required String message,
      VoidCallback? onClose, // Parameter baru untuk handle aksi saat ditutup
    }) {
      if (!context.mounted) return;
      showModalBottomSheet(
        context: context,
        backgroundColor: Colors.white,
        isScrollControlled: true,
        useSafeArea: true,
        isDismissible: onClose == null, // Jika ini security alert (onClose ada), jangan biarkan dismiss tap luar
        enableDrag: onClose == null,    // Jangan biarkan drag down
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
        builder: (context) {
          // Cegah back button android jika ini alert keamanan
          return PopScope(
            canPop: onClose == null,
            child: Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom + 24, left: 10, right: 10, top: 12),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 24), decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
                  Text(
                      title,
                      style: AppTheme.primaryTextStyle.copyWith(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF333333)),
                      textAlign: TextAlign.center
                  ),
                  const SizedBox(height: 24),
                  // Icon Peringatan Merah
                  SvgPicture.asset(Assets.icons.icGpsX, width: 16, height: 20, colorFilter: const ColorFilter.mode(AppColors.black, BlendMode.srcIn)),
                  const SizedBox(height: 12),
                  Text(
                      message,
                      style: AppTheme.secondaryTextStyle.copyWith(fontSize: 14, color: const Color(0xFF757575), height: 1.5),
                      textAlign: TextAlign.center
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                          onPressed: () => Navigator.pop(context),
                          style: ElevatedButton.styleFrom(
                              elevation: 0, backgroundColor: AppColors.featurePurple, foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), padding: const EdgeInsets.symmetric(vertical: 14)
                          ),
                          child: Text("presence.understand".tr(), style: AppTheme.primaryTextStyle.copyWith(fontWeight: FontWeight.w700, fontSize: 14, color: Colors.white))
                      )
                  ),
                ],
              ),
            ),
          );
        },
      ).whenComplete(() {
        // --- JALANKAN LOGIKA EXIT SETELAH SHEET TERTUTUP ---
        if (onClose != null) {
          onClose();
        }
      });
    }

    // --- UPDATED: ABSENCE BUTTON TAP LOGIC ---
    Future<void> onAbsenceButtonTap() async {
      // VALIDASI TANGGAL
      if (isNotToday) {
        AppToast.showToast(msg: "presence.not_today_absence".tr());
        return;
      }

      // VALIDASI IZIN
      if (isCurrentUserOnLeave) {
        showSecurityBottomSheet(
            title: "presence.active_leave_title".tr(),
            message: "presence.active_leave_desc_absence".tr()
        );
        return;
      }

      if (isPostCheckOutCooldown) {
        AppToast.showToast(msg: "presence.checkout_cooldown".tr(args: [minutesRemaining.toString()]));
        return;
      }

      // 1. CEK FAKE GPS TERLEBIH DAHULU SEBELUM PROSES LAIN
      try {
        bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (!serviceEnabled) {
          showSecurityBottomSheet(title: "presence.gps_inactive_title".tr(), message: "presence.gps_inactive_message".tr());
          return;
        }

        LocationPermission permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
          if (permission == LocationPermission.denied) return;
        }

        // Cek Posisi & Mocked
        final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);

        if (position.isMocked) {
          // TAMPILKAN PERINGATAN FAKE GPS & KELUAR APLIKASI SAAT DITUTUP
          showSecurityBottomSheet(
              title: "presence.fake_gps_title".tr(),
              message: "presence.fake_gps_message".tr(),
              onClose: () {
                // Logika Keluar Aplikasi
                if (Platform.isAndroid) {
                  SystemNavigator.pop();
                } else {
                  exit(0);
                }
              }
          );
          return; // Hentikan proses
        }
      } catch (e) {
        debugPrint("Error checking GPS: $e");
      }

      // 2. PROSES BIOMETRIK & KAMERA JIKA GPS AMAN
      final bool isAuthenticated = await _authenticateWithBiometrics(context);
      if (!isAuthenticated) {
        AppToast.showToast(msg: "presence.verification_failed".tr());
        return;
      }

      final permissionGranted = await AppPermission.showPermissionModal(context, permissions: [PermissionModal.location, PermissionModal.camera, PermissionModal.microphone, PermissionModal.storage]);
      if (permissionGranted) {
        if (isSessionActive) {
          context.pushNamed(Routes.cameraPresence).then((value) {
            final OnCaptureData? data = value as OnCaptureData?;
            if (data != null) ref.read(checkOutProvider.notifier).state = data;
            else ref.read(refreshAbsenceProvider.notifier).state = DateTime.now().toIso8601String();
          });
        }
        else {
          context.pushNamed(Routes.cameraPresence).then((value) {
            final OnCaptureData? data = value as OnCaptureData?;
            if (data != null) ref.read(checkInProvider.notifier).state = data;
            else ref.read(refreshAbsenceProvider.notifier).state = DateTime.now().toIso8601String();
          });
        }
      }
    }

    Future<bool> canShareLocation() async {
      final lastSharedString = await appPreference.read<String>(AppPreferenceKey.shareLocationLast);
      if (lastSharedString == null) return true;
      final lastShared = DateTime.tryParse(lastSharedString)?.toLocal();
      if (lastShared == null) return true;
      return DateTime.now().difference(lastShared) >= const Duration(hours: 2);
    }

    Future<void> shareLocation() async {
      // VALIDASI TANGGAL
      if (isNotToday) {
        AppToast.showToast(msg: "presence.not_today_location".tr());
        return;
      }

      // VALIDASI IZIN
      if (isCurrentUserOnLeave) {
        showSecurityBottomSheet(
            title: "presence.active_leave_title".tr(),
            message: "presence.active_leave_desc_location".tr()
        );
        return;
      }

      try {
        bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (!serviceEnabled) {
          showSecurityBottomSheet(title: "presence.gps_inactive_title".tr(), message: "presence.gps_inactive_message".tr());
          return;
        }

        final isGranted = await AppPermission.showPermissionModal(context, permissions: [PermissionModal.location]);
        if (!isGranted) return;

        AppDialog.showLoading(context);

        final Position currentPosition = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
        if (currentPosition.isMocked) {
          if (context.mounted) AppDialog.closeLoading(context);
          showSecurityBottomSheet(
              title: "presence.fake_gps_title".tr(),
              message: "presence.fake_gps_message".tr(),
              onClose: () {
                if (Platform.isAndroid) {
                  SystemNavigator.pop();
                } else {
                  exit(0);
                }
              }
          );
          return;
        }

        final user = FirebaseAuth.instance.currentUser;
        String? employeeId = user?.email;
        if (employeeId == null || employeeId.isEmpty) employeeId = await appPreference.read<String>(AppPreferenceKey.email);
        if (employeeId == null || employeeId.isEmpty) employeeId = user?.uid;
        if (employeeId == null || employeeId.isEmpty) employeeId = await appPreference.read<String>(AppPreferenceKey.idkaryawan);

        String? companyId = await appPreference.read<String>(AppPreferenceKey.idperusahaan);

        if (companyId == null || employeeId == null) {
          if (context.mounted) AppDialog.closeLoading(context);
          AppToast.showToast(msg: "presence.account_error".tr());
          return;
        }

        if (kReleaseMode && !await canShareLocation()) {
          if (context.mounted) AppDialog.closeLoading(context);
          AppToast.showToast(msg: "map.share_location_interval".tr());
          return;
        }

        await firebaseFirestoreService.captureAndSaveLocation(companyId: companyId, employeeId: employeeId);
        await appPreference.write<String>(AppPreferenceKey.shareLocationLast, DateTime.now().toIso8601String());
        ref.read(refreshMapProvider.notifier).state = DateTime.now().toIso8601String();

        if (context.mounted) AppDialog.closeLoading(context);
        AppToast.showToast(msg: "map.share_location_success".tr());

      } catch (e) {
        if (context.mounted) AppDialog.closeLoading(context);
        debugPrint("Share Location Error: $e");
        AppToast.showToast(msg: "map.share_location_failed".tr());
      }
    }

    return Scaffold(
      backgroundColor: Colors.grey[100],
      resizeToAvoidBottomInset: false,
      body: Stack(
        children: [
          Positioned.fill(child: _BackgroundMap()),
          _PresenceEvent(
            stopWatchTimer: stopWatchTimer,
            checkIn: checkIn,
            restStart: restStart,
            restEnd: restEnd,
            checkOut: checkOut,
            selectedTimeChip: selectedTimeChip.value,
          ),
          NotificationListener<DraggableScrollableNotification>(
            onNotification: (notification) {
              final bool shouldBeVisible = notification.extent > (minSheetSize + 0.08);
              if (isContentVisible.value != shouldBeVisible) isContentVisible.value = shouldBeVisible;
              return false;
            },
            child: DraggableScrollableSheet(
              controller: sheetController,
              initialChildSize: minSheetSize,
              minChildSize: minSheetSize,
              maxChildSize: maxSheetSize,
              snap: false,
              builder: (context, scrollController) {
                return Container(
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
                    boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 20, spreadRadius: 5, offset: Offset(0, -5))],
                  ),
                  child: Column(
                    children: [
                      GestureDetector(
                        behavior: HitTestBehavior.translucent,
                        onVerticalDragUpdate: (details) {
                          final double screenHeight = MediaQuery.of(context).size.height;
                          final double currentSize = sheetController.size;
                          final double delta = details.primaryDelta! / screenHeight;
                          final double newSize = (currentSize - delta).clamp(minSheetSize, maxSheetSize);
                          sheetController.jumpTo(newSize);
                        },
                        child: Column(
                          children: [
                            GestureDetector(
                              onTap: () {
                                if (sheetController.size > (minSheetSize + 0.1)) {
                                  sheetController.animateTo(minSheetSize, duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                                } else {
                                  sheetController.animateTo(maxSheetSize, duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                                }
                              },
                              behavior: HitTestBehavior.opaque,
                              child: Container(
                                width: double.infinity,
                                padding: const EdgeInsets.only(top: 12, bottom: 8),
                                alignment: Alignment.center,
                                child: Container(
                                  width: 40,
                                  height: 4,
                                  decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(2)),
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),

                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              child: Row(
                                children: [
                                  Expanded(child: _PresenceSearchBar(controller: searchController)),
                                  const SizedBox(width: 8),

                                  // --- TOMBOL MENU (POPUP) DENGAN OPSI SORTIR ---
                                  PopupMenuButton<String>(
                                    offset: const Offset(0, 50),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    color: const Color(0xFFEDEDED),
                                    surfaceTintColor: const Color(0xFFEDEDED),
                                    elevation: 4,
                                    onSelected: (String value) {
                                      if (value == 'refresh') {
                                        loadAllData();
                                        AppToast.showToast(msg: "presence.refreshing_data".tr());
                                      } else if (value == 'sort_az') {
                                        ref.read(presenceSortOptionProvider.notifier).state = 'sort_az';
                                      } else if (value == 'sort_time') {
                                        ref.read(presenceSortOptionProvider.notifier).state = 'sort_time';
                                      }
                                    },
                                    itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
                                      // Menu 1: Refresh
                                      PopupMenuItem<String>(
                                        value: 'refresh',
                                        height: 40,
                                        child: Text(
                                          "presence.refresh".tr(),
                                          style: GoogleFonts.dmSans(
                                            color: Colors.black,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                      // Divider Custom Hitam
                                      const PopupMenuItem<String>(
                                        enabled: false,
                                        height: 1,
                                        padding: EdgeInsets.zero,
                                        child: Divider(
                                          color: Colors.black,
                                          thickness: 1,
                                          indent: 12,
                                          endIndent: 12,
                                          height: 1,
                                        ),
                                      ),
                                      // Menu 2: Sortir Huruf (A-Z)
                                      PopupMenuItem<String>(
                                        value: 'sort_az',
                                        height: 40,
                                        child: Text(
                                          "presence.sort_az".tr(),
                                          style: GoogleFonts.dmSans(
                                            color: Colors.black,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                      // Divider Custom Hitam
                                      const PopupMenuItem<String>(
                                        enabled: false,
                                        height: 1,
                                        padding: EdgeInsets.zero,
                                        child: Divider(
                                          color: Colors.black,
                                          thickness: 1,
                                          indent: 12,
                                          endIndent: 12,
                                          height: 1,
                                        ),
                                      ),
                                      // Menu 3: Sortir Terlama - Terbaru
                                      PopupMenuItem<String>(
                                        value: 'sort_time',
                                        height: 40,
                                        child: Text(
                                          "presence.sort_time".tr(),
                                          style: GoogleFonts.dmSans(
                                            color: Colors.black,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                    ],
                                    // Child: Tampilan Trigger Tombol (Kotak Putih dengan titik 3)
                                    child: Container(
                                      width: 48,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        border: Border.all(color: const Color(0xFFEEEEEE)),
                                        borderRadius: BorderRadius.circular(12),
                                        color: Colors.white,
                                      ),
                                      child: const Icon(Icons.more_vert_rounded, color: Color(0xFF333333)),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            AnimatedSize(
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                              child: SizedBox(
                                width: double.infinity,
                                child: isContentVisible.value
                                    ? AnimatedOpacity(
                                  duration: const Duration(milliseconds: 200),
                                  opacity: isContentVisible.value ? 1.0 : 0.0,
                                  child: Padding(
                                    padding: const EdgeInsets.only(top: 10, bottom: 12),
                                    child: Consumer(builder: (context, ref, child) {
                                      final selectedDate = ref.watch(selectedPresenceDateProvider);
                                      // IMPLEMENTASI LOGIC HIDE FILTER SHIFT
                                      if (!isShiftFilterEnabled) return const SizedBox.shrink();

                                      return Center(child: _PresenceTimeChips(
                                          selectedChip: selectedTimeChip.value,
                                          selectedDate: selectedDate,
                                          // Simpan Value chip yang dipilih ('Masuk'/'Pulang'/'Izin')
                                          onTap: (chipValue) => selectedTimeChip.value = chipValue
                                      ));
                                    }),
                                  ),
                                )
                                    : const SizedBox.shrink(),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // LIST KARYAWAN
                      _PresenceEmployeeList(
                        scrollController: scrollController,
                        isVisible: isContentVisible.value,
                        onRefresh: loadAllData,
                        searchQuery: searchController.text,
                        // Jika fitur filter dinonaktifkan, kirim null agar semua data tampil
                        selectedShift: isShiftFilterEnabled ? selectedTimeChip.value : null,
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          // --- TOMBOL KIRI BAWAH: FORM IZIN ---
          Positioned(
            bottom: (MediaQuery.of(context).size.height * minSheetSize) + 10,
            left: 10,
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 200),
              opacity: isContentVisible.value ? 0.0 : 1.0,
              child: IgnorePointer(
                ignoring: isContentVisible.value || isLeaveFormDisabled,
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: isLeaveFormDisabled ? null : () {
                      context.pushNamed(Routes.leaveRequestForm, extra: LeaveTypeEnum.leave).then((value) {
                        if (value == true) {
                          ref.read(leaveOnAddProvider.notifier).state = DateTime.now().toIso8601String();
                        }
                      });
                    },
                    borderRadius: BorderRadius.circular(50),
                    child: Container(
                      width: 48,
                      height: 48,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                          color: isLeaveFormDisabled ? Colors.grey.shade300 : Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 10,
                                offset: const Offset(0, 4)
                            )
                          ]
                      ),
                      child: SvgPicture.asset(
                        Assets.icons.icWorkHistoryOutlined,
                        width: 20,
                        height: 20,
                        colorFilter: ColorFilter.mode(isLeaveFormDisabled ? Colors.grey : Colors.black, BlendMode.srcIn),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),

          // --- TOMBOL KANAN: FIND ME ---
          Positioned(
            bottom: (MediaQuery.of(context).size.height * minSheetSize) + 10 + 48 + 16,
            right: 10,
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 200),
              opacity: isContentVisible.value ? 0.0 : 1.0,
              child: IgnorePointer(
                // PERUBAHAN: Map Focus TIDAK DISABLE agar selalu bisa diklik kapan saja
                ignoring: isContentVisible.value,
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      ref.read(recenterMapSignalProvider.notifier).state++;
                    },
                    borderRadius: BorderRadius.circular(50),
                    child: Container(
                      width: 48,
                      height: 48,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                          color: Colors.white, // Selalu Putih
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 10,
                                offset: const Offset(0, 4)
                            )
                          ]
                      ),
                      child: SvgPicture.asset(
                        Assets.icons.icGpsShare,
                        width: 20,
                        height: 20,
                        colorFilter: const ColorFilter.mode(Colors.black, BlendMode.srcIn), // Selalu Hitam
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),

          // --- TOMBOL KANAN BAWAH: UPDATE LOKASI ---
          Positioned(
            bottom: (MediaQuery.of(context).size.height * minSheetSize) + 10,
            right: 10,
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 200),
              opacity: isContentVisible.value ? 0.0 : 1.0,
              child: IgnorePointer(
                // PERUBAHAN: Share loc disable jika bukan hari ini atau status izin aktif
                ignoring: isContentVisible.value || isShareLocDisabled,
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: isShareLocDisabled ? null : shareLocation,
                    borderRadius: BorderRadius.circular(50),
                    child: Container(
                      width: 48,
                      height: 48,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        // PERUBAHAN: Warna Abu-abu jika disable
                          color: isShareLocDisabled ? Colors.grey.shade300 : Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 10,
                                offset: const Offset(0, 4)
                            )
                          ]
                      ),
                      child: SvgPicture.asset(
                        Assets.icons.icPresence,
                        width: 20,
                        height: 20,
                        // PERUBAHAN: Icon Abu-abu jika disable
                        colorFilter: ColorFilter.mode(isShareLocDisabled ? Colors.grey : Colors.black, BlendMode.srcIn),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),

          Positioned(
              top: 10,
              left: 0,
              right: 0,
              child: SafeArea(
                child: _PresenceHeader(
                  stopWatchTimer: stopWatchTimer,
                  isSessionActive: isSessionActive,
                  onAbsenceTap: onAbsenceButtonTap,
                  // PERUBAHAN: Header Switch disable jika bukan hari ini atau status izin aktif
                  isDisabled: isAbsenceDisabled,
                ),
              )
          ),
        ],
      ),
    );
  }
}

Future<bool> _authenticateWithBiometrics(BuildContext context) async {
  final LocalAuthentication auth = LocalAuthentication();
  try {
    final bool isDeviceSupported = await auth.isDeviceSupported();
    if (!isDeviceSupported) return true;
    return await auth.authenticate(
      localizedReason: "presence.biometric_reason".tr(),
      options: const AuthenticationOptions(stickyAuth: true, biometricOnly: false),
    );
  } on PlatformException catch (e) {
    if (e.code == 'NotEnrolled' || e.code == 'NotAvailable' || e.code == 'no_biometrics') return true;
    return false;
  } catch (e) { return false; }
}

class _PresenceHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    final client = super.createHttpClient(context);
    client.userAgent = 'HoraPro/1.0 (+https://horaapp.id; contact: support@hora.example.com)';
    return client;
  }
}

class _BackgroundMap extends HookConsumerWidget {
  const _BackgroundMap();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    HttpOverrides.global = _PresenceHttpOverrides();

    final appPreference = ref.watch(appPreferenceProvider);
    final markers = useState<List<Marker>>([]);
    final isLoading = useState<bool>(true);
    final isMapReady = useState<bool>(false);
    final mapController = useMemoized(() => MapController(), []);
    final cameraCenter = useState<LatLng>(LatLng(-6.2088, 106.8456));

    final employees = ref.watch(employeesMapProvider);
    final employeeLocations = ref.watch(employeeLocationsMapProvider);
    final date = ref.watch(dateMapProvider);

    // --- LISTENER UNTUK FIND ME ---
    ref.listen<int>(recenterMapSignalProvider, (prev, next) async {
      if (isMapReady.value) {
        final pos = await LocationService.getPosition();
        if (pos != null) {
          final latLng = LatLng(pos.latitude, pos.longitude);
          mapController.move(latLng, 17.0); // Zoom in saat Find Me
        }
      }
    });

    Future<void> fetchData() async {
      try {
        isLoading.value = true;
        final firebaseService = ref.read(firebaseFirestoreServiceProvider);
        final companyId = await appPreference.read<String>(AppPreferenceKey.idperusahaan);

        if (employees.isEmpty) {
          final profileNotifier = ref.read(staffStateNotifierProvider.notifier);
          final staffResult = await profileNotifier.getStaff();
          staffResult.fold(
                (failure) => debugPrint("Failed to load staff API: ${failure.message}"),
                (staffs) => ref.read(employeesMapProvider.notifier).state = (staffs as List).map((e) => e is Staff ? e : Staff.fromJson(e)).toList(),
          );
        }

        if (companyId != null) {
          final history = await firebaseService.getLocationHistory(companyId: companyId, date: date);
          ref.read(employeeLocationsMapProvider.notifier).state = history;
        }
      } catch (e) {
        debugPrint("Error fetching data: $e");
      } finally {
        if (context.mounted) isLoading.value = false;
      }
    }

    Future<void> updateMarkers() async {
      try {
        final user = FirebaseAuth.instance.currentUser;
        final myEmail = user?.email?.toLowerCase().trim();
        final myUid = user?.uid.toLowerCase().trim();

        final filteredLocations = employeeLocations.where((location) {
          final locationDate = location.createdAt.toLocal();
          final selectedDate = DateTime(date.year, date.month, date.day);
          final diff = locationDate.difference(selectedDate).inHours.abs();
          return diff <= 24;
        }).toList();

        final latestPerEmployee = <String, EmployeeLocation>{};
        for (final location in filteredLocations) {
          final id = location.employeeId.toLowerCase().trim();
          if (id.isEmpty) continue;
          if (!latestPerEmployee.containsKey(id) || location.createdAt.isAfter(latestPerEmployee[id]!.createdAt)) {
            latestPerEmployee[id] = location;
          }
        }

        final newMarkers = <Marker>[];

        for (final location in latestPerEmployee.values) {
          final locId = location.employeeId.toLowerCase().trim();

          bool isMyself = false;
          if (myEmail != null && locId == myEmail) isMyself = true;
          if (!isMyself && myUid != null && locId == myUid) isMyself = true;

          if (isMyself) continue;

          final employee = employees.firstWhereOrNull((staff) {
            String staffEmail = '';
            try {
              final s = staff as dynamic;
              if (s.alamatEmail != null) staffEmail = s.alamatEmail.toString().toLowerCase().trim();
              if (staffEmail.isEmpty && s.email != null) staffEmail = s.email.toString().toLowerCase().trim();
            } catch (_) {}

            String staffUid = '';
            try {
              final s = staff as dynamic;
              if (s.uid != null) staffUid = s.uid.toString().toLowerCase().trim();
            } catch (_) {}

            final staffId = (staff.idkaryawan ?? '').toLowerCase().trim();

            if (staffEmail.isNotEmpty && locId == staffEmail) return true;
            if (staffUid.isNotEmpty && locId == staffUid) return true;
            if (staffId.isNotEmpty && locId == staffId) return true;

            return false;
          });

          newMarkers.add(
            Marker(
              point: LatLng(location.latitude, location.longitude),
              width: 50,
              height: 50,
              child: AppWidgets.mapMarker(
                imageUrl: employee?.foto?.toUrlImageHora ?? "",
                isMe: false,
              ),
            ),
          );
        }

        final userMarker = markers.value.firstWhereOrNull((m) => m.key == const ValueKey("user"));
        if (userMarker != null) newMarkers.add(userMarker);

        markers.value = newMarkers;
      } catch (e) {
        debugPrint("updateMarkers error: $e");
      }
    }

    // PERBAIKAN: Fungsi mengambil marker pengguna dengan url foto yang benar
    Future<void> loadUserMarker() async {
      final pos = await LocationService.getPosition();
      if (pos == null) return;

      markers.value.removeWhere((m) => m.key == const ValueKey("user"));

      final userLatLng = LatLng(pos.latitude, pos.longitude);

      // --- LOGIKA MENGAMBIL FOTO DARI SHARED PREFERENCES ---
      String photoUrl = 'https://avatar.iran.liara.run/public';
      try {
        final pic = await appPreference.read<String>(AppPreferenceKey.profilePicture);
        if (pic != null && pic.isNotEmpty) {
          photoUrl = pic.toString().toUrlImageHora; // Ubah data string ke url valid (menambah base_url)
        }
      } catch (e) {
        debugPrint("Error loading profile picture: $e");
      }

      final myMarker = Marker(
          key: const ValueKey("user"),
          point: userLatLng,
          width: 50,
          height: 50,
          child: AppWidgets.mapMarker(imageUrl: photoUrl, isMe: true)
      );

      markers.value = [...markers.value, myMarker];

      cameraCenter.value = userLatLng;

      if (isMapReady.value) {
        mapController.move(userLatLng, 15);
      }
    }

    useEffect(() {
      Future.microtask(() async { await fetchData(); });
      return null;
    }, [date]);

    useEffect(() {
      Future.microtask(() => updateMarkers());
      return null;
    }, [employeeLocations, employees]);

    useEffect(() {
      loadUserMarker();
      return null;
    }, []);

    ref.listen<String>(refreshMapProvider, (prev, next) {
      fetchData();
      loadUserMarker();
    });

    return Stack(
      children: [
        FlutterMap(
          mapController: mapController,
          options: MapOptions(
            initialCenter: cameraCenter.value,
            initialZoom: 15,
            minZoom: 3,
            maxZoom: 18,
            keepAlive: true,
            interactionOptions: const InteractionOptions(flags: InteractiveFlag.all),
            onMapReady: () {
              isMapReady.value = true;
              if (cameraCenter.value.latitude != -6.2088) {
                mapController.move(cameraCenter.value, 15);
              }
            },
          ),
          children: [
            TileLayer(
              urlTemplate: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
              userAgentPackageName: "com.hora.apppro",
              tileProvider: NetworkTileProvider(headers: {'User-Agent': 'HoraPro/1.0 (com.hora.apppro)'}),
              additionalOptions: const {'flutter_map_warn': 'false'},
            ),
            MarkerLayer(markers: markers.value),
            Positioned(
              left: 16,
              bottom: (MediaQuery.of(context).size.height * 0.17),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.7), borderRadius: BorderRadius.circular(8)),
                child: GestureDetector(
                  onTap: () => launchUrl(Uri.parse('https://www.openstreetmap.org/copyright')),
                  child: Text(
                      '© OpenStreetMap',
                      style: AppTheme.secondaryTextStyle.copyWith(fontSize: 10, color: Colors.black)
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}