part of 'profile.dart';

// --- VIEW UNTUK USER PROFILE (DARI NAVBAR) ---
class ProfileView extends HookConsumerWidget {
  const ProfileView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    void popPage() {
      context.pop();
    }

    void singOut() async {
      final appPreference = ref.read(appPreferenceProvider);
      final currentAbsenceId = await appPreference.read<String>(AppPreferenceKey.currentAbsenceId);

      if (currentAbsenceId != null && currentAbsenceId.isNotEmpty) {
        AppToast.showToast(msg: "checkout_first_required".tr(context: context));
        return;
      }

      if (!context.mounted) return;

      // MENGGUNAKAN LAYOUT MANUAL AGAR BISA CUSTOM WARNA TOMBOL
      AppBottomSheet.show(
        context,
        child: SafeArea(
          bottom: true,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Title - Menggunakan DM Sans
                Text(
                  "logout_title".tr(context: context),
                  textAlign: TextAlign.center,
                  style: GoogleFonts.dmSans(
                    textStyle: AppTheme.primaryTextStyle.copyWith(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                40.margin,

                SvgPicture.asset(
                  Assets.icons.icDeleteSvg,
                  width: 16,
                  height: 18,
                ),
                10.margin,

                // Content - Menggunakan DM Sans
                Text(
                  "logout_confirm".tr(context: context),
                  textAlign: TextAlign.center,
                  style: GoogleFonts.dmSans(
                    textStyle: AppTheme.primaryTextStyle,
                  ),
                ),
                32.margin,

                // Tombol Logout Merah
                ElevatedButton(
                  onPressed: () async {
                    // 1. Simpan router sebelum operasi async berjalan
                    final router = GoRouter.of(context);

                    // 2. Tutup dialog konfirmasi bawah (BottomSheet)
                    Navigator.pop(context);

                    // 3. Tampilkan Loading
                    AppDialog.showLoading(context);

                    try {
                      // 4. PROSES LOGOUT API & GOOGLE (Termasuk hapus sesi lokal)
                      // Diberi waktu maksimal 3 detik agar Google Sign-In sempat terputus (Disconnect)
                      // sehingga list akun Google akan muncul kembali saat login berikutnya.
                      // Tidak menggunakan catchError agar tidak terjadi crash Invalid Argument.
                      await ref.read(profileStateNotifierProvider.notifier)
                          .signOut()
                          .timeout(const Duration(seconds: 10));

                    } catch (e) {
                      // Error timeout atau jaringan buruk diabaikan agar tidak mengganggu proses pindah halaman
                      debugPrint("Signout info/timeout: $e");
                    } finally {
                      // 6. PASTIKAN LOADING DITUTUP DAN PINDAH HALAMAN
                      AppDialog.closeLoading(context);
                      router.goNamed(Routes.onboarding);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.red, // Warna Merah
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text(
                    "logout_yes".tr(context: context),
                    style: GoogleFonts.dmSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                1.margin,
              ],
            ),
          ),
        ),
      );
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          popPage();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          toolbarHeight: 56.0,
          elevation: 0,
          shadowColor: Colors.transparent,
          scrolledUnderElevation: 0,
          surfaceTintColor: Colors.transparent,
          bottomOpacity: 0,
          shape: const Border(bottom: BorderSide(color: Colors.transparent)),
          // --- TOMBOL SETTINGS DIAKTIFKAN MENGGANTIKAN SHARE ---
          leading: IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppColors.darkGray),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ProfileSettingsView()),
              );
            },
          ),
          actions: [
            IconButton(
              onPressed: () => singOut(),
              icon: const Icon(
                Icons.logout_outlined,
                color: AppColors.red, // Ikon Logout Merah
              ),
            ),
          ],
        ),
        // MENAMPILKAN KONTEN USER
        body: const Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: _UserContent(),
        ),
      ),
    );
  }
}

// --- VIEW BARU UNTUK COMPANY PROFILE (DARI HOME HEADER) ---
class CompanyProfileView extends HookConsumerWidget {
  const CompanyProfileView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // --- AMAN DARI CRASH & MENGGUNAKAN REALTIME FIRESTORE LANGSUNG ---
    final companyName = useState<String>("profile.loading".tr(context: context));

