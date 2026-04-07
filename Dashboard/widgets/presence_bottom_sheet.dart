part of '../views/presence.dart';

class _PresenceBottomSheet extends StatelessWidget {
  const _PresenceBottomSheet({super.key, required this.label, required this.data});

  final String label;
  final OnCaptureData data;

  @override
  Widget build(BuildContext context) {
    return AppWidgets.bottomSheet(
      title: 'presence.details'.tr(),
      customButton: AppWidgets.primaryButton(
        width: double.infinity,
        onTap: () {
          context.pop();
        },
        text: "back".tr(context: context),
        backgroundColor: AppColors.lightGrey,
        foregroundColor: AppColors.darkGray,
      ),
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          2.margin,
          Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.montserrat(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          16.margin,
          InkWell(
            onTap: () {
              _showImageOverlay(
                  context,
                  data.url ??
                      "https://images.unsplash.com/photo-1730642215052-71d2185fc0c6?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
            },
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              // child: Image.file(
              //   File(data.file!.path),
              //   fit: BoxFit.cover,
              //   width: double.infinity,
              //   height: context.height * 0.5,
              // ),
              child: AppWidgets.imageNetwork(
                imageUrl: data.url ??
                    "https://images.unsplash.com/photo-1730642215052-71d2185fc0c6?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                fit: BoxFit.cover,
                width: double.infinity,
                height: context.height * 0.5,
              ),
            ),
          ),
          16.margin,
          // AppWidgets.infoRowWithContainer(
          //   label: data.address != null && data.address.toString().length > 50 ? data.address!.substring(0, 50) : "Jl. Mawar No. 11 Kel...",
          //   value: data.dateTime.getTime,
          // ),
          // 16.margin
        ],
      ),
    );
  }

  void _showImageOverlay(BuildContext context, String imageUrl) {
    showDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0.9),
      builder: (BuildContext context) {
        return Dialog.fullscreen(
          backgroundColor: Colors.transparent,
          child: Stack(
            children: [
              // Dismiss on tap anywhere
              GestureDetector(
                onTap: () => Navigator.of(context).pop(),
                child: Container(
                  width: double.infinity,
                  height: double.infinity,
                  color: Colors.transparent,
                ),
              ),
              // Center the image
              Center(
                child: InteractiveViewer(
                  child: AppWidgets.imageNetwork(
                    imageUrl: imageUrl,
                    fit: BoxFit.contain,
                    width: double.infinity,
                    height: double.infinity,
                  ),
                ),
              ),
              // Close button
              Positioned(
                top: 60,
                right: 20,
                child: IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: Icon(
                    Icons.close,
                    color: Colors.white,
                    size: 30,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
