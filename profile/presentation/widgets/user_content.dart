part of '../views/profile.dart';


class _UserContent extends HookConsumerWidget {
  const _UserContent();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileNotifier = ref.watch(profileStateNotifierProvider);
    final isLoading = useState(true);

    useEffect(() {
      Future.microtask(() async {
        if (context.mounted) {
          // --- CHANGED: START LISTENING TO REALTIME STREAM ---
          ref.read(profileStateNotifierProvider.notifier).listenToProfile();
        }
      });

      // --- TIMEOUT FALLBACK ---
      // Jika jaringan bermasalah dan stream menyangkut, paksa loading berhenti setelah 3 detik
      final timer = Timer(const Duration(seconds: 3), () {
        if (context.mounted) {
          isLoading.value = false;
        }
      });

      return () => timer.cancel();
    }, []);

    // Jika data berhasil dimuat, langsung matikan skeleton loading
    if (profileNotifier.dataOrNull != null) {
      isLoading.value = false;
    }

    // FIX: Menggunakan dataOrNull, bukan .data untuk mencegah Error Casting saat Loading
    final bool showSkeleton = isLoading.value && profileNotifier.dataOrNull == null;

    return Skeletonizer(
      enabled: showSkeleton,
      child: profileNotifier.isFailed && profileNotifier.dataOrNull == null
          ? AppWidgets.errorWidget(
        message: profileNotifier.exception.message,
        onRetry: () {
          isLoading.value = true;
          ref.read(profileStateNotifierProvider.notifier).listenToProfile();
        },
      )
          : layoutUserContent(
        context,
        ref,
        profileNotifier.dataOrNull,
            (value) {
          isLoading.value = value;
        },
      ),
    );
  }
}

