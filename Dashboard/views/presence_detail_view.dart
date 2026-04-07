part of 'presence.dart';

class PresenceDetailView extends HookConsumerWidget {
  final Map<String, dynamic> employee;
  final int initialIndex; // Dipertahankan untuk kompatibilitas route, meski tab sudah tidak ada

  // Set default initialIndex ke 0
  const PresenceDetailView({super.key, required this.employee, this.initialIndex = 0});

  // Helper aman untuk parse double dari JSON/Dynamic yang jauh lebih kuat
  double? _parseDouble(dynamic val) {
    if (val == null) return null;
    if (val is double) return val;
    if (val is int) return val.toDouble();
    if (val is String) {
      // Bersihkan spasi dan ubah koma menjadi titik (jika API salah format)
      final str = val.trim().replaceAll(',', '.');
      if (str.isEmpty || str.toLowerCase() == 'null') return null;
      return double.tryParse(str);
    }
    return null;
  }

  // Helper untuk mem-parsing DateTime dari berbagai format (String / Firestore Timestamp)
  DateTime? _parseDateTime(dynamic val) {
    if (val == null) return null;
    if (val is DateTime) return val;
    try {
      if ((val as dynamic).toDate != null) {
        // ignore: avoid_dynamic_calls
        return (val as dynamic).toDate();
      }
    } catch (_) {}
    if (val is Map) {
      if (val.containsKey('_seconds')) {
        final seconds = val['_seconds'];
        final nanoseconds = val['_nanoseconds'] ?? 0;
        if (seconds is int) {
          return DateTime.fromMillisecondsSinceEpoch(seconds * 1000 + (nanoseconds as int) ~/ 1000000);
        }
      }
    }
    if (val is String) {
      return DateTime.tryParse(val);
    }
    return null;
  }

