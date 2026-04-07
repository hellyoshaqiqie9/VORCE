part of '../views/chat.dart';

class ChatPinHeader extends StatelessWidget {
  final int pinCount;
  final bool isPinnedViewMode;
  final VoidCallback onTap;

  const ChatPinHeader({
    super.key,
    required this.pinCount,
    required this.isPinnedViewMode,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (pinCount == 0) return const SizedBox.shrink();

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isPinnedViewMode ? const Color(0xFFF2F2F7) : Colors.white,
          border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              offset: const Offset(0, 2),
              blurRadius: 2,
            )
          ],
        ),
        child: Row(
          children: [
            Image.asset(
              "assets/images/pin.png",
              width: 16,
              height: 16,
            ),
            const SizedBox(width: 12),
            Text(
              "Pin",
              style: AppTheme.primaryTextStyle.copyWith(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: Colors.black,
              ),
            ),
            const Spacer(),
            Text(
              "$pinCount",
              style: AppTheme.primaryTextStyle.copyWith(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: Colors.grey,
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              isPinnedViewMode ? Icons.close : Icons.keyboard_arrow_right,
              color: Colors.black,
              size: 24,
            ),
          ],
        ),
      ),
    );
  }
}

class ChatScrollToBottomButton extends StatelessWidget {
  final bool isVisible;
  final int unreadCount;
  final VoidCallback onTap;

  const ChatScrollToBottomButton({
    super.key,
    required this.isVisible,
    required this.unreadCount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (!isVisible) return const SizedBox.shrink();

    return Positioned(
      bottom: 80,
      left: 0,
      right: 0,
      child: Center(
        child: GestureDetector(
          onTap: onTap,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: Colors.black,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.grey.shade300),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    )
                  ],
                ),
                alignment: Alignment.center,
                child: SvgPicture.asset(
                  Assets.icons.icArrowDown,
                  width: 14,
                  height: 14,
                  colorFilter: const ColorFilter.mode(Colors.white, BlendMode.srcIn),
                ),
              ),
              // [MODIFIKASI] Hanya tampilkan Dot Merah (tanpa teks) jika ada pesan baru
              if (unreadCount > 0)
                Positioned(
                  top: 0,
                  right: 0,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 1.5),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}