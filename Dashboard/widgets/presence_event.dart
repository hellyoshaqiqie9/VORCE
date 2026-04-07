part of '../views/presence.dart';

class _PresenceEvent extends HookConsumerWidget {
  const _PresenceEvent({
    super.key,
    required this.stopWatchTimer,
    required this.checkIn,
    required this.restStart,
    required this.restEnd,
    required this.checkOut,
    this.selectedTimeChip,
  });

  final StopWatchTimer stopWatchTimer;
  final ValueNotifier<OnCaptureData?> checkIn;
  final ValueNotifier<OnCaptureData?> restStart;
  final ValueNotifier<OnCaptureData?> restEnd;
  final ValueNotifier<OnCaptureData?> checkOut;
  final String? selectedTimeChip;

  // Helper function to compress image if it's larger than 500KB
  Future<File> _compressImageIfNeeded(File originalFile) async {
    try {
      final fileSizeInBytes = await originalFile.length();
      final fileSizeInKB = fileSizeInBytes / 1024;
      if (fileSizeInKB <= 2000) return originalFile;
      final dir = await getTemporaryDirectory();
      final targetPath = path.join(dir.absolute.path, "compressed_${path.basename(originalFile.path)}");
      final compressedFile = await FlutterImageCompress.compressAndGetFile(
        originalFile.absolute.path, targetPath, quality: 70, minWidth: 1024, minHeight: 1024, format: CompressFormat.jpeg,
      );
      return compressedFile != null ? File(compressedFile.path) : originalFile;
    } catch (e) { return originalFile; }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // --- STATE & PROVIDERS ---
    final ValueNotifier<String?> id = useState(null);
    final savedAbsenceId = ref.watch(currentIdAbsenceProvider);

    useEffect(() {
      if (id.value == null && savedAbsenceId != null && savedAbsenceId.isNotEmpty) {
        id.value = savedAbsenceId;
      }
      return null;
    }, [savedAbsenceId]);

    // --- BOTTOM SHEET HELPER (POPUP DARI BAWAH) ---
    void showSecurityBottomSheet({required String title, required String message}) {
      if (!context.mounted) return;
      showModalBottomSheet(
        context: context,
        backgroundColor: Colors.white,
        isScrollControlled: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        builder: (context) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom, // Handle keyboard if any
            left: 24,
            right: 24,
            top: 12,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle Bar
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Icon Circle (Error/Warning Style)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: Color(0xFFFFEBEE), // Light Red Background
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.gpp_bad_rounded, // Security/Warning Icon
                  color: Color(0xFFD32F2F), // Red Error Color
                  size: 48,
                ),
              ),
              const SizedBox(height: 16),
              // Title
              Text(
                title,
                // IMPLEMENTASI GLOBAL FONT STYLE
                style: AppTheme.primaryTextStyle.copyWith(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF333333),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              // Message
              Text(
                message,
                // IMPLEMENTASI GLOBAL FONT STYLE
                style: AppTheme.secondaryTextStyle.copyWith(
                  fontSize: 14,
                  color: const Color(0xFF757575),
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              // Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    elevation: 0,
                    backgroundColor: const Color(0xFFD32F2F), // Red Button
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text(
                    "presence.understand".tr(),
                    style: AppTheme.primaryTextStyle.copyWith(fontWeight: FontWeight.w600, fontSize: 14, color: Colors.white),
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      );
    }

    // --- LOGIKA BERBAGI LOKASI OTOMATIS (VALIDASI ABSENSI) ---
    Future<bool> verifyAndShareLocation(BuildContext context) async {
      try {
        AppDialog.showLoading(context);

        // 1. Cek Service GPS
        bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (!serviceEnabled) {
          if (context.mounted) AppDialog.closeLoading(context);
          showSecurityBottomSheet(
              title: "presence.gps_off_title".tr(),
              message: "presence.gps_off_msg".tr()
          );
          return false;
        }

        // 2. Cek Izin Lokasi
        LocationPermission permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
          if (context.mounted) AppDialog.closeLoading(context);
          showSecurityBottomSheet(
              title: "presence.permission_denied_title".tr(),
              message: "presence.permission_denied_msg".tr()
          );
          return false;
        }

        // 3. Cek Fake GPS (CRITICAL)
        final Position currentPosition = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );

        if (currentPosition.isMocked) {
          if (context.mounted) AppDialog.closeLoading(context);
          showSecurityBottomSheet(
              title: "presence.fake_gps_title".tr(),
              message: "presence.fake_gps_message".tr()
          );
          return false;
        }

        // 4. Identifikasi User
        final appPreference = ref.read(appPreferenceProvider);
        final user = FirebaseAuth.instance.currentUser;

        String? employeeId = user?.email;
        if (employeeId == null || employeeId.isEmpty) {
          employeeId = await appPreference.read<String>(AppPreferenceKey.email);
        }
        if (employeeId == null || employeeId.isEmpty) {
          employeeId = user?.uid;
        }
        if (employeeId == null || employeeId.isEmpty) {
          employeeId = await appPreference.read<String>(AppPreferenceKey.idkaryawan);
        }

        String? companyId;
        try {
          final token = await appPreference.read<String>(AppPreferenceKey.bearerToken);
          if (token != null && token.isNotEmpty) {
            final cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            final parts = cleanToken.split('.');
            if (parts.length == 3) {
              final payload = json.decode(utf8.decode(base64Url.decode(base64.normalize(parts[1]))));
              companyId = payload['idCompany']?.toString();
            }
          }
        } catch (_) {}

        if (companyId == null || companyId.isEmpty) {
          companyId = await appPreference.read<String>(AppPreferenceKey.idperusahaan);
        }

        if (companyId == null || employeeId == null) {
          if (context.mounted) AppDialog.closeLoading(context);
          AppToast.showToast(msg: "presence.account_error".tr());
          return false;
        }

        // 5. Kirim Lokasi ke Firebase
        final firebaseService = ref.read(firebaseFirestoreServiceProvider);
        await firebaseService.captureAndSaveLocation(
          companyId: companyId,
          employeeId: employeeId,
        );

        // Update last shared time & refresh map
        await appPreference.write<String>(
          AppPreferenceKey.shareLocationLast,
          DateTime.now().toIso8601String(),
        );
        ref.read(refreshMapProvider.notifier).state = DateTime.now().toIso8601String();

        if (context.mounted) AppDialog.closeLoading(context);
        return true; // SUKSES

      } catch (e) {
        if (context.mounted) AppDialog.closeLoading(context);
        debugPrint("Location Verification Failed: $e");
        AppToast.showToast(msg: "map.share_location_failed".tr() + ": ${e.toString()}");
        return false;
      }
    }

    // Proses Data Absensi dari API
    void processAttendanceData(dynamic success) {
      if (success == null) {
        checkIn.value = null;
        checkOut.value = null;
        id.value = null;
        return;
      }

      final now = DateTime.now();
      // Gunakan waktu checkIn sebagai referensi utama
      final recordDate = (success.waktuCheckIn ?? success.waktuCheckOut ?? DateTime.now()).toLocal();

      // LOGIKA PERBAIKAN:
      // Cek apakah sesi ini sudah selesai (Ada CheckOut)
      final bool isSessionFinished = success.waktuCheckOut != null;

      // Cek apakah sesi ini beda hari
      final bool isDifferentDay = recordDate.year != now.year || recordDate.month != now.month || recordDate.day != now.day;

      // KONDISI RESET:
      // Hanya reset jika sesi SUDAH SELESAI DAN BEDA HARI.
      // Jika sesi BELUM SELESAI (CheckOut null), biarkan tetap aktif meskipun beda hari (agar bisa di-checkout).
      if (isSessionFinished && isDifferentDay) {
        checkIn.value = null;
        checkOut.value = null;
        id.value = null;
        return;
      }

      final String? newId = success?.id?.toString();
      // Cek apakah ID berubah (misal dari null ke ada)
      final bool idChanged = id.value != newId;

      id.value = newId;
      if (newId != null && newId.isNotEmpty) {
        Future.microtask(() => ref.read(currentIdAbsenceProvider.notifier).state = newId);
      }

      if (success != null && success.waktuCheckIn != null) {
        checkIn.value = OnCaptureData(
            dateTime: (success.waktuCheckIn ?? DateTime.now()).toLocal(),
            file: null,
            url: success.fotoKaryawan?.toString().toUrlImageHora,
            address: success.alamatLoc ?? '--');

        // LOGIKA TIMER:
        // 1. Jika sesi belum selesai (waktuCheckOut NULL)
        if (success.waktuCheckOut == null) {
          final startTime = (success.waktuCheckIn as DateTime).toLocal();
          final currentTime = DateTime.now();
          final durationInSeconds = currentTime.difference(startTime).inSeconds;
          final expectedSeconds = durationInSeconds < 0 ? 0 : durationInSeconds;

          // Dapatkan waktu timer saat ini (dalam detik)
          final currentTimerSeconds = (stopWatchTimer.rawTime.value / 1000).floor();

          // Hitung selisih antara timer sekarang vs seharusnya
          final diff = (expectedSeconds - currentTimerSeconds).abs();

          // SINKRONISASI ULANG TIMER JIKA:
          // a. ID Berubah (Baru load data pertama kali atau ganti sesi)
          // b. Timer belum jalan (rawTime == 0) tapi status aktif
          // c. Terjadi drift waktu yang besar (> 2 detik), misal karena app di-minimize lama/restart
          if (idChanged || stopWatchTimer.rawTime.value == 0 || diff > 2) {
            debugPrint("SYNC TIMER: IDChanged=$idChanged, Timer=0=${stopWatchTimer.rawTime.value == 0}, Diff=$diff");
            stopWatchTimer.clearPresetTime();
            stopWatchTimer.setPresetSecondTime(expectedSeconds);
            stopWatchTimer.onStartTimer();
          }
        }
        // 2. Jika sesi selesai (waktuCheckOut ADA)
        else {
          stopWatchTimer.onStopTimer();
        }

        if (success.waktuCheckOut == null) {
          if (success.istirahatIn != null && success.istirahatOut == null) {
            ref.read(localNotificationServiceProvider).showNotificationBreakTime(success.istirahatIn);
          } else if (success.istirahatIn != null && success.istirahatOut != null) {
            ref.read(localNotificationServiceProvider).showNotificationAbsentResumed(success.istirahatOut);
          } else {
            ref.read(localNotificationServiceProvider)
              ..showNotificationAbsen(success.waktuCheckIn, success.idKaryawan)
              ..showNotificationAfter12Hours(success.waktuCheckIn);
          }
        }
      } else { checkIn.value = null; }

      if (success != null && success.waktuCheckOut != null) {
        checkOut.value = OnCaptureData(
            dateTime: (success.waktuCheckOut ?? DateTime.now()).toLocal(),
            file: null,
            url: success.fotoPulang?.toString().toUrlImageHora,
            address: success.alamatPulang ?? '--');
        // Pastikan timer berhenti jika ada checkout
        stopWatchTimer.onStopTimer();
      } else { checkOut.value = null; }

      if (success != null && success.istirahatIn != null) {
        restStart.value = OnCaptureData(dateTime: (success.istirahatIn ?? DateTime.now()).toLocal(), file: null, url: success.fotoIsitrahatIn?.toString().toUrlImageHora, address: success.alamatistirahatin ?? '--');
      } else { restStart.value = null; }

      if (success != null && success.istirahatOut != null) {
        restEnd.value = OnCaptureData(dateTime: (success.istirahatOut ?? DateTime.now()).toLocal(), file: null, url: success.fotoIstirahatOut?.toString().toUrlImageHora, address: success.alamatistirahatout ?? '--');
      } else { restEnd.value = null; }
    }

    Future<void> getCurrentAttendance() async {
      // PERBAIKAN: Gunakan tanggal HARI INI (00:00 s/d sekarang) jika tidak ingin mengambil data kemarin
      // Jika sistem Anda mendukung shift malam (check-in kemarin, check-out hari ini), biarkan logic -1 hari
      // namun logic sorting di Datasource akan tetap melindungi Anda dari salah ambil ID.
      final now = DateTime.now();

      // Menggunakan HARI INI saja lebih aman untuk menghindari konflik data lama
      final todayStart = DateTime(now.year, now.month, now.day);

      // Hitung Start/End UTC untuk getCurrentAttendance (Sama seperti getAttendanceList di bawah)
      final startUtc = todayStart.toUtc();
      final endUtc = DateTime(now.year, now.month, now.day, 23, 59, 59).toUtc();

      await ref.read(attendanceStateNotifierProvider.notifier).getAttendance(
        // Menggunakan ISO String yang aman UTC+Z
          start: "${startUtc.toIso8601String().substring(0, 19)}Z",
          end: "${endUtc.toIso8601String().substring(0, 19)}Z"
      ).then((result) {
        result.fold((failed) {}, (success) { processAttendanceData(success); });
      });
    }

    // --- LISTENERS ---

    ref.listen<OnCaptureData?>(checkInProvider, (previous, next) async {
      if (next?.file != null) {
        if (context.mounted) {
          final bool locationValid = await verifyAndShareLocation(context);
          if (!locationValid) return;
        }

        final timezone = await FlutterTimezone.getLocalTimezone();
        final originalFile = File(next!.file!.path);
        final compressedFile = await _compressImageIfNeeded(originalFile);

        await ref.read(attendanceStateNotifierProvider.notifier).checkIn(timezone: timezone, photo: compressedFile).then((res) {
          res.fold((failed) {
            AppToast.showToast(msg: failed.message.toString());
          }, (success) {
            AppToast.showToast(msg: "presence.welcome_work".tr());
            Future.delayed(const Duration(milliseconds: 500), () async {
              await getCurrentAttendance();

              // PERBAIKAN VITAL: Kalkulasi Timezone yang benar agar tidak memotong absen pagi (00:00 - 07:00 WIB)
              final now = DateTime.now();
              // 1. Tentukan batas hari dalam waktu LOKAL
              final startLocal = DateTime(now.year, now.month, now.day, 0, 0, 0);
              final endLocal = DateTime(now.year, now.month, now.day, 23, 59, 59);

              // 2. Konversi ke UTC
              // Jika WIB (UTC+7), jam 00:00 Local -> jam 17:00 Kemarin (UTC)
              final startUtc = startLocal.toUtc();
              final endUtc = endLocal.toUtc();

              // 3. Format ke String ISO8601 Clean (YYYY-MM-DDTHH:mm:ssZ)
              final startOfDay = "${startUtc.toIso8601String().substring(0, 19)}Z";
              final endOfDay = "${endUtc.toIso8601String().substring(0, 19)}Z";

              ref.read(attendanceListStateNotifierProvider.notifier).getAttendanceList(
                  start: startOfDay,
                  end: endOfDay
              );
            });
          });
        }).whenComplete(() => ref.read(refreshAbsenceProvider.notifier).state = DateTime.now().toIso8601String());
      }
    });

    ref.listen<OnCaptureData?>(checkOutProvider, (previous, next) async {
      if (next?.file != null) {
        if (context.mounted) {
          final bool locationValid = await verifyAndShareLocation(context);
          if (!locationValid) return;
        }

        final timezone = await FlutterTimezone.getLocalTimezone();
        final originalFile = File(next!.file!.path);
        final compressedFile = await _compressImageIfNeeded(originalFile);
        final idToUse = id.value ?? ref.read(currentIdAbsenceProvider) ?? "";

        // AMBIL ALAMAT DARI CAPTURE DATA
        final addressFromCapture = next!.address;

        if (idToUse.isEmpty) {
          AppToast.showToast(msg: "presence.session_lost".tr());
          return;
        }

        final dateNow = DateFormat('yyyy-MM-dd').format(DateTime.now());

        await ref.read(attendanceStateNotifierProvider.notifier).checkOut(
            id: idToUse,
            date: dateNow,
            timezone: timezone,
            photo: compressedFile,
            address: addressFromCapture // Pass address
        ).then((res) {
          res.fold((failed) {
            AppToast.showToast(msg: failed.message.toString());
          }, (success) {
            AppToast.showToast(msg: "presence.success_checkout".tr());
            String? idKaryawan;
            if (success is Map) idKaryawan = success['idKaryawan']?.toString();
            if (idKaryawan != null) ref.read(localNotificationServiceProvider).showNotificationAbsentDone(idKaryawan);
            Future.delayed(const Duration(milliseconds: 500), () async { await getCurrentAttendance(); });
          });
        }).whenComplete(() => ref.read(refreshAbsenceProvider.notifier).state = DateTime.now().toIso8601String());
      }
    });

    useEffect(() {
      Future.microtask(() async { if (context.mounted) getCurrentAttendance(); });
      return null;
    }, []);

    ref.listen<AppState>(dateSpecificAttendanceStateNotifierProvider, (prev, next) {
      next.when(
        initial: () {},
        loading: () {},
        success: (data) => processAttendanceData(data),
        failed: (e) {},
      );
    });

    return const SizedBox.shrink();
  }
}