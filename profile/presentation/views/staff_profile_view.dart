part of 'staff.dart';

class StaffProfileView extends HookConsumerWidget {
  final Staff staff;
  // [MODIFIKASI] onKick dibuat nullable (?) agar bisa View-Only
  final Function(String email, String name)? onKick;

  const StaffProfileView({
    super.key,
    required this.staff,
    this.onKick, // [MODIFIKASI] Tidak lagi required
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // State untuk Tab Menu
    final selectedMenuIndex = useState(4);

    final List<String> menuIcons = [
      Assets.icons.icPresenceOutline,
      Assets.icons.icWorkHistoryOutlined,
      Assets.icons.icReimburst,
      Assets.icons.icChecRound,
      Assets.icons.icAdministator,
    ];

    final nameController = useTextEditingController(text: staff.namaKaryawan ?? '-');
    final emailController = useTextEditingController(text: staff.alamatEmail ?? '-');
    final phoneController = useTextEditingController(text: staff.noHp ?? '-');
    final waController = useTextEditingController(text: staff.noHp ?? '-');
    final addressController = useTextEditingController(text: staff.alamatLoc ?? '-');

    final emailLabelController = useTextEditingController(text: "Email");
    final addressLabelController = useTextEditingController(text: "Alamat");

    void openChatWithTag() {
      final name = staff.namaKaryawan ?? '';
      if (name.isNotEmpty) {
        context.pushNamed(Routes.horaChat, extra: {
          'type': 'draft',
          'data': '@$name '
        });
      }
    }

    void showKickOverlay() {
      // [GUARD] Jika onKick null, jangan lakukan apa-apa
      if (onKick == null) return;

      showModalBottomSheet(
        context: context,
        backgroundColor: Colors.transparent,
        isScrollControlled: true,
        builder: (context) {
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.lightGrey,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  "Keluarkan",
                  style: AppTheme.primaryTextStyle.copyWith(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 40),
                SvgPicture.asset(
                  Assets.icons.icDeleteStaff,
                  width: 21,
                  height: 16,
                  colorFilter: const ColorFilter.mode(Colors.black, BlendMode.srcIn),
                ),
                const SizedBox(height: 24),
                Text(
                  "Keluarkan ${staff.namaKaryawan ?? 'User'} sekarang?",
                  textAlign: TextAlign.center,
                  style: AppTheme.secondaryTextStyle.copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.darkGray,
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () async {
                      Navigator.pop(context);
                      AppDialog.showLoading(context);
                      try {
                        final notifier = ref.read(staffStateNotifierProvider.notifier);
                        final result = await notifier.fireEmployee(
                            email: staff.alamatEmail ?? '',
                            reason: "Removed by Admin"
                        );
                        result.fold(
                                (error) {
                              AppDialog.closeLoading(context);
                              AppToast.showToast(msg: error.message ?? "Gagal mengeluarkan karyawan");
                            },
                                (success) {
                              AppDialog.closeLoading(context);
                              AppToast.showToast(msg: "Berhasil mengeluarkan karyawan");
                              context.pop();
                            }
                        );
                      } catch (e) {
                        AppDialog.closeLoading(context);
                        AppToast.showToast(msg: "Terjadi kesalahan sistem");
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.featurePurple,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      "Ya, keluarkan",
                      style: AppTheme.primaryTextStyle.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          );
        },
      );
    }

    String joinDateDisplay = DateFormat('dd MMMM yyyy', 'id').format(DateTime.now());

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        titleSpacing: 0,
        centerTitle: false,
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        shape: const Border(bottom: BorderSide.none),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => context.pop(),
        ),
        title: const SizedBox.shrink(),
        actions: [
          IconButton(
            onPressed: openChatWithTag,
            tooltip: "Chat Karyawan",
            icon: SvgPicture.asset(
              Assets.icons.icChatOutlined,
              width: 20,
              height: 20,
              colorFilter: const ColorFilter.mode(Colors.black, BlendMode.srcIn),
            ),
          ),
          // [MODIFIKASI] Hanya tampilkan tombol delete jika onKick tidak null
          if (onKick != null)
            IconButton(
              onPressed: showKickOverlay,
              tooltip: "Hapus Karyawan",
              icon: SvgPicture.asset(
                Assets.icons.icDeleteStaff,
                width: 21,
                height: 16,
              ),
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 57),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.grey.shade200,
                    border: Border.all(color: Colors.white, width: 4),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 12,
                        offset: const Offset(0, 6),
                      ),
                    ],
                    image: DecorationImage(
                      image: (staff.foto != null && staff.foto!.isNotEmpty)
                          ? NetworkImage(staff.foto!)
                          : const NetworkImage('https://horaapp.id/assets/img/favicon.png'),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                16.margin,
                Text(
                  staff.namaKaryawan ?? "-",
                  textAlign: TextAlign.center,
                  style: GoogleFonts.montserrat(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.darkGray,
                  ),
                ),
                8.margin,
                Text(
                  "Bergabung sejak $joinDateDisplay",
                  style: GoogleFonts.montserrat(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.featurePurple,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 60),

            Container(
              height: 42,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppColors.lightGrey,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(menuIcons.length, (index) {
                  final isSelected = selectedMenuIndex.value == index;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => selectedMenuIndex.value = index,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isSelected ? Colors.white : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: isSelected
                              ? [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ]
                              : [],
                        ),
                        child: SvgPicture.asset(
                          menuIcons[index],
                          width: 20,
                          height: 20,
                          colorFilter: const ColorFilter.mode(
                            Colors.black,
                            BlendMode.srcIn,
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),

            10.margin,

            // --- KONTEN BERDASARKAN MENU ---
            if (selectedMenuIndex.value == 0) ...[
              // --- ABSENSI ---
              UserAbsenceList(
                  targetUserId: staff.idkaryawan
              ),

            ] else if (selectedMenuIndex.value == 1) ...[
              UserLeaveList(
                profile: null,
                targetEmail: staff.alamatEmail,
              ),

            ] else if (selectedMenuIndex.value == 2) ...[
              UserReimburseList(
                profile: null,
                targetEmail: staff.alamatEmail,
              ),

            ] else if (selectedMenuIndex.value == 3) ...[
              UserTaskList(
                profile: null,
                targetEmail: staff.alamatEmail,
              ),

            ] else if (selectedMenuIndex.value == 4) ...[
              // --- DATA DIRI ---
              AppWidgets.textField(
                label: "Nama Lengkap",
                name: 'name',
                hint: "",
                controller: nameController,
                readOnly: true,
                focusedBorder: const BorderSide(color: AppColors.lightGrey, width: 1),
                prefixIcon: Container(
                  padding: const EdgeInsets.all(12),
                  child: SvgPicture.asset(
                    Assets.icons.icAdministator,
                    width: 20,
                    height: 20,
                    colorFilter: const ColorFilter.mode(AppColors.darkGray, BlendMode.srcIn),
                  ),
                ),
              ),

              10.margin,

              AppWidgets.textField(
                label: "Email",
                name: 'email',
                hint: "",
                readOnly: true,
                controller: emailLabelController,
                focusedBorder: const BorderSide(color: AppColors.lightGrey, width: 1),
                prefixIcon: const Icon(Icons.email_outlined, color: AppColors.darkGray),
                suffixIcon: Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Flexible(
                        child: Text(
                          staff.alamatEmail ?? '-',
                          style: GoogleFonts.montserrat(
                            fontSize: 12,
                            color: Colors.grey,
                          ),
                          textAlign: TextAlign.right,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              10.margin,

              AppWidgets.textField(
                label: "Alamat",
                name: 'address',
                hint: "",
                readOnly: true,
                controller: addressLabelController,
                focusedBorder: const BorderSide(color: AppColors.lightGrey, width: 1),
                prefixIcon: const Icon(Icons.pin_drop_outlined, color: AppColors.darkGray),
                suffixIcon: Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Flexible(
                        child: Text(
                          staff.alamatLoc?.isNotEmpty == true ? staff.alamatLoc! : "-",
                          style: GoogleFonts.montserrat(
                            fontSize: 12,
                            color: Colors.grey,
                          ),
                          textAlign: TextAlign.right,
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              10.margin,

              AppWidgets.textFieldGrouped(
                items: 2,
                isRequired: [false, false],
                names: ['No. Telepon', 'No. WhatsApp'],
                hints: ['', ''],
                readOnly: [true, true],
                controllers: [phoneController, waController],
                inputFormatters: [[], []],
                prefixIcons: [
                  const Icon(Icons.phone_outlined, color: AppColors.darkGray, size: 20),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Image.asset(Assets.icons.icWhatsappBusiness.path, width: 24, height: 24, fit: BoxFit.fitWidth),
                    ],
                  ),
                ],
              ),
            ],

            40.margin,
          ],
        ),
      ),
    );
  }
}