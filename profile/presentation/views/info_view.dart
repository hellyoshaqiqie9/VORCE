part of 'info.dart';

class InfoView extends HookConsumerWidget {
  const InfoView({
    super.key,
    required this.company,
  });

  final Company company;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoading = useState(true);
    final isLoadingEdit = useState(false);
    final isUserAdmin = useState(false);

    final isEditName = useState(false);
    final isEditAddress = useState(false);
    final isEditPhone = useState(false);
    final isEditWhatsapp = useState(false);

    final emailTextController = useTextEditingController();
    final editNameTextController = useTextEditingController();
    final editAddressTextController = useTextEditingController();
    final editPhoneTextController = useTextEditingController();
    final editWhatsappTextController = useTextEditingController();

    final editCompanyNotifier = ref.read(editCompanyStateNotifierProvider.notifier);

    // Helper sederhana untuk menangani null atau kosong secara aman
    String safeString(dynamic value) {
      if (value == null || value.toString() == 'null') return '';
      return value.toString();
    }

    // Fungsi untuk menyalin teks ke clipboard secara otomatis
    void copyToClipboard(String text, String label) {
      if (text.isNotEmpty) {
        Clipboard.setData(ClipboardData(text: text));
        AppToast.showToast(msg: "info.copied_success".tr(context: context, args: [label]));
      } else {
        AppToast.showToast(msg: "info.empty_text".tr(context: context, args: [label]));
      }
    }

