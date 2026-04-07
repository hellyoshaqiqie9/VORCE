part of '../views/chat.dart';

class HoraChatMentionList extends StatelessWidget {
  final List<dynamic> filteredStaff;
  final Function(String) onMentionSelected;
  final Function(dynamic) getDisplayName;
  final Function(dynamic) getAvatarUrl;

  const HoraChatMentionList({
    super.key,
    required this.filteredStaff,
    required this.onMentionSelected,
    required this.getDisplayName,
    required this.getAvatarUrl,
  });

  @override
  Widget build(BuildContext context) {
    // [MODIFIKASI] Menghapus Material elevation dan shadow
    return Material(
      elevation: 0, // Flat (Tidak ada bayangan dari material)
      color: Colors.transparent,
      child: Container(
        // [MODIFIKASI] Width jadi 100% layar (Full width dari kiri ke kanan)
        width: MediaQuery.of(context).size.width,
        height: 60,
        decoration: BoxDecoration(
          color: Colors.white, // Putih Polos
          // [MODIFIKASI] Radius hanya di atas agar terlihat menyatu dengan input di bawahnya
          borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
          // [MODIFIKASI] Border halus hanya di atas, tanpa border samping karena sudah full width
          border: Border(
            top: BorderSide(color: Colors.grey.shade200),
            bottom: BorderSide.none, // Tidak ada border bawah
          ),
        ),
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          // [MODIFIKASI] Padding disesuaikan agar konten tidak terlalu mepet pinggir layar
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          itemCount: filteredStaff.length,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (ctx, index) {
            final staff = filteredStaff[index];
            final displayName = getDisplayName(staff);
            final avatarUrl = getAvatarUrl(staff);
            final bool hasAvatar = avatarUrl != null && avatarUrl.isNotEmpty;

            return GestureDetector(
              onTap: () => onMentionSelected(displayName),
              child: Container(
                width: 40,
                height: 40,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                ),
                child: CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.featurePurple.withOpacity(0.1),
                  backgroundImage: hasAvatar ? NetworkImage(avatarUrl) : null,
                  child: !hasAvatar
                      ? Text(
                    displayName.isNotEmpty ? displayName[0].toUpperCase() : '?',
                    style: const TextStyle(
                      color: AppColors.featurePurple,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  )
                      : null,
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}