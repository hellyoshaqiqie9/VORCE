part of '../views/profile.dart';

class DeleteCompanyView extends HookConsumerWidget {
  const DeleteCompanyView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final emailController = useTextEditingController();
    final reasonController = useTextEditingController();

    // State untuk mengontrol apakah tampilan pindah ke Success View
    final isSuccess = useState(false);

    // Memastikan UI merender ulang setiap ada ketikan di kolom email atau alasan
    useListenable(emailController);
    useListenable(reasonController);

    final isLoading = useState(false);
    final adminEmail = useState('');
    final companyName = useState('');

    useEffect(() {
      Future.microtask(() async {
        final pref = ref.read(appPreferenceProvider);
        // Ambil email admin
        final email = await pref.read<String>(AppPreferenceKey.email);
        adminEmail.value = email ?? '';

        // Ambil nama perusahaan dari CACHE lokal (AppPreference), bukan dari API internet.
        final cName = await pref.read<String>(AppPreferenceKey.namaPerusahaan);
        companyName.value = cName ?? 'Perusahaan';
      });
      return null;
    }, []);

    // Validasi Aktif/Tidaknya Tombol:
    // Email yang diinput harus sama persis dengan email admin agar sah dan alasan tidak boleh kosong.
    final isReadyToSubmit = emailController.text.trim().toLowerCase() == adminEmail.value.trim().toLowerCase() &&
        reasonController.text.trim().isNotEmpty;

    Future<void> handleDelete() async {
      if (!isReadyToSubmit) return;

      isLoading.value = true;
      try {
        final result = await ref.read(profileStateNotifierProvider.notifier).deleteCompany(
          email: emailController.text.trim(),
          reason: reasonController.text.trim(),
        );

        result.fold(
              (failure) {
            AppToast.showToast(msg: failure.message ?? "Terjadi kesalahan");
          },
              (success) {
            AppToast.showToast(msg: "Perusahaan berhasil dihapus");
            if (context.mounted) {
              // PERBAIKAN: Mengubah state UI untuk langsung menampilkan halaman sukses
              // tanpa memicu error clash GoRouter vs Navigator imperative API.
              isSuccess.value = true;
            }
          },
        );
      } catch (e) {
        AppToast.showToast(msg: "Gagal menghapus perusahaan: $e");
      } finally {
        isLoading.value = false;
      }
    }

    // Jika berhasil, render Widget SuccessView secara instan menggantikan Scaffold Form
    if (isSuccess.value) {
      return const DeleteCompanySuccessView();
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        shadowColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        shape: const Border(bottom: BorderSide.none), // Menghilangkan garis bawah pada Appbar
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
              sliver: SliverList(
                delegate: SliverChildListDelegate([

                  // --- TITLE TENGAH (Nama Perusahaan) ---
                  SizedBox(
                    width: double.infinity,
                    child: Text(
                      "Hai, ${companyName.value}!",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.dmSans(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.featurePurple, // Menggunakan warna featurePurple sesuai permintaan
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // --- DESKRIPSI ---
                  SizedBox(
                    width: double.infinity,
                    child: Text(
                      "Lengkapi untuk menghapus akun",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.dmSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF797979),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // --- INPUT EMAIL ---
                  TextFormField(
                    controller: emailController,
                    textInputAction: TextInputAction.next,
                    style: GoogleFonts.dmSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                    ),
                    decoration: InputDecoration(
                      prefixIcon: const Icon(
                        Icons.email_outlined,
                        color: Colors.black,
                        size: 20,
                      ),
                      hintText: "Masukkan email terdaftar", // Hint text baru
                      hintStyle: GoogleFonts.dmSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade400,
                      ),
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.lightGrey, width: 1),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // --- INPUT ALASAN ---
                  TextFormField(
                    controller: reasonController,
                    maxLines: 4, // Ruang lebih tinggi
                    textInputAction: TextInputAction.done,
                    style: GoogleFonts.dmSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                    ),
                    decoration: InputDecoration(
                      hintText: "Ketikkan alasan anda disini", // Hint text baru
                      hintStyle: GoogleFonts.dmSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade400,
                      ),
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.lightGrey, width: 1),
                      ),
                    ),
                  ),
                ]),
              ),
            ),

            // ======================= BAGIAN BAWAH (TOMBOL HAPUS) =======================
            SliverFillRemaining(
              hasScrollBody: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 10, 10, 24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    ElevatedButton(
                      onPressed: isReadyToSubmit ? handleDelete : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.red, // Tombol Warna Merah
                        disabledBackgroundColor: Colors.grey.withOpacity(0.3),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Center(
                        child: isLoading.value
                            ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                            : Text(
                          "Hapus sekarang",
                          style: GoogleFonts.dmSans(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: isReadyToSubmit ? Colors.white : Colors.grey.shade600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


// --- VIEW: HALAMAN SUKSES HAPUS PERUSAHAAN ---
class DeleteCompanySuccessView extends HookConsumerWidget {
  const DeleteCompanySuccessView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PopScope(
      canPop: false, // Mencegah user kembali ke form
      child: Scaffold(
        backgroundColor: AppColors.featurePurple,
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(height: MediaQuery.of(context).size.height * 0.1),
            SvgPicture.asset(
              Assets.icons.icHoraLogoSvg,
              width: 44,
              height: 44,
            ),

            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(
                    "assets/images/img_delete_account.png",
                    height: 300,
                    fit: BoxFit.contain,
                  ),

                  const SizedBox(height: 24),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text(
                      'Terimakasih untuk kepercayaan anda',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.dmSans(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),

                  const SizedBox(height: 8),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text(
                      'Perusahaan berhasil dihapus',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.dmSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Colors.white.withOpacity(0.8),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ElevatedButton(
                      onPressed: () async {
                        AppDialog.showLoading(context);
                        try {
                          await ref.read(profileStateNotifierProvider.notifier).signOut().timeout(const Duration(seconds: 10));
                        } catch (e) {
                          debugPrint("Logout error: $e");
                        } finally {
                          if (context.mounted) {
                            AppDialog.closeLoading(context);
                            context.goNamed(Routes.onboarding);
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF79824),
                        foregroundColor: Colors.white,
                        minimumSize: Size(MediaQuery.of(context).size.width, 40),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: Text(
                        "Daftar Perusahaan Baru",
                        style: GoogleFonts.dmSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),

                    const SizedBox(height: 10),

                    TextButton(
                      onPressed: () {
                        SystemNavigator.pop();
                      },
                      child: Text(
                        "Keluar",
                        style: GoogleFonts.dmSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                          decoration: TextDecoration.underline,
                          decorationColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}