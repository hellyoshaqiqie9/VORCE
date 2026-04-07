part of 'profile.dart';

class ProfileSettingsView extends HookConsumerWidget {
  const ProfileSettingsView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Access State (Provider dari presence.dart dapat diakses secara global atau via import)
    final isPrayerReminderEnabled = ref.watch(showShiftFilterProvider);
    final selectedTimezone = ref.watch(settingsTimezoneProvider);

    // State untuk Pengenalan Wajah
    final faceStatus = useState("Belum Terdaftar");
    final faceImages = useState<List<String>>([]);

    // FIX: Gunakan context.locale.languageCode sebagai source of truth agar sinkron
    final currentLanguage = context.locale.languageCode;

    // --- LOGIC: MEMUAT PENGATURAN LOKAL, CACHE & DATA FIRESTORE REALTIME ---
    useEffect(() {
      StreamSubscription<QuerySnapshot>? faceDataSubscription;

      Future.microtask(() async {
        try {
          // 1. Muat status pengingat salat dari SharedPreferences
          final prefs = await SharedPreferences.getInstance();
          final savedReminder = prefs.getBool('prayer_reminder_setting');
          if (savedReminder != null) {
            ref.read(showShiftFilterProvider.notifier).state = savedReminder;
          }

          // 2. Muat CACHE LOKAL untuk Pengenalan Wajah agar langsung muncul tanpa loading
          final cachedFaceStatus = prefs.getString('cached_face_status');
          final cachedFaceImages = prefs.getStringList('cached_face_images');
          if (cachedFaceStatus != null && cachedFaceImages != null) {
            faceStatus.value = cachedFaceStatus;
            faceImages.value = cachedFaceImages;
          }

          // 3. Ambil data Face Recognition langsung dari Firestore (Realtime Background Update)
          final appPreference = ref.read(appPreferenceProvider);
          final companyId = await appPreference.read<String>(AppPreferenceKey.idperusahaan) ?? '';
          final userEmail = await appPreference.read<String>(AppPreferenceKey.email) ?? '';

          if (companyId.isNotEmpty && userEmail.isNotEmpty) {
            final colPath = 'companies/$companyId/faceid';

            faceDataSubscription = FirebaseFirestore.instance
                .collection(colPath)
                .snapshots()
                .listen((snapshot) {

              if (snapshot.docs.isNotEmpty) {
                bool isFaceFound = false;
                List<String> urls = [];

                for (var doc in snapshot.docs) {
                  final data = doc.data();

                  final dbEmail = data['userEmail']?.toString() ?? data['email']?.toString() ?? data['Email']?.toString() ?? '';
                  final dbStatus = data['status']?.toString().toLowerCase() ?? data['Status']?.toString().toLowerCase() ?? '';

                  if (dbEmail == userEmail) {
                    if (dbStatus == 'active' || dbStatus == 'aktif' || data['status'] == true || dbStatus.isEmpty) {

                      if (data['images'] != null && data['images'] is List) {
                        final imagesArray = data['images'] as List<dynamic>;

                        for (var item in imagesArray) {
                          if (item is Map) {
                            final url = item['fileUrl'];
                            if (url != null && url.toString().isNotEmpty) {
                              urls.add(url.toString());
                            }
                          }
                        }

                        if (urls.isNotEmpty) {
                          isFaceFound = true;
                          break;
                        }
                      }
                    }
                  }
                }

                if (isFaceFound) {
                  faceImages.value = urls;
                  faceStatus.value = "Terdaftar";
                  // Simpan ke Cache Lokal
                  prefs.setStringList('cached_face_images', urls);
                  prefs.setString('cached_face_status', "Terdaftar");
                } else {
                  faceImages.value = [];
                  faceStatus.value = "Belum Terdaftar";
                  // Reset Cache Lokal
                  prefs.setStringList('cached_face_images', []);
                  prefs.setString('cached_face_status', "Belum Terdaftar");
                }
              } else {
                faceImages.value = [];
                faceStatus.value = "Belum Terdaftar";
                // Reset Cache Lokal
                prefs.setStringList('cached_face_images', []);
                prefs.setString('cached_face_status', "Belum Terdaftar");
              }
            });
          }
        } catch (e) {
          // Error handling silent
        }
      });

      return () {
        faceDataSubscription?.cancel();
      };
    }, []);

