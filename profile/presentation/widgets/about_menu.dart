part of '../views/profile.dart';

class _AboutMenu extends StatelessWidget {
  const _AboutMenu({super.key});

  @override
  Widget build(BuildContext context) {
    // Ukuran ikon standar disamakan dengan menu lain (20.0)
    const double iconSize = 20.0;
    // Ukuran ikon kanan (panah/link) disamakan (14.0)
    const double trailingIconSize = 14.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppWidgets.infoContainer(
          children: [
            InkWell(
              onTap: () {
                context.pushNamed(
                  Routes.webview,
                  extra: WebviewParam(
                    url: "https://www.vorce.id/privacy",
                    title: "privacy_policy".tr(context: context),
                  ),
                );
              },
              child: AppWidgets.infoRow(
                iconLabel: SvgPicture.asset(
                  Assets.icons.icLock,
                  width: iconSize,
                  height: iconSize,
                  colorFilter: const ColorFilter.mode(AppColors.darkGray, BlendMode.srcIn),
                ),
                label: "privacy_policy".tr(context: context),
                customWidgetValue: Icon(
                  Icons.open_in_new_outlined,
                  size: trailingIconSize,
                  color: AppColors.darkGray.withAlpha(0x82),
                ),
              ),
            ),
            InkWell(
              onTap: () {
                context.pushNamed(
                  Routes.webview,
                  extra: WebviewParam(
                    url: "https://www.vorce.id/biometric",
                    title: "biometric_clause".tr(context: context),
                  ),
                );
              },
              child: AppWidgets.infoRow(
                iconLabel: SvgPicture.asset(
                  Assets.icons.icBiometric,
                  width: iconSize,
                  height: iconSize,
                  colorFilter: const ColorFilter.mode(AppColors.darkGray, BlendMode.srcIn),
                ),
                label: "biometric_clause".tr(context: context),
                customWidgetValue: Icon(
                  Icons.open_in_new_outlined,
                  size: trailingIconSize,
                  color: AppColors.darkGray.withAlpha(0x82),
                ),
              ),
            ),
            InkWell(
              onTap: () {
                context.pushNamed(
                  Routes.webview,
                  extra: WebviewParam(
                    url: "https://www.vorce.id/terms",
                    title: "terms_of_service".tr(context: context),
                  ),
                );
              },
              child: AppWidgets.infoRow(
                iconLabel: SvgPicture.asset(
                  Assets.icons.icBook,
                  width: iconSize,
                  height: iconSize,
                  colorFilter: const ColorFilter.mode(AppColors.darkGray, BlendMode.srcIn),
                ),
                label: "terms_of_service".tr(context: context),
                customWidgetValue: Icon(
                  Icons.open_in_new_outlined,
                  size: trailingIconSize,
                  color: AppColors.darkGray.withAlpha(0x82),
                ),
              ),
            ),
            InkWell(
              onTap: () {
                context.pushNamed(
                  Routes.webview,
                  extra: WebviewParam(
                    url: "https://www.vorce.id/sop",
                    title: "sop_data_deletion".tr(context: context),
                  ),
                );
              },
              child: AppWidgets.infoRow(
                iconLabel: SvgPicture.asset(
                  Assets.icons.icSop,
                  width: iconSize,
                  height: iconSize,
                  colorFilter: const ColorFilter.mode(AppColors.darkGray, BlendMode.srcIn),
                ),
                label: "sop_data_deletion".tr(context: context),
                customWidgetValue: Icon(
                  Icons.open_in_new_outlined,
                  size: trailingIconSize,
                  color: AppColors.darkGray.withAlpha(0x82),
                ),
              ),
            ),
            InkWell(
              onTap: () {
                context.pushNamed(
                  Routes.webview,
                  extra: WebviewParam(
                    url: "https://www.vorce.id/perangkat-lunak",
                    title: "software".tr(context: context),
                  ),
                );
              },
              child: AppWidgets.infoRow(
                iconLabel: SvgPicture.asset(
                  Assets.icons.icSoftware,
                  width: iconSize,
                  height: iconSize,
                  colorFilter: const ColorFilter.mode(AppColors.darkGray, BlendMode.srcIn),
                ),
                label: "software".tr(context: context),
                customWidgetValue: Icon(
                  Icons.open_in_new_outlined,
                  size: trailingIconSize,
                  color: AppColors.darkGray.withAlpha(0x82),
                ),
              ),
            ),
            InkWell(
              onTap: () {
                context.pushNamed(
                  Routes.webview,
                  extra: WebviewParam(
                    url: "https://www.vorce.id/versi-1.0.0",
                    title: "version".tr(args: [AppVersion.version]),
                  ),
                );
              },
              child: AppWidgets.infoRow(
                iconLabel: const Icon(
                  Icons.smartphone_outlined,
                  size: iconSize,
                  color: AppColors.darkGray,
                ),
                label: "version".tr(args: [AppVersion.version]),
                customWidgetValue: Icon(
                  Icons.open_in_new_outlined,
                  size: trailingIconSize,
                  color: AppColors.darkGray.withAlpha(0x82),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}