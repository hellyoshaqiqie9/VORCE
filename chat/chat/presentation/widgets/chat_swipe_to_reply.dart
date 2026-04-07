part of '../views/chat.dart';

class SwipeToReply extends HookWidget {
  final Widget child;
  final VoidCallback onReply;
  final Color? highlightColor; // [BARU] Menangkap warna highlight dari parent

  const SwipeToReply({
    super.key,
    required this.child,
    required this.onReply,
    this.highlightColor, // [BARU]
  });

  @override
  Widget build(BuildContext context) {
    final dragOffset = useState(0.0);
    final animController = useAnimationController(
      duration: const Duration(milliseconds: 200),
    );
    final dragStartPos = useRef(0.0);

    return GestureDetector(
      onHorizontalDragUpdate: (details) {
        double newOffset = dragOffset.value + details.primaryDelta!;
        if (newOffset > 60) newOffset = 60;
        if (newOffset < 0) newOffset = 0;
        dragOffset.value = newOffset;
      },
      onHorizontalDragEnd: (details) {
        if (dragOffset.value > 30) {
          onReply();
        }
        dragStartPos.value = dragOffset.value;
        animController.reset();
        animController.forward();
      },
      child: AnimatedBuilder(
        animation: animController,
        builder: (context, child) {
          double currentPos = dragOffset.value;

          if (animController.isAnimating) {
            currentPos = dragStartPos.value * (1.0 - animController.value);
            if (animController.value == 1.0) {
              dragOffset.value = 0;
            }
          } else if (animController.isCompleted) {
            currentPos = 0;
          }

          // --- LOGIKA ANTI-CLIPPING (SOLUSI AVATAR TERPOTONG) ---
          Widget content = this.child;

          // 1. Safety Padding (Hanya 1px)
          // Ini menggeser konten (termasuk avatar) 1px ke kanan secara internal.
          // Ini mencegah avatar yang berada di posisi (0,0) terpotong oleh
          // batas layer rendering (hard edge) dari ColorFiltered/Stack.
          content = Padding(
            padding: const EdgeInsets.only(left: 1.0),
            child: content,
          );

          // 2. Terapkan Highlight di sini
          // Kita membungkus konten yang SUDAH dipadding dengan ColorFiltered.
          // Dengan begini, layer highlight "lebih besar" dari kontennya,
          // sehingga avatar aman dari potongan tepi.
          if (highlightColor != null && highlightColor != Colors.transparent) {
            content = ColorFiltered(
              colorFilter: ColorFilter.mode(highlightColor!, BlendMode.srcATop),
              child: content,
            );
          }

          return Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.centerLeft,
            children: [
              // Icon Reply Background
              Positioned(
                left: 10,
                child: Opacity(
                  opacity: (currentPos / 60).clamp(0.0, 1.0),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)
                        ]
                    ),
                    child: SvgPicture.asset(
                      Assets.icons.icArrowReply,
                      width: 18,
                      height: 14,
                      colorFilter: const ColorFilter.mode(AppColors.featurePurple, BlendMode.srcIn),
                    ),
                  ),
                ),
              ),

              // Chat Bubble (Moved)
              Transform.translate(
                offset: Offset(currentPos, 0),
                child: content, // Gunakan konten yang sudah aman dari clipping
              ),
            ],
          );
        },
      ),
    );
  }
}