    useEffect(() {
      StreamSubscription<DocumentSnapshot>? subscription;

      Future<void> init() async {
        if (!context.mounted) return;
        final pref = ref.read(appPreferenceProvider);

        // Ambil HANYA id perusahaan
        final idPerusahaan = await pref.read<String>(AppPreferenceKey.idperusahaan);

        // Langsung Buka Stream Realtime ke path Firestore
        if (idPerusahaan != null && idPerusahaan.isNotEmpty) {
          subscription = FirebaseFirestore.instance
              .collection('companies')
              .doc(idPerusahaan)
              .snapshots()
              .listen((snapshot) {
            if (snapshot.exists && snapshot.data() != null) {
              final data = snapshot.data() as Map<String, dynamic>;
              final realtimeName = data['namaPerusahaan'];

              if (realtimeName != null && realtimeName.toString().isNotEmpty) {
                companyName.value = realtimeName.toString();
              } else {
                companyName.value = "profile.company_profile".tr(context: context);
              }
            } else {
              companyName.value = "profile.company_profile".tr(context: context);
            }
          }, onError: (error) {
            debugPrint("CompanyProfileView Firestore Stream Error: $error");
            companyName.value = "profile.company_profile".tr(context: context);
          });
        } else {
          companyName.value = "profile.company_profile".tr(context: context);
        }
      }

      init();

      return () {
        subscription?.cancel();
      };
    }, []);

    // --- ADDED: Logic Singout untuk Company Profile ---
    void singOut() async {
      final appPreference = ref.read(appPreferenceProvider);
      final currentAbsenceId = await appPreference.read<String>(AppPreferenceKey.currentAbsenceId);

      if (currentAbsenceId != null && currentAbsenceId.isNotEmpty) {
        AppToast.showToast(msg: "checkout_first_required".tr(context: context));
        return;
      }

      if (!context.mounted) return;

      AppBottomSheet.show(
        context,
        child: SafeArea(
          bottom: true,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  "logout_title".tr(context: context),
                  textAlign: TextAlign.center,
                  style: GoogleFonts.dmSans(
                    textStyle: AppTheme.primaryTextStyle.copyWith(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                40.margin,

                SvgPicture.asset(
                  Assets.icons.icDeleteSvg,
                  width: 16,
                  height: 18,
                ),
                10.margin,
                Text(
                  "logout_confirm".tr(context: context),
                  textAlign: TextAlign.center,
                  style: GoogleFonts.dmSans(
                    textStyle: AppTheme.primaryTextStyle,
                  ),
                ),
                32.margin,
                ElevatedButton(
                  onPressed: () async {
                    // 1. Simpan fungsi router sebelum operasi async
                    final router = GoRouter.of(context);

                    // 2. Tutup BottomSheet
                    Navigator.pop(context);

                    // 3. Tampilkan Loading
                    AppDialog.showLoading(context);

                    try {
                      // 4. Proses SignOut API dan Google di background dengan batas maksimal 3 detik
                      // yang juga akan menghapus token sesi lokal.
                      await ref.read(profileStateNotifierProvider.notifier)
                          .signOut()
                          .timeout(const Duration(seconds: 10));

                    } catch (e) {
                      debugPrint("Signout info/timeout: $e");
                    } finally {
                      // 6. Loading ditutup & Navigasi dengan aman
                      AppDialog.closeLoading(context);
                      router.goNamed(Routes.onboarding);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.red,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text(
                    "logout_yes".tr(context: context),
                    style: GoogleFonts.dmSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                1.margin,
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          companyName.value,
          style: GoogleFonts.dmSans(
            color: AppColors.darkGray,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        scrolledUnderElevation: 0,
        shape: const Border(bottom: BorderSide(color: Colors.transparent)),
        iconTheme: const IconThemeData(color: AppColors.darkGray),
        actions: [
          IconButton(
            onPressed: () => singOut(),
            icon: const Icon(
              Icons.logout_outlined,
              color: AppColors.red,
            ),
          ),
        ],
      ),
      body: const Padding(
        padding: EdgeInsets.symmetric(horizontal: 10),
        child: _CompanyContent(),
      ),
    );
  }
}