part of '../views/profile.dart';

class DeleteAccountView extends HookConsumerWidget {
  const DeleteAccountView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final emailController = useTextEditingController();
    final reasonController = useTextEditingController();

    // Memastikan UI merender ulang setiap ada ketikan di kolom email atau alasan
    useListenable(emailController);
    useListenable(reasonController);

    final isLoading = useState(false);
    final myEmail = useState('');

    useEffect(() {
      Future.microtask(() async {
        final email = await ref.read(appPreferenceProvider).read<String>(AppPreferenceKey.email);
        myEmail.value = email ?? '';
      });
      return null;
    }, []);

    // Validasi Aktif/Tidaknya Tombol:
    // Email harus sama persis (mengabaikan spasi dan huruf besar/kecil) DAN kolom alasan tidak boleh kosong
    final isReadyToSubmit = emailController.text.trim().toLowerCase() == myEmail.value.trim().toLowerCase() &&
        reasonController.text.trim().isNotEmpty;

    Future<void> handleDelete() async {
      if (!isReadyToSubmit) return;

      isLoading.value = true;
      try {
        final result = await ref.read(profileStateNotifierProvider.notifier).deleteAccount();

        result.fold(
              (failure) {
            AppToast.showToast(msg: failure.message ?? "Terjadi kesalahan");
          },
              (success) {
            AppToast.showToast(msg: "Akun berhasil dihapus");
            if (context.mounted) {
              // Navigasi ke Halaman Sukses (Tampilan mirip UpdateView)
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (context) => const DeleteAccountSuccessView()),
              );
            }
          },
        );
      } catch (e) {
        AppToast.showToast(msg: "Gagal menghapus akun: $e");
      } finally {
        isLoading.value = false;
      }
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          "Hapus Akun",
          style: AppTheme.primaryTextStyle.copyWith(
            fontWeight: FontWeight.bold,
            fontSize: 18,
            color: Colors.black,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => context.pop(),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: Center(
              child: isLoading.value
                  ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.red,
                ),
              )
                  : InkWell(
                onTap: isReadyToSubmit ? handleDelete : null,
                borderRadius: BorderRadius.circular(20),
                child: Opacity(
                  opacity: isReadyToSubmit ? 1.0 : 0.3,
                  child: SvgPicture.asset(
                    Assets.icons.icDeleteSvg,
                    width: 24,
                    height: 24,
                    colorFilter: const ColorFilter.mode(AppColors.red, BlendMode.srcIn),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        // Padding sedikit diperlebar agar rapi
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // --- INPUT EMAIL ---
            TextFormField(
              controller: emailController,
              textInputAction: TextInputAction.next,
              style: GoogleFonts.dmSans(
                fontSize: 14,
                fontWeight: FontWeight.w600, // Size 14, Weight 600
                color: Colors.black,
              ),
              decoration: InputDecoration(
                prefixIcon: const Icon(
                  Icons.email_outlined,
                  color: Colors.black, // DIUBAH MENJADI HITAM
                  size: 20,
                ),
                hintText: "Ketik alamat email anda",
                hintStyle: GoogleFonts.dmSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w600, // Size 14, Weight 600
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
              maxLines: 4, // Ruang lebih tinggi agar nyaman mengetik
              textInputAction: TextInputAction.done,
              style: GoogleFonts.dmSans(
                fontSize: 14,
                fontWeight: FontWeight.w600, // Size 14, Weight 600
                color: Colors.black,
              ),
              decoration: InputDecoration(
                hintText: "Beritahu kami alasan anda",
                hintStyle: GoogleFonts.dmSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w600, // Size 14, Weight 600
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
          ],
        ),
      ),
    );
  }
}


// --- NEW VIEW: HALAMAN SUKSES HAPUS AKUN ---
class DeleteAccountSuccessView extends HookConsumerWidget {
  const DeleteAccountSuccessView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PopScope(
      canPop: false, // Mencegah user melakukan back ke halaman form hapus akun
      child: Scaffold(
        // MENGUBAH BACKGROUND MENJADI WARNA UNGU FEATURE PURPLE
        backgroundColor: AppColors.featurePurple,
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(height: MediaQuery.of(context).size.height * 0.1),
            // Menghilangkan colorFilter agar ikon aplikasi kembali ke warna aslinya
            SvgPicture.asset(
              Assets.icons.icHoraLogoSvg,
              width: 44,
              height: 44,
            ),

            // MEMBUNGKUS GAMBAR DAN TEKS DALAM SATU CONTAINER/COLUMN AGAR MENEMPEL
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center, // Pusatkan konten grup ini di tengah layar
                children: [
                  // MEMPERBESAR GAMBAR: Mengubah height dari 220 menjadi 300
                  Image.asset(
                    "assets/images/img_delete_account.png",
                    height: 300,
                    fit: BoxFit.contain,
                  ),

                  // Jarak statis dan terukur antara gambar dengan judul
                  const SizedBox(height: 24),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text(
                      'Terimakasih untuk kepercayaan anda',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.dmSans(
                        fontSize: 16,
                        fontWeight: FontWeight.w600, // DIUBAH MENJADI 600
                        color: Colors.white,
                      ),
                    ),
                  ),

                  // Jarak statis antara judul dan deskripsi
                  const SizedBox(height: 8),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text(
                      'Akun berhasil dihapus',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.dmSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w500, // DIPASTIKAN 500
                        color: Colors.white.withOpacity(0.8),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            SafeArea(
              top: false,
              // Memberikan jarak dari tombol ke bawah layar
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // --- TOMBOL DAFTAR AKUN BARU ---
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
                        backgroundColor: const Color(0xFFF79824), // WARNA ORANYE #F79824
                        foregroundColor: Colors.white,
                        minimumSize: Size(MediaQuery.of(context).size.width, 40),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: Text(
                        "Daftar Akun Baru",
                        style: GoogleFonts.dmSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),

                    const SizedBox(height: 10),

                    // --- TOMBOL KELUAR APLIKASI ---
                    TextButton(
                      onPressed: () {
                        // Akan keluar / menutup aplikasi sepenuhnya
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