    // Widget Custom Khusus Karyawan (Agar bisa di-klik & di-underline tanpa memicu error di AppWidgets.textField)
    Widget buildCopyableField({
      required String label,
      required String hint,
      required TextEditingController controller,
      required Widget prefixIcon,
      required VoidCallback onTap,
    }) {
      final underlineTextStyle = GoogleFonts.dmSans(
        textStyle: AppTheme.primaryTextStyle.copyWith(
          color: AppColors.greyIconUnselected, // Sesuai permintaan (Bukan biru)
          decoration: TextDecoration.underline,
          decorationColor: AppColors.greyIconUnselected,
          fontWeight: FontWeight.w500,
        ),
      );

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.dmSans(
              textStyle: AppTheme.primaryTextStyle.copyWith(
                fontSize: 12,
                color: AppColors.darkGray,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: onTap,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.lightGrey, width: 1),
                borderRadius: BorderRadius.circular(8),
                color: AppColors.white,
              ),
              child: Row(
                children: [
                  prefixIcon,
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      controller.text.isEmpty ? hint : controller.text,
                      style: controller.text.isEmpty
                          ? GoogleFonts.dmSans(
                        textStyle: AppTheme.primaryTextStyle.copyWith(
                          color: AppColors.greyIconUnselected,
                        ),
                      )
                          : underlineTextStyle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }

    // Menggunakan useEffect agar dapat memulai dan mematikan listener Firestore dengan aman
    useEffect(() {
      StreamSubscription<DocumentSnapshot>? subscription;

      Future<void> init() async {
        // 1. Set fallback data awal dari object company yang dilempar dari parent
        try {
          editNameTextController.text = safeString((company as dynamic).name ?? (company as dynamic).namaPerusahaan);
          editAddressTextController.text = safeString((company as dynamic).alamat ?? (company as dynamic).alamatLoc);
          editPhoneTextController.text = safeString(company.noTelp);
          editWhatsappTextController.text = safeString(company.noWA);
          emailTextController.text = safeString((company as dynamic).createdBy);
        } catch (_) {}

        // 2. Mengecek status role pengguna
        try {
          final pref = ref.read(appPreferenceProvider);
          final idPerusahaan = await pref.read<String>(AppPreferenceKey.idperusahaan);
          final jabatan = await pref.read<String>(AppPreferenceKey.jabatan);
          final isAdminStored = await pref.read<String>(AppPreferenceKey.isAdmin);

          final cleanJabatan = jabatan?.trim().toLowerCase() ?? '';
          final isRoleAdmin = cleanJabatan.contains('admin');
          final isFlagAdmin = isAdminStored == 'true';

          // Set status admin ke state UI
          isUserAdmin.value = isFlagAdmin || isRoleAdmin;

          // Membuka stream Firestore untuk SEMUA PENGGUNA (Admin dan Karyawan)
          if (idPerusahaan != null && idPerusahaan.isNotEmpty) {
            subscription = FirebaseFirestore.instance
                .collection('companies')
                .doc(idPerusahaan)
                .snapshots()
                .listen((snapshot) {
              if (snapshot.exists && snapshot.data() != null) {
                final data = snapshot.data() as Map<String, dynamic>;

                // Update text dari realtime database hanya jika sedang tidak diedit oleh user
                if (!isEditName.value) editNameTextController.text = safeString(data['namaPerusahaan']);
                if (!isEditAddress.value) editAddressTextController.text = safeString(data['alamatLoc']);
                if (!isEditPhone.value) editPhoneTextController.text = safeString(data['noTelp']);
                if (!isEditWhatsapp.value) editWhatsappTextController.text = safeString(data['noWA']);

                // Field Email yang diambil dari field createdBy di Firestore
                emailTextController.text = safeString(data['createdBy']);
              }
              isLoading.value = false;
            }, onError: (error) {
              debugPrint("InfoView Firestore Stream Error: $error");
              isLoading.value = false;
            });
          } else {
            isLoading.value = false;
          }
        } catch (e) {
          debugPrint("InfoView Init Error: $e");
          isLoading.value = false;
        }
      }

      init();

      // Membersihkan memori dan listener saat pindah halaman
      return () {
        subscription?.cancel();
      };
    }, []);

    Future<void> saveChanges() async {
      try {
        isLoadingEdit.value = true;

        final result = await editCompanyNotifier.updateCompanyProfile(
          namaPerusahaan: editNameTextController.text,
          alamatLoc: editAddressTextController.text,
          noTelp: editPhoneTextController.text.replaceAll(RegExp(r'[^0-9]'), ""),
          noWA: editWhatsappTextController.text.replaceAll(RegExp(r'[^0-9]'), ""),
        );

        result.fold(
              (error) => AppToast.showToast(msg: error.message ?? "info.save_failed".tr(context: context)),
              (data) {
            AppToast.showToast(msg: "info.save_success".tr(context: context));
          },
        );
      } catch (e) {
        AppToast.showToast(msg: "Error: $e");
      } finally {
        isLoadingEdit.value = false;
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          "info.title".tr(context: context),
          style: GoogleFonts.dmSans(
            textStyle: AppTheme.primaryTextStyle.copyWith(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
      body: Skeletonizer(
        enabled: isLoading.value,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Email / Created By
              isUserAdmin.value
                  ? AppWidgets.textField(
                // Jika Admin, maka textfield biasa saja (Read-only, Tanpa fungsi copy, Tanpa ikon copy)
                label: "info.email".tr(context: context),
                name: 'email',
                hint: "info.email_hint".tr(context: context),
                controller: emailTextController,
                readOnly: true,
                focusedBorder: const BorderSide(color: AppColors.lightGrey, width: 1),
                textInputAction: TextInputAction.next,
                prefixIcon: const Icon(Icons.email_outlined, color: AppColors.darkGray, size: 20),
              )
                  : buildCopyableField(
                // Jika Karyawan, gunakan custom widget agar teks digaris-bawahi dan copy otomatis saat disentuh
                label: "info.email".tr(context: context),
                hint: "info.email_hint".tr(context: context),
                controller: emailTextController,
                prefixIcon: const Icon(Icons.email_outlined, color: AppColors.darkGray, size: 20),
                onTap: () => copyToClipboard(emailTextController.text, "info.email".tr(context: context)),
              ),
              10.margin,

              // Name (Biasa, tidak bisa dicopy dan tidak ada ikon copy bagi non-admin)
              AppWidgets.textField(
                label: "name".tr(context: context),
                name: 'name',
                hint: "full_name".tr(context: context),
                controller: editNameTextController,
                readOnly: !isUserAdmin.value || !isEditName.value,
                focusedBorder: const BorderSide(color: AppColors.lightGrey, width: 1),
                textInputAction: TextInputAction.next,
                prefixIcon: const Icon(Icons.business_outlined, color: AppColors.darkGray, size: 20),
                suffixIcon: isUserAdmin.value
                    ? IconButton(
                  onPressed: () async {
                    isEditName.value = !isEditName.value;
                    if (!isEditName.value) {
                      await saveChanges();
                    }
                  },
                  icon: isLoadingEdit.value
                      ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                      : Text(
                    isEditName.value ? "done".tr(context: context) : "edit".tr(context: context),
                    style: GoogleFonts.dmSans(
                      textStyle: AppTheme.primaryTextStyle.copyWith(
                        color: AppColors.blue,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                )
                    : null, // Sembunyikan untuk non-admin
              ),
              10.margin,

              // Address / Lokasi (Dengan sistem copy otomatis bagi Karyawan)
              isUserAdmin.value
                  ? AppWidgets.textField(
                label: "address".tr(context: context),
                name: 'address',
                hint: "enter_address".tr(context: context),
                controller: editAddressTextController,
                readOnly: !isEditAddress.value,
                focusedBorder: const BorderSide(color: AppColors.lightGrey, width: 1),
                textInputAction: TextInputAction.done,
                maxlines: 1,
                prefixIcon: const Icon(Icons.pin_drop_outlined, color: AppColors.darkGray, size: 20),
                suffixIcon: IconButton(
                  onPressed: () async {
                    isEditAddress.value = !isEditAddress.value;
                    if (!isEditAddress.value) {
                      await saveChanges();
                    }
                  },
                  icon: isLoadingEdit.value
                      ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                      : Text(
                    isEditAddress.value ? "done".tr(context: context) : "edit".tr(context: context),
                    style: GoogleFonts.dmSans(
                      textStyle: AppTheme.primaryTextStyle.copyWith(
                        color: AppColors.blue,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              )
                  : buildCopyableField(
                // Jika Karyawan, gunakan custom widget agar teks digaris-bawahi dan auto copy saat ditekan
                label: "address".tr(context: context),
                hint: "enter_address".tr(context: context),
                controller: editAddressTextController,
                prefixIcon: const Icon(Icons.pin_drop_outlined, color: AppColors.darkGray, size: 20),
                onTap: () => copyToClipboard(editAddressTextController.text, "info.address".tr(context: context)),
              ),
              10.margin,

              // Phone & WhatsApp
              isUserAdmin.value
                  ? AppWidgets.textFieldGrouped(
                // Jika Admin, tampilkan TextField yang digabung (Grouped) dan bisa diubah
                items: 2,
                isRequired: [true, true],
                names: [
                  'phone_number'.tr(context: context),
                  'whatsapp_number'.tr(context: context),
                ],
                hints: [
                  'phone_number_hint'.tr(context: context),
                  'whatsapp_number_hint'.tr(context: context),
                ],
                readOnly: [
                  !isEditPhone.value,
                  !isEditWhatsapp.value,
                ],
                controllers: [
                  editPhoneTextController,
                  editWhatsappTextController,
                ],
                inputFormatters: [
                  [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(15),
                    PhoneNumberFormatter(),
                  ],
                  [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(15),
                    PhoneNumberFormatter(),
                  ],
                ],
                prefixIcons: [
                  const Icon(Icons.phone_outlined, color: AppColors.darkGray, size: 20),
                  Container(
                    width: 20,
                    height: 20,
                    alignment: Alignment.center,
                    child: Image.asset(
                      Assets.icons.icWhatsappBusiness.path,
                      width: 18,
                      height: 18,
                      fit: BoxFit.contain,
                    ),
                  ),
                ],
                suffixIcons: [
                  IconButton(
                    onPressed: () async {
                      isEditPhone.value = !isEditPhone.value;
                      if (!isEditPhone.value) {
                        await saveChanges();
                      }
                    },
                    icon: isLoadingEdit.value
                        ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                        : Text(
                      isEditPhone.value ? "done".tr(context: context) : "edit".tr(context: context),
                      style: GoogleFonts.dmSans(
                        textStyle: AppTheme.primaryTextStyle.copyWith(
                          color: AppColors.blue,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () async {
                      isEditWhatsapp.value = !isEditWhatsapp.value;
                      if (!isEditWhatsapp.value) {
                        await saveChanges();
                      }
                    },
                    icon: isLoadingEdit.value
                        ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                        : Text(
                      isEditWhatsapp.value ? "done".tr(context: context) : "edit".tr(context: context),
                      style: GoogleFonts.dmSans(
                        textStyle: AppTheme.primaryTextStyle.copyWith(
                          color: AppColors.blue,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              )
                  : Column(
                // Jika Karyawan, gunakan custom widget agar teks digaris-bawahi dan auto copy jika ditekan
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  buildCopyableField(
                    label: 'phone_number'.tr(context: context),
                    hint: 'phone_number_hint'.tr(context: context),
                    controller: editPhoneTextController,
                    prefixIcon: const Icon(Icons.phone_outlined, color: AppColors.darkGray, size: 20),
                    onTap: () => copyToClipboard(editPhoneTextController.text, "info.phone".tr(context: context)),
                  ),
                  10.margin,
                  buildCopyableField(
                    label: 'whatsapp_number'.tr(context: context),
                    hint: 'whatsapp_number_hint'.tr(context: context),
                    controller: editWhatsappTextController,
                    prefixIcon: Container(
                      width: 20,
                      height: 20,
                      alignment: Alignment.center,
                      child: Image.asset(
                        Assets.icons.icWhatsappBusiness.path,
                        width: 18,
                        height: 18,
                        fit: BoxFit.contain,
                      ),
                    ),
                    onTap: () => copyToClipboard(editWhatsappTextController.text, "info.whatsapp".tr(context: context)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}