part of '../views/chat.dart';

class _ChatBubbleSpecial extends HookConsumerWidget {
  const _ChatBubbleSpecial({
    super.key,
    required this.message,
    required this.author,
    required this.sentAt,
    this.isMe = false,
    this.onAvatarTap,
    this.avatarUrl,
    this.initials,
  });

  final types.Message message; // Bisa FileMessage atau CustomMessage
  final String author;
  final DateTime sentAt;
  final bool isMe;
  final VoidCallback? onAvatarTap;
  final String? avatarUrl;
  final String? initials;

  // --- HELPER UNTUK FILE ---
  String _formatBytes(num bytes, {int decimals = 2}) {
    if (bytes <= 0) return "0 B";
    const suffixes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    var i = (math.log(bytes) / math.log(1024)).floor();
    return '${(bytes / math.pow(1024, i)).toStringAsFixed(decimals)} ${suffixes[i]}';
  }

  IconData _getFileIcon(String? mimeType) {
    if (mimeType == null) return Icons.insert_drive_file;
    final lowerMime = mimeType.toLowerCase();
    if (lowerMime.contains('pdf')) return Icons.picture_as_pdf;
    if (lowerMime.contains('word') || lowerMime.contains('doc')) return Icons.description;
    if (lowerMime.contains('sheet') || lowerMime.contains('xls') || lowerMime.contains('csv')) return Icons.table_chart;
    if (lowerMime.contains('presentation') || lowerMime.contains('ppt')) return Icons.slideshow;
    if (lowerMime.contains('image')) return Icons.image;
    if (lowerMime.contains('video')) return Icons.movie;
    if (lowerMime.contains('audio')) return Icons.audiotrack;
    if (lowerMime.contains('text')) return Icons.text_snippet;
    return Icons.insert_drive_file;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // 1. Identifikasi Tipe Pesan & Data
    String subtype = '';
    Map<String, dynamic> metadata = message.metadata ?? {};

    if (message is types.CustomMessage) {
      subtype = metadata['subtype'] ?? '';
    } else if (message is types.FileMessage) {
      subtype = 'file';
    }

    // 2. Variabel Konten (Default)
    String title = "Pesan Spesial";
    String? subtitle; // Untuk ukuran file atau nama kontak
    Widget? iconWidget;
    VoidCallback? onTapAction;
    bool isFileStyle = false; // File punya style ikon khusus (kotak putih)

    // 3. Logika Per Tipe
    if (subtype == 'file' && message is types.FileMessage) {
      final msg = message as types.FileMessage;
      isFileStyle = true;
      title = msg.name;
      subtitle = _formatBytes(msg.size);
      iconWidget = Icon(_getFileIcon(msg.mimeType), color: AppColors.featurePurple, size: 24);
      onTapAction = () async {
        final url = msg.uri;
        if (url.startsWith('http')) {
          AppToast.showToast(msg: "Mulai mengunduh...");
          final downloadNotifier = ref.read(fileCollectionDownloadFileStateNotifierProvider.notifier);
          final result = await downloadNotifier.downloadFile(url: url, showNotification: false);
          result.fold(
            (error) => AppToast.showToast(msg: "Gagal mengunduh file"),
            (filePath) => AppToast.showToast(msg: "File berhasil diunduh ke perangkat"),
          );
        } else {
          AppToast.showToast(msg: "File lokal tidak perlu diunduh");
        }
      };
    }
    else if (subtype == 'task') {
      title = "Membagikan tugas";
      iconWidget = const Icon(Icons.check_circle_outline_rounded, color: Colors.white, size: 16);
      onTapAction = () => context.pushNamed(Routes.task);
    }
    else if (subtype == 'leave_request') {
      title = "Membagikan izin";
      iconWidget = SizedBox(
        width: 18, height: 18,
        child: SvgPicture.asset(Assets.icons.icWorkHistoryOutlined, colorFilter: const ColorFilter.mode(Colors.white, BlendMode.srcIn)),
      );
      onTapAction = () => context.pushNamed(Routes.leaveRequest);
    }
    else if (subtype == 'reimbursement') {
      title = "Membagikan Reimbursement";
      iconWidget = const Icon(Icons.receipt_long_rounded, color: Colors.white, size: 16);
      onTapAction = () => context.pushNamed(Routes.reimbursement);
    }
    else if (subtype == 'recording') {
      final duration = metadata['duration'] ?? '00:00';
      title = "Rekaman Suara ($duration)";
      iconWidget = SizedBox(
        width: 20, height: 20,
        child: SvgPicture.asset(Assets.icons.icRecorder, colorFilter: const ColorFilter.mode(Colors.white, BlendMode.srcIn)),
      );
      onTapAction = () {
        final audioUrl = metadata['audioUrl'] ?? '';
        final amplitudesStr = metadata['amplitudes'] as String? ?? '';
        List<double> amplitudes = [];
        if (amplitudesStr.isNotEmpty) {
          try {
            amplitudes = amplitudesStr.split(',').map((e) => double.tryParse(e) ?? 0.0).toList();
          } catch (e) { debugPrint("Err amp: $e"); }
        }
        showModalBottomSheet(
          context: context, backgroundColor: Colors.transparent, isScrollControlled: true,
          builder: (context) => RecorderPlaybackSheet(audioUrl: audioUrl, title: "Rekaman Suara", amplitudes: amplitudes),
        );
      };
    }
    else if (subtype == 'contact_share') {
      title = "Membagikan kontak";
      final contactName = metadata['contactName'] ?? 'Kontak';
      subtitle = contactName; // Nama kontak jadi subtitle/highlight
      iconWidget = const Icon(Icons.person_pin_circle_rounded, color: Colors.white, size: 20);

      onTapAction = () {
        final shareToken = metadata['shareToken'] ?? '';
        if (shareToken.isEmpty) { AppToast.showToast(msg: "Token share tidak valid"); return; }
        AppBottomSheet.show(context, child: _buildContactBottomSheet(context, ref, contactName, shareToken));
      };
    }
    else if (subtype == 'profile_share') {
      title = "Membagikan Profil";
      iconWidget = const Icon(Icons.person_rounded, color: Colors.white, size: 20);

      onTapAction = () {
        // Logika Pencarian Staff (Verbatim dari chat_bubble_profile.dart)
        final staffState = ref.read(staffStateNotifierProvider);
        final dynamic rawData = AppStateX(staffState).maybeWhen(
            success: (data) => (data is List) ? data : (data is Map<String, dynamic> && data['data'] is List) ? data['data'] : [],
            orElse: () => []);
        final List<dynamic> staffList = rawData is List ? rawData : [];

        final authorId = message.author.id;
        final authorEmail = message.author.metadata?['email']?.toString();
        final authorName = author;
        Staff? foundStaff;

        for (var item in staffList) {
          Staff? currentStaff;
          if (item is Staff) currentStaff = item;
          else if (item is Map<String, dynamic>) { try { currentStaff = Staff.fromJson(item); } catch (_) { continue; } }

          if (currentStaff == null) continue;
          if (currentStaff.idkaryawan != null && currentStaff.idkaryawan == authorId) { foundStaff = currentStaff; break; }
          if (authorEmail != null && currentStaff.alamatEmail != null && currentStaff.alamatEmail!.trim().toLowerCase() == authorEmail.trim().toLowerCase()) { foundStaff = currentStaff; break; }
          if (currentStaff.id.toString() == authorId) { foundStaff = currentStaff; break; }
          if (item is Map<String, dynamic>) {
            final rawUid = item['uid']?.toString() ?? item['userId']?.toString();
            if (rawUid != null && rawUid == authorId) { foundStaff = currentStaff; break; }
          }
          if (currentStaff.namaKaryawan != null && authorName.isNotEmpty && currentStaff.namaKaryawan!.trim().toLowerCase() == authorName.trim().toLowerCase()) {
            if (foundStaff == null) foundStaff = currentStaff;
          }
        }

        if (foundStaff != null) context.pushNamed(Routes.staffProfileDetail, extra: foundStaff);
        else AppToast.showToast(msg: "Profil data karyawan tidak ditemukan");
      };
    }

    final isPinned = metadata['isPinned'] == true;

    // 4. Styling Wrapper (Konsisten dengan Chat Bubble Text: Radius 10, TopRight 0 if Me)
    final borderRadius = BorderRadius.only(
      topLeft: Radius.circular(isMe ? 10 : 0),
      topRight: Radius.circular(isMe ? 0 : 10),
      bottomLeft: const Radius.circular(10),
      bottomRight: const Radius.circular(10),
    );

    final innerBorderRadius = BorderRadius.circular(12);

    final bubbleWidget = Container(
      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isMe ? const Color(0xFFD3C8FF) : Colors.white,
        border: Border.all(color: AppColors.lightGrey, width: 1),
        borderRadius: borderRadius,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Nama & Jam
          if (!isMe)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(author,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTheme.secondaryTextStyle.copyWith(fontWeight: FontWeight.w600, color: AppColors.featurePurple)),
                  ),
                  const SizedBox(width: 8),
                  Text(sentAt.getTime, style: AppTheme.secondaryTextStyle.copyWith(fontSize: 10, color: AppColors.featurePurple)),
                ],
              ),
            ),

          // Inner Content (Kotak Ungu)
          Stack(
            children: [
              Material(
                color: AppColors.featurePurple,
                borderRadius: innerBorderRadius,
                clipBehavior: Clip.antiAlias, // Haluskan sudut
                child: InkWell(
                  onTap: onTapAction,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    child: Row(
                      children: [
                        // Icon Area
                        if (isFileStyle) ...[
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                            child: iconWidget,
                          ),
                          const SizedBox(width: 12),
                        ] else ...[
                          if (iconWidget != null) iconWidget!,
                          const SizedBox(width: 12),
                        ],

                        // Text Area
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                title,
                                style: AppTheme.primaryTextStyle.copyWith(
                                  fontWeight: subtype == 'contact_share' ? FontWeight.w400 : FontWeight.w600,
                                  color: subtype == 'contact_share' ? Colors.white.withOpacity(0.9) : Colors.white,
                                  fontSize: subtype == 'contact_share' ? 12 : 14,
                                ),
                                maxLines: 1, overflow: TextOverflow.ellipsis,
                              ),
                              if (subtitle != null) ...[
                                if (subtype != 'contact_share') const SizedBox(height: 4),
                                Text(
                                  subtitle,
                                  style: AppTheme.primaryTextStyle.copyWith(
                                    fontSize: subtype == 'contact_share' ? 14 : 12,
                                    fontWeight: subtype == 'contact_share' ? FontWeight.w800 : FontWeight.normal,
                                    color: subtype == 'contact_share' ? Colors.white : Colors.white70,
                                  ),
                                  maxLines: 1, overflow: TextOverflow.ellipsis,
                                ),
                              ]
                            ],
                          ),
                        ),

                        // Arrow Icon (Kecuali Recording pake Play)
                        if (subtype == 'recording')
                          const Icon(Icons.play_circle_fill_rounded, color: Colors.white, size: 24)
                        else
                          const Icon(Icons.keyboard_arrow_right_rounded, color: Colors.white, size: 24),
                      ],
                    ),
                  ),
                ),
              ),
              if (isPinned)
                Positioned(
                  bottom: 4,
                  right: 4,
                  child: Transform.rotate(angle: 0.5, child: Image.asset('assets/images/pin.png', width: 16, height: 16, fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Icon(Icons.error, size: 16, color: Colors.red))),
                ),
            ],
          ),
        ],
      ),
    );

    // Wrapper Align + Padding (Sama seperti ChatBubbleText)
    if (isMe) {
      return Align(
        alignment: Alignment.centerRight,
        child: Padding(
          padding: const EdgeInsets.only(right: 6.0),
          child: bubbleWidget,
        ),
      );
    } else {
      final bool isValidUrl = (avatarUrl != null &&
          avatarUrl!.trim().isNotEmpty &&
          (avatarUrl!.startsWith('http') || avatarUrl!.startsWith('https')));

      return Row(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: onAvatarTap,
            child: Container(
              width: 24,
              height: 24,
              margin: const EdgeInsets.only(right: 10, top: 0),
              child: CircleAvatar(
                radius: 12,
                backgroundColor: AppColors.featurePurple.withOpacity(0.1),
                backgroundImage: isValidUrl ? NetworkImage(avatarUrl!) : null,
                child: !isValidUrl
                    ? Text(initials ?? '?',
                    style: const TextStyle(
                        color: AppColors.featurePurple,
                        fontWeight: FontWeight.bold,
                        fontSize: 10))
                    : null,
              ),
            ),
          ),
          Flexible(child: bubbleWidget),
        ],
      );
    }
  }

  // Widget BottomSheet untuk Kontak
  Widget _buildContactBottomSheet(BuildContext context, WidgetRef ref, String contactName, String shareToken) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text("Tambahkan Kontak?", style: AppTheme.primaryTextStyle.copyWith(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 16),
          Text("Apakah Anda ingin menambahkan $contactName ke daftar kontak Anda?", textAlign: TextAlign.center, style: AppTheme.secondaryTextStyle.copyWith(fontSize: 14)),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.featurePurple, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0),
              onPressed: () async {
                try {
                  Navigator.pop(context);
                  AppDialog.showLoading(context);
                  final result = await ref.read(contactDeleteStateNotifierProvider.notifier).claimShareContact(shareToken: shareToken);
                  if (context.mounted) AppDialog.closeLoading(context);
                  result.fold((failure) { AppToast.showToast(msg: failure.message ?? "Gagal mengklaim kontak"); }, (success) { AppToast.showToast(msg: "Kontak berhasil ditambahkan"); });
                } catch (e) {
                  if (context.mounted) AppDialog.closeLoading(context);
                }
              },
              child: Text("Ya, Tambahkan", style: AppTheme.primaryTextStyle.copyWith(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(onPressed: () => Navigator.pop(context), child: Text("Batal", style: AppTheme.secondaryTextStyle.copyWith(color: Colors.grey))),
        ],
      ),
    );
  }
}