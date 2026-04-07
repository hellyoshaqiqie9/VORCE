part of '../views/chat.dart';

class TypingBubble extends StatelessWidget {
  final String name;
  final String? avatarUrl; // [BARU] Tambah parameter avatarUrl

  const TypingBubble({
    super.key,
    required this.name,
    this.avatarUrl,
  });

  @override
  Widget build(BuildContext context) {
    // Validasi URL
    final bool hasValidAvatar = avatarUrl != null &&
        avatarUrl!.isNotEmpty &&
        avatarUrl!.startsWith('http');

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Container(
            width: 24,
            height: 24,
            margin: const EdgeInsets.only(left: 0, right: 8),
            child: CircleAvatar(
              radius: 12,
              backgroundColor: AppColors.featurePurple.withOpacity(0.1),
              // [FIX] Tampilkan gambar jika ada
              backgroundImage: hasValidAvatar ? NetworkImage(avatarUrl!) : null,
              child: !hasValidAvatar
                  ? Text(
                name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: const TextStyle(
                  color: AppColors.featurePurple,
                  fontWeight: FontWeight.bold,
                  fontSize: 10,
                ),
              )
                  : null,
            ),
          ),
          Container(
            height: 38,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: AppColors.lightGrey, width: 1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
                bottomRight: Radius.circular(16),
                bottomLeft: Radius.circular(0),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const TypingDots(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class TypingDots extends HookWidget {
  const TypingDots({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = useAnimationController(
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    return SizedBox(
      width: 24,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: List.generate(3, (index) {
          return AnimatedBuilder(
            animation: controller,
            builder: (context, child) {
              final double start = index * 0.2;
              final double end = start + 0.4;
              final double value = controller.value;

              double opacity = 0.3;
              if (value >= start && value <= end) {
                // Efek sine wave simple
                opacity = 0.3 + 0.7 * math.sin(((value - start) / 0.4) * math.pi);
              }

              return Container(
                width: 5,
                height: 5,
                decoration: BoxDecoration(
                  color: AppColors.featurePurple.withOpacity(opacity),
                  shape: BoxShape.circle,
                ),
              );
            },
          );
        }),
      ),
    );
  }
}