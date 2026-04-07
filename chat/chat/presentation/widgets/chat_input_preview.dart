part of '../views/chat.dart';

class HoraChatLinkPreview extends StatelessWidget {
  final bool isLoading;
  final Map<String, String>? displayData;
  final VoidCallback onCancel;

  const HoraChatLinkPreview({
    super.key,
    required this.isLoading,
    required this.displayData,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final bool showOgPreview = (isLoading || displayData != null);

    if (!showOgPreview || displayData == null) return const SizedBox.shrink();

    return Skeletonizer(
      enabled: isLoading,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Colors.grey.shade200), bottom: BorderSide(color: Colors.grey.shade200)),
        ),
        constraints: const BoxConstraints(maxHeight: 80),
        child: Row(
          children: [
            // Gambar Kecil
            if (!isLoading && displayData!['image'] != null && displayData!['image']!.isNotEmpty)
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: Image.network(
                  displayData!['image']!,
                  width: 60,
                  height: 60,
                  fit: BoxFit.cover,
                  errorBuilder: (ctx, err, stack) => Container(
                    width: 60, height: 60,
                    color: Colors.grey.shade100,
                    child: const Icon(Icons.link, size: 20, color: Colors.grey),
                  ),
                ),
              )
            else
              Container(
                width: 60, height: 60,
                decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(6)),
                child: isLoading ? null : const Icon(Icons.link, size: 24, color: Colors.grey),
              ),

            const SizedBox(width: 12),

            // Teks Judul & Deskripsi
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    displayData!['title'] ?? 'Link',
                    style: AppTheme.primaryTextStyle.copyWith(fontWeight: FontWeight.bold, fontSize: 13),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    displayData!['description'] ?? '',
                    style: AppTheme.secondaryTextStyle.copyWith(fontSize: 11, color: Colors.grey),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

            // Tombol X untuk menutup preview (Jangan di-skeleton)
            Skeleton.ignore(
              child: IconButton(
                icon: const Icon(Icons.close, size: 20, color: Colors.black54),
                onPressed: onCancel,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
              ),
            ),
          ],
        ),
      ),
    );
  }
}