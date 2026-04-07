part of '../views/staff_invite.dart';

class StaffInviteWidget extends HookConsumerWidget {
  final TextEditingController emailController;
  final VoidCallback? onSubmitEmail;
  final bool isLoading;

  const StaffInviteWidget({
    super.key,
    required this.emailController,
    this.onSubmitEmail,
    this.isLoading = false,
  });

  // --- HELPER UNTUK TRUNCATE LINK ---
  String _truncateLink(String link) {
    if (link.length <= 25) return link;
    // Ambil 16 karakter awal (https://link_s...)
    return "${link.substring(0, 16)}...";
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // --- LOGIC LINK UNDANGAN ---
    final publicLinkState = ref.watch(publicInviteLinkStateNotifierProvider);
    final linkNotifier = ref.read(publicInviteLinkStateNotifierProvider.notifier);

    useEffect(() {
      Future.microtask(() {
        AppStateX(publicLinkState).maybeWhen(
          orElse: () => linkNotifier.getPublicInviteLink(),
          success: (_) {},
        );
      });
      return null;
    }, const []);

    String invitationLink = 'Memuat link...';
    bool isLinkLoading = false;
    bool isLinkFailed = false;

    AppStateX(publicLinkState).maybeWhen(
      loading: () {
        isLinkLoading = true;
      },
      success: (data) {
        invitationLink = data.toString();
        isLinkLoading = false;
      },
      failed: (exception) {
        invitationLink = 'Gagal memuat link';
        isLinkLoading = false;
        isLinkFailed = true;
      },
      orElse: () {
        isLinkLoading = true;
      },
    );

    void showLinkCopiedToast() {
      AppToast.showToast(msg: "Link tersalin");
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 10.0, vertical: 10.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // --- BAGIAN 1: CARD LINK ---
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.lightGrey,
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                )
              ],
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const Icon(
                  Icons.link,
                  color: AppColors.black,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (isLinkLoading)
                        const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      else ...[
                        Text(
                          _truncateLink(invitationLink),
                          style: GoogleFonts.dmSans(
                            textStyle: AppTheme.primaryTextStyle.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (isLinkFailed)
                          Text(
                            "Coba lagi",
                            style: GoogleFonts.dmSans(
                              textStyle: AppTheme.secondaryTextStyle.copyWith(
                                fontSize: 10,
                                color: AppColors.red,
                              ),
                            ),
                          ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () async {
                    if (isLinkFailed) {
                      linkNotifier.getPublicInviteLink();
                    } else if (!isLinkLoading && invitationLink.contains('http')) {
                      await Clipboard.setData(ClipboardData(text: invitationLink));
                      if (context.mounted) showLinkCopiedToast();
                    }
                  },
                  child: Text(
                    isLinkFailed ? "Retry" : "Salin",
                    style: GoogleFonts.dmSans(
                      fontWeight: FontWeight.w600,
                      color: AppColors.featurePurple,
                      fontSize: 14,
                    ),
                  ),
                )
              ],
            ),
          ),

          const SizedBox(height: 10),

          // --- BAGIAN 2: INPUT EMAIL ---
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.lightGrey,
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                )
              ],
            ),
            child: Row(
              children: [
                const Padding(
                  padding: EdgeInsets.only(left: 4, right: 12),
                  child: Icon(
                    Icons.email_outlined,
                    color: AppColors.darkGray,
                    size: 24,
                  ),
                ),
                Expanded(
                  child: TextField(
                    controller: emailController,
                    keyboardType: TextInputType.emailAddress,
                    onSubmitted: (_) {
                      if (onSubmitEmail != null) onSubmitEmail!();
                    },
                    decoration: InputDecoration(
                      hintText: "Masukkan alamat email...",
                      hintStyle: GoogleFonts.dmSans(
                        textStyle: AppTheme.primaryTextStyle.copyWith(
                          color: AppColors.darkGray.withOpacity(0.3),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      errorBorder: InputBorder.none,
                      disabledBorder: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 16),
                      isDense: true,
                    ),
                    style: GoogleFonts.dmSans(
                      textStyle: AppTheme.primaryTextStyle.copyWith(
                          fontWeight: FontWeight.w600
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 10),

          // --- BAGIAN 3: TOMBOL KIRIM ---
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: onSubmitEmail,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.featurePurple,
                disabledBackgroundColor: AppColors.featurePurple.withOpacity(0.25), // Background warna FeaturePurple Opacity 25% saat nonaktif
                disabledForegroundColor: Colors.white, // Menjaga teks tetap putih saat disable
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                elevation: (onSubmitEmail != null) ? 2 : 0,
              ),
              child: isLoading
                  ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
              )
                  : Text(
                "Kirim email", // PERUBAHAN: Mengubah Teks Sesuai Instruksi
                style: GoogleFonts.dmSans(
                  textStyle: AppTheme.primaryTextStyle.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14, // PERUBAHAN: Menyesuaikan Ukuran Font Menjadi 14px
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