Widget layoutUserContent(BuildContext context, WidgetRef ref, Profile? profile, Function(bool) onLoading) {
  final imagePicked = useState<XFile?>(null);

  // State untuk Tab Menu (0: Izin, 1: Reimburse, 2: Tugas, 3: Data Diri)
  // Default ke Data Diri (3)
  final selectedMenuIndex = useState(3);

  final isEditName = useState(false);
  final isEditAddress = useState(false);
  final isEditPhone = useState(false);

  final name = useState(profile?.name ?? '');
  final address = useState(profile?.address ?? '');
  final phone = useState(profile?.phone ?? '');
  final email = useState(profile?.email ?? '');

  final nameEditTextController = useTextEditingController(text: profile?.name ?? '');
  final addressEditTextController = useTextEditingController(text: profile?.address ?? '');
  final phoneEditTextController = useTextEditingController(text: profile?.phone ?? '');
  // Controller asli email (untuk data)
  final emailEditTextController = useTextEditingController(text: profile?.email ?? '');

  // Update controllers jika data profile berubah (Realtime update)
  useEffect(() {
    if (profile != null) {
      if (!isEditName.value) nameEditTextController.text = profile.name;
      if (!isEditAddress.value) addressEditTextController.text = profile.address ?? '';
      if (!isEditPhone.value) phoneEditTextController.text = profile.phone ?? '';
      // Assuming noWA is not in basic Profile object, but if needed map it
      // whatsappEditTextController.text = ...
      emailEditTextController.text = profile.email;
    }
    return null;
  }, [profile]);

  // --- ADDED: Controller untuk Device Info ---
  final deviceInfoController = useTextEditingController(text: "Loading...");
  // --- ADDED: State khusus untuk menyimpan ID/Mac Address agar bisa dipisah layoutnya ---
  final deviceIdStr = useState("");

  // --- ADDED: Effect untuk mengambil data Device ---
  useEffect(() {
    void getDeviceInfo() async {
      final DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
      String deviceName = "Unknown Device";
      String deviceId = "-"; // Mac Address (Restricted on Android/iOS, using ID instead)

      try {
        if (Platform.isAndroid) {
          AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
          deviceName = "${androidInfo.brand} ${androidInfo.model}";
          deviceId = androidInfo.id;
        } else if (Platform.isIOS) {
          IosDeviceInfo iosInfo = await deviceInfo.iosInfo;
          deviceName = iosInfo.name;
          deviceId = iosInfo.identifierForVendor ?? "-";
        }
      } catch (e) {
        deviceName = Platform.operatingSystem;
      }

      // Update Controller hanya dengan Nama Device
      deviceInfoController.text = deviceName;
      // Simpan ID ke state terpisah untuk ditampilkan di kanan
      deviceIdStr.value = deviceId;
    }

    getDeviceInfo();

    return null;
  }, []);

  // Warna Feature Purple
  const Color featurePurple = Color(0xFF6B4EFF);

  // Daftar Ikon Menu (SVG Assets)
  // Urutan: Izin, Reimburse, Tugas, Profil
  final List<String> menuIcons = [
    Assets.icons.icWorkHistoryOutlined, // Izin (Index 0)
    Assets.icons.icReimburst,           // Reimburse (Index 1)
    Assets.icons.icChecRound,           // Tugas (Index 2)
    Assets.icons.icAdministator,        // Data Diri/Profil (Index 3)
  ];

  void update() async {
    try {
      onLoading(true);
      await ref
          .read(profileStateNotifierProvider.notifier)
          .updateUserProfile(
        username: nameEditTextController.text,
        alamatLoc: addressEditTextController.text,
        noTelp: phoneEditTextController.text,
        noWA: phoneEditTextController.text,
      )
          .whenComplete(() {
        // Karena sekarang realtime, kita tidak perlu memanggil getProfile lagi manual
        // Firestore akan memicu update otomatis
      });
      AppToast.showToast(msg: "profile_you.changes_saved".tr());
    } catch (err) {
      AppToast.showToast(msg: "profile_you.changes_failed".tr());
    } finally {
      onLoading(false);
    }
  }

  Future<void> updatePhoto(XFile pickedFile) async {
    try {
      onLoading(true);
      File file = File(pickedFile.path);
      final dir = await getTemporaryDirectory();
      final targetPath = path.join(dir.absolute.path, "compressed_${path.basename(file.path)}");

      final compressedImage = await FlutterImageCompress.compressAndGetFile(
        file.absolute.path,
        targetPath,
        quality: 50,
      );

      File finalFile = file;
      if (compressedImage is XFile) {
        finalFile = File(compressedImage.path);
      }

      final notifier = ref.read(profileStateNotifierProvider.notifier);
      final result = await notifier.updateUserPhoto(
        file: finalFile,
        desc: null,
      );

      result.fold(
            (error) => AppToast.showToast(msg: "profile.update_photo_fail".tr(context: context)),
            (data) {
          AppToast.showToast(msg: "profile.update_photo_success".tr(context: context));
          // Realtime listener akan update UI
        },
      );
    } catch (e) {
      AppToast.showToast(msg: "profile.process_img_fail".tr(context: context, args: [e.toString()]));
    } finally {
      onLoading(false);
    }
  }

  Future<void> handleImagePicked(XFile? image) async {
    if (image != null) {
      imagePicked.value = image;
      await updatePhoto(image);
    }
  }

  return SingleChildScrollView(
    physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Jarak dari atas (Navbar/Appbar)
        10.margin,

        // --- HEADER: FOTO, NAMA, TOMBOL ---
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
                border: Border.all(color: Colors.white, width: 1),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ],
                // --- PERBAIKAN: MENGHAPUS NetworkImage Fallback (Mencegah HandshakeException) ---
                image: (imagePicked.value != null)
                    ? DecorationImage(
                  image: FileImage(File(imagePicked.value!.path)),
                  fit: BoxFit.cover,
                )
                    : (profile?.photo != null && profile!.photo.isNotEmpty)
                    ? DecorationImage(
                  image: CachedNetworkImageProvider(profile!.photo.toUrlImageHora),
                  fit: BoxFit.cover,
                )
                    : null, // Fallback dihapus dan digantikan ikon di bawah
                // ------------------------------------
              ),
              // Tambahkan Icon sebagai fallback pengganti gambar
              child: (imagePicked.value == null && (profile?.photo == null || profile!.photo.isEmpty))
                  ? const Icon(Icons.person, size: 50, color: Colors.grey)
                  : null,
            ),
            16.margin,
            Text(
              nameEditTextController.text.isNotEmpty
                  ? nameEditTextController.text
                  : (profile?.name ?? "-"),
              textAlign: TextAlign.center,
              // PERUBAHAN: DM Sans
              style: GoogleFonts.dmSans(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.darkGray,
              ),
            ),
            12.margin,
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () async {
                  final ImagePicker picker = ImagePicker();
                  final XFile? image = await picker.pickImage(source: ImageSource.gallery);
                  handleImagePicked(image);
                },
                borderRadius: BorderRadius.circular(6), // Radius menjadi 6
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  decoration: BoxDecoration(
                    color: featurePurple, // Menggunakan warna featurePurple
                    borderRadius: BorderRadius.circular(6), // Radius menjadi 6
                    boxShadow: [
                      BoxShadow(
                        color: featurePurple.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      )
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        "change_photo".tr(context: context),
                        // PERUBAHAN: DM Sans
                        style: GoogleFonts.dmSans(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),

        32.margin,

        // --- SWITCH BAR (MENU) STYLE BARU DENGAN SVG ---
        Container(
          height: 42,
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: AppColors.switchBarBackground, // Background #EDEDED
            borderRadius: BorderRadius.circular(10), // Radius 10
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
                    // Style Indicator
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.white : Colors.transparent, // Putih jika aktif
                      borderRadius: BorderRadius.circular(8), // Radius sedikit lebih kecil dari container luar
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
                      // Ikon warna Hitam jika dipilih, dan #797979 jika tidak dipilih
                      colorFilter: ColorFilter.mode(
                        isSelected ? Colors.black : AppColors.greyIconUnselected,
                        BlendMode.srcIn,
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),

        // Jarak antara Switch Bar (Menu) dengan Konten di bawahnya
        10.margin,

        // --- KONTEN BERDASARKAN MENU ---
        if (selectedMenuIndex.value == 0) ...[
          // --- KONTEN IZIN (Index 0) ---
          UserLeaveList(profile: profile),

        ] else if (selectedMenuIndex.value == 1) ...[
          // --- KONTEN REIMBURSE (Index 1) ---
          UserReimburseList(profile: profile),

        ] else if (selectedMenuIndex.value == 2) ...[
          // --- KONTEN TUGAS (Index 2) ---
          UserTaskList(profile: profile),

        ] else if (selectedMenuIndex.value == 3) ...[
          // --- KONTEN DATA DIRI (Index 3) ---

          // 1. NAMA (Style Standard Input)
          AppWidgets.textField(
            label: "name".tr(context: context),
            name: 'name',
            hint: "full_name".tr(context: context),
            controller: nameEditTextController,
            onChanged: (value) => name.value = value!,
            readOnly: !isEditName.value,
            focusedBorder: const BorderSide(color: AppColors.lightGrey, width: 1),
            textInputAction: TextInputAction.done,
            prefixIcon: Container(
              padding: const EdgeInsets.all(12),
              child: SvgPicture.asset(
                Assets.icons.icExclamationMark,
                width: 20,
                height: 20,
                colorFilter: const ColorFilter.mode(AppColors.darkGray, BlendMode.srcIn),
              ),
            ),
            suffixIcon: IconButton(
              onPressed: () {
                isEditName.value = !isEditName.value;
                if (!isEditName.value) update();
              },
              icon: Text(
                isEditName.value ? "done".tr(context: context) : "edit".tr(context: context),
                // PERUBAHAN: DM Sans
                style: GoogleFonts.dmSans(
                  color: AppColors.blue,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),

          10.margin,

          // 2. EMAIL (DIUBAH KE STYLE STANDARD: Data langsung di input)
          AppWidgets.textField(
            label: "email".tr(context: context),
            name: 'email',
            hint: "email".tr(context: context),
            readOnly: true, // Email tetap read-only
            controller: emailEditTextController, // Menggunakan controller data email
            focusedBorder: const BorderSide(color: AppColors.lightGrey, width: 1),
            textInputAction: TextInputAction.done,
            prefixIcon: const Icon(Icons.email_outlined, color: AppColors.darkGray),
            // Tidak ada suffixIcon karena read-only dan tidak ada aksi edit
          ),

          10.margin,

          // 3. DEVICE INFO (DISABLED / HIDDEN)
          // AppWidgets.textField(
          //   label: "Device Info",
          //   name: 'device',
          //   hint: "Loading...",
          //   readOnly: true,
          //   controller: deviceInfoController, // Menampilkan Nama Device di Kiri
          //   focusedBorder: const BorderSide(color: AppColors.lightGrey, width: 1),
          //   textInputAction: TextInputAction.done,
          //   prefixIcon: Icon(
          //       Platform.isIOS ? Icons.phone_iphone : Icons.phone_android,
          //       color: AppColors.darkGray
          //   ),
          //   // Data ID Device di sebelah kanan (Suffix)
          //   suffixIcon: Padding(
          //     padding: const EdgeInsets.only(right: 12),
          //     child: Column(
          //       mainAxisAlignment: MainAxisAlignment.center,
          //       crossAxisAlignment: CrossAxisAlignment.end,
          //       children: [
          //         Text(
          //           deviceIdStr.value,
          //           // PERUBAHAN: DM Sans
          //           style: GoogleFonts.dmSans(
          //             fontSize: 12,
          //             color: Colors.grey, // Abu-abu
          //           ),
          //           textAlign: TextAlign.right,
          //           overflow: TextOverflow.ellipsis,
          //         ),
          //       ],
          //     ),
          //   ),
          // ),

          // 10.margin, // Disable margin for device info as well

          // 4. ALAMAT (DIUBAH KE STYLE STANDARD dengan Toggle Edit)
          AppWidgets.textField(
            label: "address".tr(context: context),
            name: 'address',
            hint: "enter_address".tr(context: context),
            controller: addressEditTextController,
            onChanged: (value) => address.value = value!,
            readOnly: !isEditAddress.value, // Read-only toggle sesuai state edit
            focusedBorder: const BorderSide(color: AppColors.lightGrey, width: 1),
            textInputAction: TextInputAction.newline,
            prefixIcon: const Icon(Icons.pin_drop_outlined, color: AppColors.darkGray),
            suffixIcon: IconButton(
              onPressed: () {
                isEditAddress.value = !isEditAddress.value;
                if (!isEditAddress.value) update(); // Simpan saat selesai edit
              },
              icon: Text(
                isEditAddress.value ? "done".tr(context: context) : "edit".tr(context: context),
                // PERUBAHAN: DM Sans
                style: GoogleFonts.dmSans(
                  color: AppColors.blue,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),

          10.margin,

          AppWidgets.textField(
            label: "phone_number".tr(context: context),
            name: 'phone',
            hint: "phone_number_hint".tr(context: context),
            controller: phoneEditTextController,
            onChanged: (value) => phone.value = value!,
            readOnly: !isEditPhone.value,
            focusedBorder: const BorderSide(color: AppColors.lightGrey, width: 1),
            textInputAction: TextInputAction.done,
            prefixIcon: const Icon(Icons.phone_outlined, color: AppColors.darkGray, size: 20),
            inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(15), PhoneNumberFormatter()],
            suffixIcon: IconButton(
              onPressed: () {
                isEditPhone.value = !isEditPhone.value;
                if (!isEditPhone.value) update();
              },
              icon: Text(
                isEditPhone.value ? "done".tr(context: context) : "edit".tr(context: context),
                style: GoogleFonts.dmSans(
                  color: AppColors.blue,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),

          // --- DELETE ACCOUNT BUTTON ---
          10.margin,
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const DeleteAccountView()),
                );
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: double.infinity, // Dibuat penuh
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16), // Padding horizontal ditambah agar rata kiri tidak terlalu mepet
                decoration: BoxDecoration(
                  color: AppColors.switchBarBackground, // Background #EDEDED
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  "profile.delete_account".tr(context: context),
                  textAlign: TextAlign.left, // Teks berada di kiri
                  // PERUBAHAN: DM Sans
                  style: GoogleFonts.dmSans(
                    color: Colors.black, // Teks diubah jadi hitam
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),

        ] else ...[
          // --- PLACEHOLDER UNTUK MENU LAIN ---
          SizedBox(
            height: 200,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SvgPicture.asset(
                    menuIcons[selectedMenuIndex.value],
                    width: 48,
                    height: 48,
                    colorFilter: const ColorFilter.mode(AppColors.lightGrey, BlendMode.srcIn),
                  ),
                  16.margin,
                  Text(
                    "profile.coming_soon".tr(context: context),
                    // PERUBAHAN: DM Sans
                    style: GoogleFonts.dmSans(
                      color: AppColors.darkGray.withOpacity(0.5),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          )
        ],
        40.margin,
      ],
    ),
  );
}