part of '../views/chat.dart';

class ChatAttachmentSheet extends StatelessWidget {
  final VoidCallback onCamera;
  final VoidCallback onMedia;
  final VoidCallback onDocument;
  final VoidCallback onVoice;

  const ChatAttachmentSheet({
    super.key,
    required this.onCamera,
    required this.onMedia,
    required this.onDocument,
    required this.onVoice,
  });

  Widget _buildAttachmentItem({
    required String title,
    required Widget icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 44,
            height: 44,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFF2EFFF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(child: icon),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: AppTheme.secondaryTextStyle.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.darkGray,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      child: GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        mainAxisSpacing: 66,
        crossAxisSpacing: 16,
        childAspectRatio: 2.0,
        children: [
          _buildAttachmentItem(
            title: "Kamera GPS",
            icon: SvgPicture.asset(
              Assets.icons.icLocalSee,
              width: 20,
              height: 20,
              colorFilter: const ColorFilter.mode(AppColors.featurePurple, BlendMode.srcIn),
            ),
            onTap: onCamera,
          ),
          _buildAttachmentItem(
            title: "Media",
            icon: SvgPicture.asset(
              Assets.icons.icPicture,
              width: 18,
              height: 18,
              colorFilter: const ColorFilter.mode(AppColors.featurePurple, BlendMode.srcIn),
            ),
            onTap: onMedia,
          ),
          _buildAttachmentItem(
            title: "Dokumen",
            icon: SvgPicture.asset(
              Assets.icons.icMedia,
              width: 18,
              height: 18,
              colorFilter: const ColorFilter.mode(AppColors.featurePurple, BlendMode.srcIn),
            ),
            onTap: onDocument,
          ),
          _buildAttachmentItem(
            title: "Rekam",
            icon: SvgPicture.asset(
              Assets.icons.icMics,
              width: 14,
              height: 19,
              colorFilter: const ColorFilter.mode(AppColors.featurePurple, BlendMode.srcIn),
            ),
            onTap: onVoice,
          ),
        ],
      ),
    );
  }
}