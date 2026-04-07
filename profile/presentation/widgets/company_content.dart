part of '../views/profile.dart';

class _CompanyContent extends HookConsumerWidget {
  const _CompanyContent({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Memantau state data perusahaan secara reaktif
    final companyState = ref.watch(companyStateNotifierProvider);

    // --- PERBAIKAN CACHE AMAN DARI ERROR EKTENSI ---
    // Menggunakan dataOrNull untuk mengecek ketersediaan data secara langsung
    final bool isDataAvailable = companyState.dataOrNull != null;

    // Jika data sudah tersedia di cache, langsung set isLoading ke false agar tidak ada flicker
    final isLoading = useState(!isDataAvailable);

    useEffect(() {
      // Jika data belum tersedia, baru lakukan pemanggilan API
      if (!isDataAvailable) {
        Future.microtask(() async {
          if (!context.mounted) return;
          await ref.read(companyStateNotifierProvider.notifier).getCompany().whenComplete(() {
            if (context.mounted) isLoading.value = false;
          });
        });
      }
      return null;
    }, []); // Hanya dipanggil sekali saat layout dibuat

    return Skeletonizer(
      enabled: isLoading.value,
      child: companyState.isFailed && !isDataAvailable
          ? AppWidgets.errorWidget(
        message: companyState.exception.message,
        onRetry: () {
          isLoading.value = true;
          ref
              .read(companyStateNotifierProvider.notifier)
              .getCompany()
              .whenComplete(() {
            if (context.mounted) isLoading.value = false;
          });
        },
      )
          : _LayoutCompany(
        company: companyState.dataOrNull,
      ),
    );
  }
}

class _LayoutCompany extends HookConsumerWidget {
  final Company? company;

  const _LayoutCompany({required this.company});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileStateNotifierProvider).dataOrNull;

    final isLoading = useState(false);
    final isAdmin = useState(false);

    final editCompanyStateNotifier =
    ref.read(editCompanyStateNotifierProvider.notifier);

    useEffect(() {
      if (profile != null) {
        final cleanJabatan = profile.jabatan?.trim().toLowerCase() ?? '';
        final isRoleAdmin = cleanJabatan == 'admin' || cleanJabatan == 'superadmin' || cleanJabatan == 'owner' || cleanJabatan.contains('admin');
        isAdmin.value = isRoleAdmin;
      } else {
        // Fallback jika profile belum siap
        Future.microtask(() async {
          try {
            final pref = ref.read(appPreferenceProvider);
            final jabatan = await pref.read<String>(AppPreferenceKey.jabatan);
            if (!context.mounted) return;
            final cleanJabatan = jabatan?.trim().toLowerCase() ?? '';
            final isRoleAdmin = cleanJabatan == 'admin' || cleanJabatan == 'superadmin' || cleanJabatan == 'owner' || cleanJabatan.contains('admin');
            isAdmin.value = isRoleAdmin;
          } catch (_) {
            if (context.mounted) isAdmin.value = false;
          }
        });
      }
      return null;
    }, [profile]);

    // Helper untuk image logo yang aman
    ImageProvider? getLogoImage() {
      if (company?.logo != null && company!.logo!.isNotEmpty) {
        return NetworkImage(company!.logo!.toUrlImageHora);
      }
      return null;
    }

    return RefreshIndicator(
      onRefresh: () async {
        // Fitur Pull to Refresh: pengguna secara manual ingin update data dari server
        await ref.read(companyStateNotifierProvider.notifier).getCompany();
      },
      color: AppColors.featurePurple,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            56.margin,
            Align(
              alignment: Alignment.center,
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.grey.shade300,
                  border: Border.all(color: Colors.white, width: 1),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.25),
                      blurRadius: 12,
                      offset: const Offset(0, 6),
                    ),
                  ],
                  image: getLogoImage() != null
                      ? DecorationImage(
                    image: getLogoImage()!,
                    fit: BoxFit.cover,
                  )
                      : null,
                ),
                child: getLogoImage() == null
                    ? const Icon(Icons.business, size: 50, color: Colors.white)
                    : null,
              ),
            ),
            10.margin,
            Align(
              alignment: Alignment.center,
              child: AppWidgets.primaryButton(
                onTap: () async {
                  try {
                    if (!isAdmin.value) {
                      AppToast.showToast(
                          msg: "only_admin_access".tr(context: context));
                      return;
                    }

                    if (isLoading.value) return;
                    isLoading.value = true;

                    final isGranted = await AppPermission.showPermissionModal(
                      context,
                      permissions: [
                        PermissionModal.camera,
                        PermissionModal.storage
                      ],
                    );
                    if (!isGranted) {
                      isLoading.value = false;
                      return;
                    }

                    var pickedImage = await ImagePicker()
                        .pickImage(source: ImageSource.gallery);
                    if (pickedImage == null) {
                      isLoading.value = false;
                      return;
                    }

                    File file = File(pickedImage.path);
                    final dir = await getTemporaryDirectory();
                    final targetPath = path.join(dir.absolute.path,
                        "compressed_${path.basename(file.path)}");
                    final compressedImage =
                    await FlutterImageCompress.compressAndGetFile(
                      file.absolute.path,
                      targetPath,
                      quality: 50,
                    );
                    if (compressedImage is XFile) {
                      file = File(compressedImage.path);
                    }

                    final result =
                    await editCompanyStateNotifier.updateCompanyLogo(
                      file: file,
                      desc: null,
                    );

                    result.fold(
                          (error) => AppToast.showToast(
                          msg: "update_logo_failed".tr(context: context)),
                          (data) {
                        AppToast.showToast(
                            msg: "changes_saved".tr(context: context));
                        // Refresh company data untuk update logo di UI
                        ref
                            .read(companyStateNotifierProvider.notifier)
                            .getCompany();
                      },
                    );
                  } catch (err) {
                    AppToast.showToast(
                        msg: "update_logo_failed".tr(context: context));
                  } finally {
                    if (context.mounted) {
                      isLoading.value = false;
                    }
                  }
                },
                text: "change_logo".tr(context: context),
                backgroundColor: AppColors.featurePurple,
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 6,
                ),
                textStyle: GoogleFonts.dmSans(
                  textStyle: AppTheme.primaryTextStyle.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ),

            56.margin,
            _CompanyMenu(
              isAdmin: isAdmin.value,
              company: company,
            ),
            10.margin,
            const _AboutMenu(),

            // --- TOMBOL HAPUS PERUSAHAAN (DISAMAKAN DENGAN USER CONTENT) ---
            if (isAdmin.value) ...[
              10.margin,
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    context.pushNamed(Routes.deleteCompany);
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    decoration: BoxDecoration(
                      color: AppColors.switchBarBackground, // Background #EDEDED
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      "profile.delete_company".tr(context: context),
                      textAlign: TextAlign.left, // Teks berada di kiri
                      style: GoogleFonts.dmSans(
                        color: Colors.black, // Teks warna hitam
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ),
            ],
            // -----------------------------------------------------------------

            40.margin,
          ],
        ),
      ),
    );
  }
}