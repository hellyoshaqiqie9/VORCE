part of '../views/profile.dart';

// PERBAIKAN: Menggunakan HookConsumerWidget untuk memanggil API secara sinkron seperti StorageView
class _CompanyMenu extends HookConsumerWidget {
  const _CompanyMenu({super.key, required this.isAdmin, required this.company});
  final bool isAdmin;
  final Company? company;

  // Helper untuk format storage (sama persis dengan StorageView)
  String _formatBytes(double bytes) {
    if (bytes >= 1073741824) {
      return "${(bytes / 1073741824).toStringAsFixed(2)} GB";
    } else if (bytes >= 1048576) {
      return "${(bytes / 1048576).toStringAsFixed(2)} MB";
    } else if (bytes >= 1024) {
      return "${(bytes / 1024).toStringAsFixed(2)} KB";
    } else {
      return "${bytes.toStringAsFixed(0)} B";
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const double uniformIconSize = 20.0;
    const double arrowSize = 14.0;
    const double valueFontSize = 14.0;

    final usedStorageBytes = useState<double>(0);
    final maxStorageBytes = useState<double>(1);
    final isStorageLoading = useState<bool>(true);

    // Fetch Storage agar sama persis dengan StorageView
    useEffect(() {
      Future<void> fetchStorageData() async {
        try {
          final api = ref.read(profileApiProvider);
          final companyRes = await api.getCompanyStaffList();
          if (companyRes.response.statusCode == 200) {
            final data = companyRes.response.data;
            if (data is Map<String, dynamic> && data['storage'] != null) {
              usedStorageBytes.value = (data['storage']['used'] ?? 0).toDouble();
              maxStorageBytes.value = (data['storage']['max'] ?? 1).toDouble();
            }
          }
        } catch (e) {
          debugPrint("Error fetching storage in menu: $e");
        } finally {
          if (context.mounted) isStorageLoading.value = false;
        }
      }
      fetchStorageData();
      return null;
    }, []);

    // FORMAT SAMA PERSIS DENGAN STORAGEVIEW
    String formattedStorage = isStorageLoading.value
        ? "profile.loading".tr(context: context)
        : "${_formatBytes(usedStorageBytes.value)} / ${_formatBytes(maxStorageBytes.value)}";

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppWidgets.infoContainer(
          children: [
            InkWell(
              onTap: () {
                // Semua (Admin/Karyawan) bisa mengakses Staff
                context.pushNamed(Routes.staff);
              },
              child: AppWidgets.infoRow(
                iconLabel: SvgPicture.asset(
                  Assets.icons.icGroups,
                  width: uniformIconSize,
                  height: uniformIconSize,
                  colorFilter: const ColorFilter.mode(AppColors.darkGray, BlendMode.srcIn),
                ),
                label: 'staff_label'.tr(context: context),
                customWidgetValue: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      "${company?.totalEmployee ?? 0}",
                      style: GoogleFonts.dmSans(
                        fontSize: valueFontSize,
                        color: AppColors.darkGray.withOpacity(0.6),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(
                      Icons.arrow_forward_ios_outlined,
                      size: arrowSize,
                      color: AppColors.black,
                    ),
                  ],
                ),
              ),
            ),

            InkWell(
              onTap: () {
                if (isAdmin) {
                  context.pushNamed(Routes.storage);
                } else {
                  AppToast.showToast(msg: "only_admin_access".tr(context: context));
                }
              },
              child: AppWidgets.infoRow(
                iconLabel: SvgPicture.asset(
                  Assets.icons.icStorage,
                  width: 20,
                  height: 14,
                  colorFilter: const ColorFilter.mode(AppColors.darkGray, BlendMode.srcIn),
                ),
                label: 'storage_label'.tr(context: context),
                customWidgetValue: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      formattedStorage, // Menggunakan formatting yang baru
                      style: GoogleFonts.dmSans(
                        fontSize: valueFontSize,
                        color: AppColors.darkGray.withOpacity(0.6),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (isAdmin) ...[
                      const SizedBox(width: 8),
                      const Icon(
                        Icons.arrow_forward_ios_outlined,
                        size: arrowSize,
                        color: AppColors.black,
                      ),
                    ]
                  ],
                ),
              ),
            ),

            InkWell(
              onTap: () {
                // Semua (Admin/Karyawan) bisa mengakses Info
                context.pushNamed(Routes.info, extra: company);
              },
              child: AppWidgets.infoRow(
                iconLabel: SvgPicture.asset(
                  Assets.icons.icExclamationMark,
                  width: uniformIconSize,
                  height: uniformIconSize,
                  colorFilter: const ColorFilter.mode(AppColors.darkGray, BlendMode.srcIn),
                ),
                label: 'info_label'.tr(context: context),
                customWidgetValue: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Flexible(
                      child: Text(
                        "profile.updated".tr(context: context, args: [DateFormat('dd/MM/yyyy', 'id').format(DateTime.now())]),
                        style: GoogleFonts.dmSans(
                          fontSize: valueFontSize,
                          color: AppColors.darkGray.withOpacity(0.6),
                          fontWeight: FontWeight.w500,
                        ),
                        textAlign: TextAlign.right,
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(
                      Icons.arrow_forward_ios_outlined,
                      size: arrowSize,
                      color: AppColors.black,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}