  // Widget Card Serbaguna (Untuk Masuk, Pulang, dan History Lokasi)
  Widget _buildUnifiedCard({
    required String address,
    required DateTime time,
    required String iconAsset,
    required Color cardColor,
    required Color textColor,
    required Color iconColor,
    required Color timeColor,
    double? lat,
    double? lng,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      height: AppTheme.cardHeight,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(6.61),
        border: Border.all(color: cardColor == Colors.white ? AppColors.lightGrey : cardColor, width: 1),
      ),
      child: Row(
        children: [
          SvgPicture.asset(
            iconAsset,
            width: 20,
            height: 20,
            colorFilter: ColorFilter.mode(iconColor, BlendMode.srcIn),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              (address.isNotEmpty && address.toLowerCase() != "null")
                  ? address
                  : (lat != null && lng != null ? "${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)}" : "presence.no_location_available".tr()),
              style: AppTheme.primaryTextStyle.copyWith(fontWeight: FontWeight.w600, color: textColor),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            DateFormat("HH:mm").format(time.toLocal()),
            style: AppTheme.secondaryTextStyle.copyWith(color: timeColor, fontWeight: FontWeight.w500),
          ),
          const SizedBox(width: 4),
          // Ikon Map akan selalu muncul di sini jika lat & lng berhasil didapatkan
          if (lat != null && lng != null)
            InkWell(
              onTap: () async {
                final Uri url = Uri.parse("https://www.google.com/maps/search/?api=1&query=$lat,$lng");
                try { await launchUrl(url, mode: LaunchMode.externalApplication); } catch (e) { debugPrint("Could not launch map: $e"); }
              },
              borderRadius: BorderRadius.circular(20),
              child: Padding(
                padding: const EdgeInsets.all(4.0),
                child: SvgPicture.asset(
                  Assets.icons.icMapFind,
                  width: 14,
                  height: 14,
                  colorFilter: ColorFilter.mode(iconColor, BlendMode.srcIn),
                ),
              ),
            )
          else
            const SizedBox(width: 22),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // State untuk menyimpan list lokasi history
    final historyLocations = useState<List<EmployeeLocation>>([]);
    final isLoadingHistory = useState<bool>(false);

    // --- FETCH DATA HISTORY LOKASI ---
    Future<void> fetchLocationHistory() async {
      try {
        isLoadingHistory.value = true;
        final appPreference = ref.read(appPreferenceProvider);
        final firebaseService = ref.read(firebaseFirestoreServiceProvider);

        final companyId = await appPreference.read<String>(AppPreferenceKey.idperusahaan);
        final date = ref.read(selectedPresenceDateProvider);

        if (companyId != null) {
          // 1. Ekstrak Email Murni dari Company List (Sumber Kebenaran)
          String targetEmail = '';

          final member = employee['member'];
          if (member != null) {
            try { targetEmail = (member as dynamic).email?.toString().trim() ?? ''; } catch (_) {}
            if (targetEmail.isEmpty) {
              try { targetEmail = (member as dynamic).alamatEmail?.toString().trim() ?? ''; } catch (_) {}
            }
          }

          // 2. AMBIL DATA DARI FIREBASE
          final allHistory = await firebaseService.getLocationHistory(
              companyId: companyId,
              date: date
          );

          // 3. FILTERING PASTI (Murni Menggunakan Email)
          final filtered = allHistory.where((loc) {
            final locId = loc.employeeId.trim().toLowerCase();
            if (locId.isEmpty) return false;

            // Pencocokan ke Log Firebase yang sangat akurat menggunakan Email
            if (targetEmail.isNotEmpty && locId == targetEmail.toLowerCase()) return true;

            return false;
          }).toList();

          // Urutkan dari yang terbaru ke terlama
          filtered.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          historyLocations.value = filtered;
        }
      } catch (e) {
        debugPrint("Error fetching history: $e");
      } finally {
        isLoadingHistory.value = false;
      }
    }

    // Jalankan fetch history saat halaman dibuka
    useEffect(() {
      fetchLocationHistory();
      return null;
    }, []);

    // --- LOGIC PERSIAPAN DATA (MASUK / PULANG) ---
    final attendance = employee['attendance'];
    dynamic checkInTimeRaw = employee['checkInTime'];
    dynamic checkOutTimeRaw;

    String? checkInAddress;
    String? checkOutAddress;
    double? checkInLat;
    double? checkInLng;
    double? checkOutLat;
    double? checkOutLng;

    if (attendance != null) {
      // Strategi konversi ke Map (toJson) agar ekstraksi jauh lebih aman dan akurat
      Map<String, dynamic> attMap = {};
      if (attendance is Map) {
        attMap = Map<String, dynamic>.from(attendance);
      } else {
        try {
          attMap = (attendance as dynamic).toJson();
        } catch (_) {}
      }

      if (attMap.isNotEmpty) {
        checkInTimeRaw ??= attMap['waktuCheckIn'] ?? attMap['tanggal'];
        checkOutTimeRaw = attMap['waktuCheckOut'];

        // Alamat
        checkInAddress = attMap['alamatLoc']?.toString() ?? attMap['AlamatLoc']?.toString() ?? attMap['alamatCheckIn']?.toString() ?? attMap['alamat']?.toString();
        checkOutAddress = attMap['alamatPulang']?.toString() ?? attMap['AlamatPulang']?.toString() ?? attMap['alamatCheckOut']?.toString();

        // Pengecekan multi-key ekstensif LatLng Masuk
        checkInLat = _parseDouble(attMap['alamatLatitude'] ?? attMap['AlamatLatitude'] ?? attMap['latitude'] ?? attMap['Latitude'] ?? attMap['lat']);
        checkInLng = _parseDouble(attMap['alamatLongtitude'] ?? attMap['AlamatLongtitude'] ?? attMap['alamatLongitude'] ?? attMap['longitude'] ?? attMap['Longitude'] ?? attMap['lng']);

        // Pengecekan multi-key ekstensif LatLng Pulang
        checkOutLat = _parseDouble(attMap['LatitudePulang'] ?? attMap['latitudePulang'] ?? attMap['alamatLatitudePulang']);
        checkOutLng = _parseDouble(attMap['LongtitudePulang'] ?? attMap['longtitudePulang'] ?? attMap['longitudePulang'] ?? attMap['alamatLongtitudePulang']);
      }

      // Fallback: Jika toJson() gagal atau data kosong, gunakan akses dynamic berlapis
      if (checkInLat == null) {
        try { checkInLat = _parseDouble((attendance as dynamic).alamatLatitude); } catch (_) {}
        if (checkInLat == null) try { checkInLat = _parseDouble((attendance as dynamic).AlamatLatitude); } catch (_) {}
        if (checkInLat == null) try { checkInLat = _parseDouble((attendance as dynamic).latitude); } catch (_) {}
      }
      if (checkInLng == null) {
        try { checkInLng = _parseDouble((attendance as dynamic).alamatLongtitude); } catch (_) {}
        if (checkInLng == null) try { checkInLng = _parseDouble((attendance as dynamic).AlamatLongtitude); } catch (_) {}
        if (checkInLng == null) try { checkInLng = _parseDouble((attendance as dynamic).alamatLongitude); } catch (_) {}
        if (checkInLng == null) try { checkInLng = _parseDouble((attendance as dynamic).longitude); } catch (_) {}
      }

      if (checkOutLat == null) {
        try { checkOutLat = _parseDouble((attendance as dynamic).LatitudePulang); } catch (_) {}
        if (checkOutLat == null) try { checkOutLat = _parseDouble((attendance as dynamic).latitudePulang); } catch (_) {}
      }
      if (checkOutLng == null) {
        try { checkOutLng = _parseDouble((attendance as dynamic).LongtitudePulang); } catch (_) {}
        if (checkOutLng == null) try { checkOutLng = _parseDouble((attendance as dynamic).longtitudePulang); } catch (_) {}
        if (checkOutLng == null) try { checkOutLng = _parseDouble((attendance as dynamic).longitudePulang); } catch (_) {}
      }

      if (checkInAddress == null || checkInAddress.isEmpty) {
        try { checkInAddress = (attendance as dynamic).alamatLoc ?? (attendance as dynamic).alamatCheckIn; } catch (_) {}
      }
      if (checkOutAddress == null || checkOutAddress.isEmpty) {
        try { checkOutAddress = (attendance as dynamic).alamatPulang ?? (attendance as dynamic).alamatCheckOut; } catch (_) {}
      }
    }

    final checkInTime = _parseDateTime(checkInTimeRaw);
    final checkOutTime = _parseDateTime(checkOutTimeRaw);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        shape: const Border(),
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.darkGray, size: AppTheme.iconSize),
          onPressed: () => Navigator.pop(context),
        ),
        title: Builder(builder: (context) {
          // Ambil foto face verification dari data attendance
          // Strategi ekstraksi berlapis karena attendance bisa berupa Absence object ATAU Map
          final att = employee['attendance'];
          String? facePhotoUrl;

          if (att != null) {
            // Strategi 1: Akses sebagai Object (Absence model - dari admin presence list)
            try { facePhotoUrl = (att as dynamic).fotoKaryawan?.toString(); } catch (_) {}
            if (facePhotoUrl == null || facePhotoUrl.isEmpty) {
              try { facePhotoUrl = (att as dynamic).foto?.toString(); } catch (_) {}
            }
            // Strategi 2: Akses sebagai Map (dari UserAbsenceList)
            if (facePhotoUrl == null || facePhotoUrl.isEmpty) {
              if (att is Map) {
                facePhotoUrl = att['fotoKaryawan']?.toString();
                if (facePhotoUrl == null || facePhotoUrl.isEmpty) facePhotoUrl = att['fotoCheckIn']?.toString();
                if (facePhotoUrl == null || facePhotoUrl.isEmpty) facePhotoUrl = att['Foto']?.toString();
              }
            }
            if (facePhotoUrl?.isEmpty == true) facePhotoUrl = null;
          }

          return Row(
            children: [
              if (facePhotoUrl != null) ...[
                GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => Scaffold(
                          backgroundColor: Colors.black,
                          appBar: AppBar(
                            backgroundColor: Colors.black,
                            iconTheme: const IconThemeData(color: Colors.white),
                          ),
                          body: Center(
                            child: InteractiveViewer(
                              child: Image.network(
                                facePhotoUrl!,
                                fit: BoxFit.contain,
                                errorBuilder: (_, __, ___) =>
                                    const Icon(Icons.broken_image, color: Colors.white, size: 64),
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                  child: ClipOval(
                    child: Image.network(
                      facePhotoUrl,
                      width: 24,
                      height: 24,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 24,
                        height: 24,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.lightGrey,
                        ),
                        child: const Icon(Icons.person, size: 20, color: AppColors.darkGray),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
              ],
              Expanded(
                child: Text(
                  employee['name'] ?? "presence.detail_title".tr(),
                  style: AppTheme.primaryTextStyle.copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          );
        }),
        centerTitle: false,
        actions: [
          if (checkInTime != null)
            Padding(
              padding: const EdgeInsets.only(right: 16.0),
              child: Center(
                child: StreamBuilder(
                  stream: Stream.periodic(const Duration(seconds: 1), (i) => i),
                  builder: (context, snapshot) {
                    final endTime = checkOutTime ?? DateTime.now();
                    var diff = endTime.difference(checkInTime);
                    if (diff.isNegative) diff = Duration.zero;

                    final h = diff.inHours.toString().padLeft(2, '0');
                    final m = diff.inMinutes.remainder(60).toString().padLeft(2, '0');
                    final s = diff.inSeconds.remainder(60).toString().padLeft(2, '0');
                    final durationText = "$h:$m:$s";

                    return Text(
                      durationText,
                      style: AppTheme.primaryTextStyle.copyWith(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.black,
                      ),
                    );
                  },
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // --- KONTEN DAFTAR LOKASI (PULANG, HISTORY, MASUK) ---
          Expanded(
            child: ListView(
              padding: const EdgeInsets.only(left: 10, right: 10, bottom: 24, top: 10),
              physics: const BouncingScrollPhysics(),
              children: [

                // 1. CARD PULANG (Berada di ATAS sendiri)
                if (checkOutTime != null)
                  _buildUnifiedCard(
                    address: checkOutAddress ?? "presence.no_checkout_location".tr(),
                    time: checkOutTime,
                    iconAsset: Assets.icons.icClockOut, // Ikon khusus Check Out
                    cardColor: AppColors.featurePurple,
                    textColor: Colors.white,
                    iconColor: Colors.white,
                    timeColor: Colors.white.withOpacity(0.8),
                    lat: checkOutLat,
                    lng: checkOutLng,
                  ),

                // LOADING STATE UNTUK HISTORY
                if (isLoadingHistory.value)
                  const Padding(
                    padding: EdgeInsets.all(24.0),
                    child: Center(child: CircularProgressIndicator()),
                  ),

                // KONDISI KOSONG (Hanya jika tidak ada absen & tidak ada lokasi sama sekali)
                if (!isLoadingHistory.value && historyLocations.value.isEmpty && checkInTime == null && checkOutTime == null)
                  Padding(
                    padding: const EdgeInsets.only(top: 60.0),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.share_location_outlined, size: 48, color: AppColors.lightGrey),
                          const SizedBox(height: 16),
                          Text("presence.no_location_shared".tr(), style: AppTheme.secondaryTextStyle.copyWith(color: Colors.grey)),
                        ],
                      ),
                    ),
                  ),

                // 2. DAFTAR HISTORY LOKASI (Berada di TENGAH)
                if (!isLoadingHistory.value)
                  ...historyLocations.value.map((loc) {
                    return _buildUnifiedCard(
                      address: loc.address,
                      time: loc.createdAt.toLocal(),
                      iconAsset: Assets.icons.icPresence, // Ikon lokasi standard
                      cardColor: Colors.white,
                      textColor: AppColors.darkGray,
                      iconColor: Colors.black,
                      timeColor: AppColors.darkGray.withOpacity(0.6),
                      lat: loc.latitude,
                      lng: loc.longitude,
                    );
                  }),

                // 3. CARD MASUK (Berada di BAWAH sendiri)
                if (checkInTime != null)
                  _buildUnifiedCard(
                    address: checkInAddress ?? "presence.no_checkin_location".tr(),
                    time: checkInTime,
                    iconAsset: Assets.icons.icClockIn, // Ikon khusus Check In
                    cardColor: AppColors.featurePurple,
                    textColor: Colors.white,
                    iconColor: Colors.white,
                    timeColor: Colors.white.withOpacity(0.8),
                    lat: checkInLat,
                    lng: checkInLng,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}