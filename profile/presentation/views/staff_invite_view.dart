part of 'staff_invite.dart';

// Widget utama yang mengatur AppBar dan State Halaman
class StaffInviteView extends HookConsumerWidget {
  const StaffInviteView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final emailController = useTextEditingController();
    final isEmailValid = useState(false);

    // Notifier untuk Kirim Email
    final invitationNotifier = ref.read(staffInvitationStateNotifierProvider.notifier);

    // Fungsi Validasi Email Realtime
    void validateEmail(String email) {
      final bool isValid = RegExp(r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+").hasMatch(email);
      isEmailValid.value = isValid;
    }

    // Listen perubahan teks untuk validasi
    useEffect(() {
      emailController.addListener(() {
        validateEmail(emailController.text.trim());
      });
      return null;
    }, [emailController]);

    // Fungsi submit email
    Future<void> _submitEmail() async {
      final email = emailController.text.trim();
      // Validasi ganda untuk keamanan
      if (email.isEmpty || !isEmailValid.value) return;

      AppDialog.showLoading(context);

      await invitationNotifier.sendInviteByEmail(email).then((result) {
        result.fold(
              (error) {
            AppDialog.closeLoading(context);
            AppToast.showToast(msg: (error.message ?? "Gagal mengirim undangan"));
          },
              (successMessage) {
            AppDialog.closeLoading(context);
            AppToast.showToast(msg: successMessage);
            emailController.clear();
            isEmailValid.value = false; // Reset validasi state
          },
        );
      });
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        // UPDATE: Kurangi jarak ikon back dengan title
        titleSpacing: 0,
        title: Text(
          "Tambah Karyawan",
          style: AppTheme.primaryTextStyle.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.black,
            fontSize: 16,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => context.pop(),
        ),
      ),
      // Memanggil StaffInviteWidget yang sudah diperbarui
      body: StaffInviteWidget(
        emailController: emailController,
        // Kirim null jika email tidak valid (tombol akan disabled)
        onSubmitEmail: isEmailValid.value ? _submitEmail : null,
      ),
    );
  }
}