    // --- HELPER WIDGET UNTUK CUSTOM DROPDOWN ---
    Widget buildCustomDropdown({
      required String value,
      required List<String> items,
      required Function(String?) onChanged,
      required Map<String, String> displayMap,
    }) {
      return Container(
        height: 28, // Made smaller
        padding: const EdgeInsets.symmetric(horizontal: 8), // Reduced padding
        decoration: BoxDecoration(
          color: Colors.white, // When closed
          borderRadius: BorderRadius.circular(8),
        ),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: value,
            icon: SvgPicture.asset(
              Assets.icons.icArrowExpanded,
              width: 14,
              height: 14,
              colorFilter: const ColorFilter.mode(AppColors.darkGray, BlendMode.srcIn),
            ),
            isExpanded: true,
            dropdownColor: AppColors.switchBarBackground, // #EDEDED
            borderRadius: BorderRadius.circular(12),
            focusColor: Colors.transparent, // Menghilangkan highlight dark grey
            style: GoogleFonts.dmSans(
              color: AppColors.darkGray,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
            items: items.asMap().entries.map((entry) {
              int idx = entry.key;
              String itemValue = entry.value;
              bool isLast = idx == items.length - 1;
              bool isSelected = itemValue == value; // Cek yang dipilih

              return DropdownMenuItem<String>(
                value: itemValue,
                child: Container(
                  color: Colors.transparent, // Background now relies on dropdownColor
                  child: Stack(
                    children: [
                      Center(
                        child: Text(
                          displayMap[itemValue] ?? itemValue,
                          style: GoogleFonts.dmSans(
                            color: isSelected ? AppColors.featurePurple : AppColors.darkGray,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      if (!isLast)
                        Positioned(
                          bottom: 0,
                          left: 8,
                          right: 8,
                          child: Container(
                            height: 1,
                            color: AppColors.greyIconUnselected, // #797979
                          ),
                        ),
                    ],
                  ),
                ),
              );
            }).toList(),
            selectedItemBuilder: (BuildContext context) {
              return items.map((String item) {
                return Center(
                  child: Text(
                    displayMap[item] ?? item,
                    style: GoogleFonts.dmSans(
                      color: AppColors.darkGray, // Reverted to darkGray when closed
                      fontSize: 12,
                      fontWeight: FontWeight.w500, // Not bold
                    ),
                  ),
                );
              }).toList();
            },
            onChanged: onChanged,
          ),
        ),
      );
    }

    // --- HELPER UNTUK ROW SETTING MANUAL ---
    Widget _buildSettingRow({
      required Widget icon,
      required String label,
      required Widget child,
      VoidCallback? onTap,
    }) {
      final Widget rowContent = Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.lightGrey, width: 1.0),
        ),
        child: Row(
          children: [
            SizedBox(
                width: 20,
                height: 20,
                child: Center(child: icon)
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: AppTheme.primaryTextStyle.copyWith(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(width: 8),
            child,
          ],
        ),
      );

      if (onTap != null) {
        return GestureDetector(
          onTap: onTap,
          behavior: HitTestBehavior.opaque,
          child: rowContent,
        );
      }

      return rowContent;
    }

    // --- FUNGSI UNTUK MENAMPILKAN SHEET PENGENALAN WAJAH ---
    void _showFaceRecognitionSheet() {
      showModalBottomSheet(
        context: context,
        backgroundColor: Colors.white,
        isScrollControlled: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        builder: (context) {
          return _FaceRecognitionSheetContent(
            faceImages: faceImages.value,
            onAddTapped: () async {
              Navigator.pop(context); // Tutup sheet
              
              // Navigasi ke Kamera Pengenalan Wajah
              final result = await Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const FaceRegistrationCamera()),
              );

              // Jika berhasil mendapatkan vector dari FaceRecognitionService
              if (result != null && result is Map) {
                final vector = result['vector'] as List<double>;
                final imagePath = result['imagePath'] as String;
                
                final appPref = ref.read(appPreferenceProvider);
                final companyId = await appPref.read<String>(AppPreferenceKey.idperusahaan) ?? '';
                final email = await appPref.read<String>(AppPreferenceKey.email) ?? '';

                if (companyId.isNotEmpty && email.isNotEmpty) {
                  if (context.mounted) {
                    AppToast.showToast(msg: "profile.uploading_face".tr(context: context));
                  }

                  try {
                    // 1. Upload foto wajah menggunakan API VORCE (authNotifier)
                    final authNotifier = ref.read(authStateNotifierProvider.notifier);
                    final uploadResult = await authNotifier.uploadFaceImage(File(imagePath));
                    
                    String faceImageUrl = 'https://ui-avatars.com/api/?name=$email&background=7857FF&color=fff';
                    uploadResult.fold(
                      (failure) => debugPrint("Gagal upload gambar wajah: ${failure.message}"),
                      (successData) {
                        if (successData is Map && successData['downloadUrl'] != null) {
                          faceImageUrl = successData['downloadUrl'].toString();
                        }
                      }
                    );

                    if (context.mounted) {
                      AppToast.showToast(msg: "profile.saving_vector".tr(context: context));
                    }

                    // 2. Simpan Data & FileURL ke Firestore
                    final colPath = 'companies/$companyId/faceid';
                    final query = await FirebaseFirestore.instance.collection(colPath).where('userEmail', isEqualTo: email).get();
                    
                    String docId = query.docs.isNotEmpty 
                        ? query.docs.first.id 
                        : FirebaseFirestore.instance.collection(colPath).doc().id;

                    await FirebaseFirestore.instance.collection(colPath).doc(docId).set({
                      'userEmail': email,
                      'status': 'active',
                      'faceVector': vector, // Array float 192 dimensi dari MobileFaceNet
                      'images': [
                        {
                          'fileUrl': faceImageUrl,
                          'createdAt': DateTime.now().toIso8601String()
                        }
                      ],
                    }, SetOptions(merge: true));

                    if (context.mounted) {
                      AppToast.showToast(msg: "profile.face_success".tr(context: context));
                    }
                  } catch (e) {
                    debugPrint("Error saving face vector: $e");
                    if (context.mounted) {
                      AppToast.showToast(msg: "profile.face_failed".tr(context: context));
                    }
                  }
                }
              }
            },
          );
        },
      );
    }

    // --- FUNGSI UNTUK MENAMPILKAN SHEET PENGINGAT SALAT ---
    void _showPrayerReminderSheet() {
      showModalBottomSheet(
        context: context,
        backgroundColor: Colors.transparent, // Background transparent untuk margin
        builder: (context) {
          // PERUBAHAN: Dibungkus dengan SafeArea agar tombol tidak tertutup navigasi OS HP
          return SafeArea(
            // PERUBAHAN: Menyesuaikan margin kiri kanan menjadi 10px untuk kontennya
            child: Container(
              margin: const EdgeInsets.fromLTRB(10, 0, 10, 10), // Margin 10px kiri, kanan, bawah
              padding: const EdgeInsets.only(left: 10.0, right: 10.0, top: 24.0, bottom: 10.0),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Handle bar
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Title
                  Text(
                    "profile.prayer_reminder".tr(context: context),
                    style: AppTheme.primaryTextStyle.copyWith(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Ikon Tengah (PERUBAHAN: Diubah menjadi ukuran 20x20 dan berwarna Hitam)
                  SvgPicture.asset(
                    Assets.icons.icMosque,
                    width: 20,
                    height: 20,
                    colorFilter: const ColorFilter.mode(Colors.black, BlendMode.srcIn),
                  ),
                  const SizedBox(height: 24),

                  // Deskripsi
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14.0),
                    child: Text(
                      "profile.prayer_desc".tr(context: context),
                      textAlign: TextAlign.center,
                      style: GoogleFonts.dmSans(
                        fontSize: 14,
                        color: AppColors.darkGray,
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Tombol Hidupkan (Lebar menyesuaikan dari padding 10px kiri-kanan parent)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        // Matikan loader/sheet dan ubah state menjadi true
                        ref.read(showShiftFilterProvider.notifier).state = true;
                        if (context.mounted) {
                          AppToast.showToast(msg: "presence.prayer_active".tr(context: context)); // Toast Aktif
                        }
                        try {
                          final prefs = await SharedPreferences.getInstance();
                          await prefs.setBool('prayer_reminder_setting', true);
                        } catch (e) {
                          // Error handling silent
                        }
                        if (context.mounted) {
                          Navigator.pop(context); // Tutup Sheet
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.featurePurple,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: Text(
                        "profile.turn_on".tr(context: context),
                        style: GoogleFonts.dmSans(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      );
    }

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Text(
          "presence.settings_title".tr(),
          style: AppTheme.primaryTextStyle.copyWith(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      backgroundColor: Colors.white,
      body: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // --- 0. PENGENALAN WAJAH ---
            _buildSettingRow(
              icon: const Icon(Icons.face_outlined, color: AppColors.darkGray, size: 20),
              label: "profile.face_recognition".tr(context: context),
              onTap: _showFaceRecognitionSheet,
              child: SizedBox(
                height: 30, // Menyamakan tinggi agar card identik ukurannya dengan yang lain
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      faceStatus.value == 'Terdaftar' ? "profile.registered".tr(context: context) : "profile.unregistered".tr(context: context),
                      style: GoogleFonts.dmSans(
                        color: faceStatus.value == 'Terdaftar' ? Colors.black : AppColors.darkGray,
                        fontSize: 12,
                        // PERUBAHAN: fontWeight disamakan menjadi w500 layaknya teks lain
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(
                      Icons.keyboard_arrow_down_rounded,
                      color: AppColors.black,
                      size: 20,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 10),

            // --- 1. SETTING WAKTU ---
            _buildSettingRow(
              icon: const Icon(Icons.schedule_outlined, color: AppColors.darkGray, size: 20),
              label: "presence.timezone".tr(),
              child: SizedBox(
                width: 90, // Made wrapper smaller
                child: buildCustomDropdown(
                  value: selectedTimezone,
                  items: ['UTC+7', 'UTC+8', 'UTC+9'],
                  displayMap: {
                    'UTC+7': 'UTC+7',
                    'UTC+8': 'UTC+8',
                    'UTC+9': 'UTC+9',
                  },
                  onChanged: (String? newValue) {
                    if (newValue != null) {
                      ref.read(settingsTimezoneProvider.notifier).state = newValue;
                    }
                  },
                ),
              ),
            ),

            const SizedBox(height: 10),

            // --- 2. SETTING BAHASA ---
            _buildSettingRow(
              icon: const Icon(Icons.language_outlined, color: AppColors.darkGray, size: 20),
              label: "language".tr(),
              child: SizedBox(
                width: 100, // Made wrapper smaller
                child: buildCustomDropdown(
                  value: currentLanguage,
                  items: ['id', 'en'],
                  displayMap: {
                    'id': 'Bahasa',
                    'en': 'English',
                  },
                  onChanged: (String? newValue) {
                    if (newValue != null) {
                      ref.read(settingsLanguageProvider.notifier).state = newValue;
                      final newLocale = context.supportedLocales.firstWhere(
                            (element) => element.languageCode == newValue,
                        orElse: () => context.locale,
                      );
                      context.setLocale(newLocale);
                    }
                  },
                ),
              ),
            ),

            const SizedBox(height: 10),

            // --- 3. PENGINGAT WAKTU SALAT ---
            _buildSettingRow(
              icon: SvgPicture.asset(
                Assets.icons.icMosque,
                width: 20,
                height: 20,
                colorFilter: const ColorFilter.mode(AppColors.darkGray, BlendMode.srcIn),
              ),
              label: "profile.prayer_reminder".tr(context: context),
              child: SizedBox(
                height: 30,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      isPrayerReminderEnabled ? "presence.on".tr() : "presence.off".tr(),
                      style: AppTheme.primaryTextStyle.copyWith(
                        color: isPrayerReminderEnabled ? AppColors.featurePurple : Colors.grey,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(width: 10),
                    SizedBox(
                      width: 42,
                      child: Transform.scale(
                        scale: 0.7,
                        alignment: Alignment.centerLeft,
                        child: Switch(
                          value: isPrayerReminderEnabled,
                          onChanged: (bool value) async {
                            if (value) {
                              // Jika di ON-kan, maka munculkan sheet konfirmasi
                              _showPrayerReminderSheet();
                            } else {
                              // Jika di OFF-kan, langsung matikan
                              ref.read(showShiftFilterProvider.notifier).state = false;
                              if (context.mounted) {
                                AppToast.showToast(msg: "presence.prayer_inactive".tr(context: context)); // Toast Non-Aktif
                              }
                              try {
                                final prefs = await SharedPreferences.getInstance();
                                await prefs.setBool('prayer_reminder_setting', false);
                              } catch (e) {
                                // Error handling silent
                              }
                            }
                          },
                          thumbColor: WidgetStateProperty.resolveWith<Color>((states) {
                            if (states.contains(WidgetState.selected)) {
                              return Colors.white;
                            }
                            return AppColors.featurePurple;
                          }),
                          trackColor: WidgetStateProperty.resolveWith<Color>((states) {
                            if (states.contains(WidgetState.selected)) {
                              return AppColors.featurePurple;
                            }
                            return const Color(0xFFF0EDFF);
                          }),
                          trackOutlineColor: WidgetStateProperty.all(AppColors.featurePurple),
                          trackOutlineWidth: WidgetStateProperty.all(1.0),
                          overlayColor: WidgetStateProperty.all(Colors.transparent),
                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }
}

// --- KOMPONEN KONTEN UNTUK BOTTOM SHEET PENGENALAN WAJAH ---
class _FaceRecognitionSheetContent extends HookConsumerWidget {
  final List<String> faceImages;
  final VoidCallback onAddTapped;

  const _FaceRecognitionSheetContent({
    required this.faceImages,
    required this.onAddTapped,
  });

  // Fungsi Helper untuk menentukan deskripsi berdasarkan index gambar
  String _getInstructionText(BuildContext context, int index) {
    switch (index) {
      case 0:
        return "profile.face_front".tr(context: context);
      case 1:
        return "profile.face_right".tr(context: context);
      case 2:
        return "profile.face_left".tr(context: context);
      case 3:
        return "profile.face_up".tr(context: context);
      case 4:
        return "profile.face_down".tr(context: context);
      default:
        return "";
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Hooks untuk PageView (Swipe kanan kiri)
    final pageController = usePageController();
    final currentPage = useState(0);

    // Membatasi hanya maksimal 5 gambar yang di-load (index 0 - 4), gambar ke-6 tidak ditampilkan
    final displayImages = faceImages.take(5).toList();

    // PERUBAHAN: Dibungkus dengan SafeArea agar selalu aman dari navigasi bar/home indicator
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.only(top: 24.0, bottom: 10.0), // Removed left and right 10.0
        child: SizedBox(
          width: double.infinity,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            // Title
            Text(
              "profile.face_recognition".tr(context: context),
              style: AppTheme.primaryTextStyle.copyWith(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 40),

            // Logika Tampilan: Belum Terdaftar vs Sudah Terdaftar
            if (displayImages.isEmpty)
            // TAMPILAN BELUM TERDAFTAR (Placeholder Tombol + diperbesar)
              Container(
                width: 250, // Diperbesar dari 200 ke 250
                height: 250, // Diperbesar dari 200 ke 250
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [Color(0xFF7857FF), Color(0xFFF79824)], // #7857FF dan #F79824
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                padding: const EdgeInsets.all(6), // Ketebalan border gradient
                child: Container(
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white, // Inner background
                  ),
                  child: Center(
                    // Tombol Tambah Wajah
                    child: GestureDetector(
                      onTap: onAddTapped,
                      child: Container(
                        width: 56,
                        height: 56,
                        decoration: const BoxDecoration(
                          color: AppColors.featurePurple, // #7857FF
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black12,
                              blurRadius: 8,
                              offset: Offset(0, 4),
                            )
                          ],
                        ),
                        child: const Icon(
                          Icons.add,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                    ),
                  ),
                ),
              )
            else
            // TAMPILAN SUDAH TERDAFTAR (Lingkaran Gradien Ikut Scroll + Titik Indikator Hitam + Deskripsi)
              Column(
                children: [
                  // PageView membungkus Lingkaran secara penuh agar ikut terscroll
                  SizedBox(
                    height: 260, // Tinggi space untuk PageView (Harus lebih besar dari lingkaran)
                    child: PageView.builder(
                      controller: pageController,
                      onPageChanged: (index) => currentPage.value = index,
                      itemCount: displayImages.length,
                      itemBuilder: (context, index) {
                        return Center(
                          child: Container(
                            width: 250, // Ukuran lingkaran diperbesar (Sama dengan placeholder)
                            height: 250,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: [Color(0xFF7857FF), Color(0xFFF79824)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                            ),
                            padding: const EdgeInsets.all(6), // Ketebalan border gradient
                            child: Container(
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white,
                              ),
                              child: ClipOval(
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade200,
                                    image: DecorationImage(
                                      image: CachedNetworkImageProvider(displayImages[index]),
                                      fit: BoxFit.cover,
                                      // Fokus gambar diturunkan secara drastis
                                      // (-0.8 akan menarik bagian atas foto lebih ke bawah agar wajah pas di tengah)
                                      alignment: const Alignment(0, -0.8),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                  const SizedBox(height: 24),



                  // TOMBOL REDO WAJAH
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40),
                    child: AppWidgets.primaryButton(
                      onTap: onAddTapped,
                      text: context.locale.languageCode == 'en' ? "Redo Face Registration" : "Daftar Ulang Wajah",
                      backgroundColor: const Color(0xFFF5F5F5),
                      foregroundColor: AppColors.featurePurple,
                    ),
                  ),
                ],
              ),

            const SizedBox(height: 24),
          ],
        ),
        ),
      ),
    );
  }
}