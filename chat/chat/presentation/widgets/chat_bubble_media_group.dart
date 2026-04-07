part of '../views/chat.dart';

class _ChatBubbleMediaGroup extends ConsumerWidget {
  final List<types.Message> messages;
  final String author;
  final DateTime sentAt;
  final bool isMe;
  final String? avatarUrl;
  final String? initials;

  const _ChatBubbleMediaGroup({
    super.key,
    required this.messages,
    required this.author,
    required this.sentAt,
    required this.isMe,
    this.avatarUrl,
    this.initials,
  });

  // --- REGEX PATTERNS ---
  static final _urlRegex = RegExp(r'((https?:\/\/)|(www\.))?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)', caseSensitive: false);
  static final _emailRegex = RegExp(r"[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+", caseSensitive: false);
  static final _phoneRegex = RegExp(r'\+?(\d{9,15})', caseSensitive: false);

  // --- ACTION HANDLERS ---
  Future<void> _launchURL(BuildContext context, String url) async {
    final validUrl = url.startsWith('http') ? url : 'https://$url';
    try { await launchUrl(Uri.parse(validUrl), mode: LaunchMode.externalApplication); } catch (_) {}
  }

  Future<void> _launchEmail(BuildContext context, String email) async {
    try { await launchUrl(Uri(scheme: 'mailto', path: email)); } catch (_) {}
  }

  Future<void> _launchPhoneCall(BuildContext context, String phone) async {
    try { await launchUrl(Uri(scheme: 'tel', path: phone)); } catch (_) {}
  }

  Widget _buildRichText(BuildContext context, String text) {
    const Color textColor = Colors.black;

    final defaultStyle = AppTheme.primaryTextStyle.copyWith(color: textColor, fontWeight: FontWeight.w400, fontSize: 14);
    final mentionStyle = defaultStyle.copyWith(color: AppColors.featurePurple, fontWeight: FontWeight.bold);
    final pingStyle = defaultStyle.copyWith(color: Colors.red, fontWeight: FontWeight.w900);
    final actionStyle = defaultStyle.copyWith(color: AppColors.featurePurple, decoration: TextDecoration.underline, decorationColor: AppColors.featurePurple);

    List<TextSpan> spans = [];

    text.splitMapJoin(
      RegExp(r'@\{([^}]+)\}'),
      onMatch: (Match match) {
        final String nameInside = match[1]!;
        final String displayName = "@$nameInside";
        spans.add(TextSpan(text: displayName, style: mentionStyle));
        return '';
      },
      onNonMatch: (String textLevel1) {
        textLevel1.splitMapJoin(
          RegExp(r'PING!!!'),
          onMatch: (Match match) {
            spans.add(TextSpan(text: match.group(0), style: pingStyle));
            return '';
          },
          onNonMatch: (String textLevel2) {
            textLevel2.splitMapJoin(
              _emailRegex,
              onMatch: (Match match) {
                final String email = match.group(0)!;
                spans.add(TextSpan(
                  text: email, style: actionStyle,
                  recognizer: TapGestureRecognizer()..onTap = () => _launchEmail(context, email),
                ));
                return '';
              },
              onNonMatch: (String textLevel3) {
                textLevel3.splitMapJoin(
                  _urlRegex,
                  onMatch: (Match match) {
                    final String url = match.group(0)!;
                    spans.add(TextSpan(
                      text: url, style: actionStyle,
                      recognizer: TapGestureRecognizer()..onTap = () => _launchURL(context, url),
                    ));
                    return '';
                  },
                  onNonMatch: (String textLevel4) {
                    textLevel4.splitMapJoin(
                      _phoneRegex,
                      onMatch: (Match match) {
                        final String phone = match.group(0)!;
                        spans.add(TextSpan(
                          text: phone, style: actionStyle,
                          recognizer: TapGestureRecognizer()..onTap = () => _launchPhoneCall(context, phone),
                        ));
                        return '';
                      },
                      onNonMatch: (String finalSegment) {
                        spans.add(TextSpan(text: finalSegment, style: defaultStyle));
                        return '';
                      },
                    );
                    return '';
                  },
                );
                return '';
              },
            );
            return '';
          },
        );
        return '';
      },
    );

    return RichText(text: TextSpan(children: spans));
  }

  // [MODIFIKASI] Helper untuk menyatukan Title, Caption, dan Lokasi
  // Format: "Title|||Caption|||Address"
  String _combineMetadata(String title, String? caption, String? address) {
    return "$title|||${caption ?? ''}|||${address ?? ''}";
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (messages.isEmpty) return const SizedBox.shrink();

    final isPinned = messages.any((m) => m.metadata?['isPinned'] == true);

    final borderRadius = BorderRadius.only(
      topLeft: isMe ? const Radius.circular(16) : const Radius.circular(0),
      topRight: isMe ? const Radius.circular(0) : const Radius.circular(16),
      bottomLeft: const Radius.circular(16),
      bottomRight: const Radius.circular(16),
    );

    // --- GRID BUILDER ---
    Widget buildContent() {
      int count = messages.length;

      if (count == 1) {
        return _buildSingleItem(context, ref, messages.first);
      }
      else if (count == 2) {
        return Row(
          children: [
            Expanded(child: _buildItem(context, ref, messages[0], height: 150)),
            const SizedBox(width: 10),
            Expanded(child: _buildItem(context, ref, messages[1], height: 150)),
          ],
        );
      } else if (count == 3) {
        return Column(
          children: [
            _buildItem(context, ref, messages[0], height: 150, width: double.infinity),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: _buildItem(context, ref, messages[1], height: 100)),
                const SizedBox(width: 10),
                Expanded(child: _buildItem(context, ref, messages[2], height: 100)),
              ],
            ),
          ],
        );
      } else {
        return Column(
          children: [
            Row(
              children: [
                Expanded(child: _buildItem(context, ref, messages[0], height: 100)),
                const SizedBox(width: 10),
                Expanded(child: _buildItem(context, ref, messages[1], height: 100)),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: _buildItem(context, ref, messages[2], height: 100)),
                const SizedBox(width: 10),
                Expanded(
                  child: count > 4
                      ? _buildMoreItem(context, ref, messages[3], count - 4)
                      : _buildItem(context, ref, messages[3], height: 100),
                ),
              ],
            ),
          ],
        );
      }
    }

    final Widget bubbleContent = Container(
      width: context.width * 0.75,
      // [MODIFIKASI] Padding diperbesar menjadi 10px untuk memberi jarak border ke konten
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: isMe ? const Color(0xFFD3C8FF) : Colors.white,
        border: Border.all(color: AppColors.lightGrey, width: 1),
        borderRadius: borderRadius,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (!isMe)
            Padding(
              padding: const EdgeInsets.only(bottom: 4, left: 0, right: 0, top: 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      author,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTheme.secondaryTextStyle.copyWith(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.featurePurple),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    sentAt.getTime,
                    style: AppTheme.secondaryTextStyle.copyWith(
                        fontSize: 10, color: AppColors.featurePurple),
                  ),
                ],
              ),
            ),
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: buildContent(),
              ),
              if (isPinned)
                Positioned(
                  bottom: 4, right: 4,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 2)]),
                    child: Transform.rotate(angle: 0.5, child: Image.asset('assets/images/pin.png', width: 16, height: 16, fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Icon(Icons.error, size: 16, color: Colors.red))),
                  ),
                ),
            ],
          ),
        ],
      ),
    );

    if (isMe) {
      return Align(
          alignment: Alignment.centerRight,
          child: Padding(
            padding: const EdgeInsets.only(right: 6.0),
            child: bubbleContent,
          ));
    } else {
      final bool isValidUrl = (avatarUrl != null && avatarUrl!.trim().isNotEmpty && avatarUrl!.startsWith('http'));
      return Row(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24, height: 24,
            margin: const EdgeInsets.only(right: 12, top: 0),
            child: CircleAvatar(
              radius: 12,
              backgroundColor: AppColors.featurePurple.withOpacity(0.1),
              backgroundImage: isValidUrl ? NetworkImage(avatarUrl!) : null,
              child: !isValidUrl
                  ? Text(initials ?? '?', style: const TextStyle(color: AppColors.featurePurple, fontWeight: FontWeight.bold, fontSize: 10))
                  : null,
            ),
          ),
          Flexible(child: bubbleContent),
        ],
      );
    }
  }

  // --- HELPERS BUILDER ---

  Widget _buildSingleItem(BuildContext context, WidgetRef ref, types.Message msg) {
    final height = context.height * 0.25;

    final caption = msg.metadata?['caption'] as String?;
    final address = msg.metadata?['address'] as String?; // Ambil lokasi dari metadata
    final hasCaption = caption != null && caption.trim().isNotEmpty;

    // [MODIFIKASI] Pass Title, Caption, dan Address
    final combinedMetadata = _combineMetadata(author, caption, address);

    Widget mediaWidget = const SizedBox.shrink();

    if (msg is types.ImageMessage) {
      final isUploading = msg.metadata?['status'] == 'uploading';
      mediaWidget = GestureDetector(
        onTap: () {
          if (isUploading) return;
          context.pushNamed(
            Routes.imageDetail,
            extra: ParamDetailImage(
              source: msg.uri,
              title: combinedMetadata, // Pass Combined Metadata
              actionWidget: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _MediaDownloadButton(fileUri: msg.uri),
                  const SizedBox(width: 8),
                  _MediaUploadButton(fileUri: msg.uri),
                ],
              ),
            ),
          );
        },
        child: Stack(
          alignment: Alignment.center,
          children: [
            AppWidgets.layoutWithSkeletonizer(
              enabled: isUploading,
              child: msg.uri.startsWith('http')
                  ? AppWidgets.imageNetwork(imageUrl: msg.uri, fit: BoxFit.cover, height: height, width: double.infinity)
                  : AppWidgets.imageLocal(imagePath: msg.uri, fit: BoxFit.cover, height: height, width: double.infinity),
            ),
          ],
        ),
      );
    } else if (msg is types.VideoMessage) {
      final isUploading = msg.metadata?['status'] == 'uploading';
      mediaWidget = GestureDetector(
        onTap: () {
          context.pushNamed(
            Routes.videoDetail,
            extra: ParamDetailVideo(
              source: msg.uri,
              title: combinedMetadata, // Pass Combined Metadata
              actionWidget: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(sentAt.getTime, style: AppTheme.primaryTextStyle.copyWith(color: Colors.white)),
                  const SizedBox(width: 10),
                  _MediaDownloadButton(fileUri: msg.uri),
                  const SizedBox(width: 8),
                  _MediaUploadButton(fileUri: msg.uri),
                ],
              ),
            ),
          );
        },
        child: Stack(
          alignment: Alignment.center,
          children: [
            AppWidgets.layoutWithSkeletonizer(
              enabled: isUploading,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  msg.uri.startsWith('http')
                      ? AppWidgets.videoNetwork(videoUrl: msg.uri, fit: BoxFit.cover, width: double.infinity, height: height, showPlayIcon: false, canPlay: false)
                      : AppWidgets.videoLocal(videoPath: msg.uri, fit: BoxFit.cover, width: double.infinity, height: height, showPlayIcon: false, canPlay: false),

                  // Ikon Play
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(color: Colors.black.withOpacity(0.4), shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
                    child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 32),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    if (hasCaption) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: _buildRichText(context, caption),
          ),
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: mediaWidget,
          ),
        ],
      );
    }

    return mediaWidget;
  }

  Widget _buildItem(BuildContext context, WidgetRef ref, types.Message msg, {required double height, double? width}) {
    final caption = msg.metadata?['caption'] as String?;
    final address = msg.metadata?['address'] as String?;
    final combinedMetadata = _combineMetadata(author, caption, address);

    if (msg is types.ImageMessage) {
      return GestureDetector(
        onTap: () {
          context.pushNamed(
            Routes.imageDetail,
            extra: ParamDetailImage(
              source: msg.uri,
              title: combinedMetadata,
              actionWidget: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _MediaDownloadButton(fileUri: msg.uri),
                  const SizedBox(width: 8),
                  _MediaUploadButton(fileUri: msg.uri),
                ],
              ),
            ),
          );
        },
        child: msg.uri.startsWith('http')
            ? AppWidgets.imageNetwork(imageUrl: msg.uri, fit: BoxFit.cover, height: height, width: width ?? double.infinity)
            : AppWidgets.imageLocal(imagePath: msg.uri, fit: BoxFit.cover, height: height, width: width ?? double.infinity),
      );
    } else if (msg is types.VideoMessage) {
      return GestureDetector(
        onTap: () {
          context.pushNamed(
            Routes.videoDetail,
            extra: ParamDetailVideo(
              source: msg.uri,
              title: combinedMetadata,
              actionWidget: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(sentAt.getTime, style: AppTheme.primaryTextStyle.copyWith(color: Colors.white)),
                  const SizedBox(width: 10),
                  _MediaDownloadButton(fileUri: msg.uri),
                  const SizedBox(width: 8),
                  _MediaUploadButton(fileUri: msg.uri),
                ],
              ),
            ),
          );
        },
        child: Stack(
          alignment: Alignment.center,
          children: [
            msg.uri.startsWith('http')
                ? AppWidgets.videoNetwork(videoUrl: msg.uri, fit: BoxFit.cover, width: width ?? double.infinity, height: height, showPlayIcon: false, canPlay: false)
                : AppWidgets.videoLocal(videoPath: msg.uri, fit: BoxFit.cover, width: width ?? double.infinity, height: height, showPlayIcon: false, canPlay: false),

            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: Colors.black.withOpacity(0.4), shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 1.5)),
              child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 20),
            ),
          ],
        ),
      );
    }
    return SizedBox(height: height, width: width);
  }

  Widget _buildMoreItem(BuildContext context, WidgetRef ref, types.Message msg, int remaining) {
    final caption = msg.metadata?['caption'] as String?;
    final address = msg.metadata?['address'] as String?;
    final combinedMetadata = _combineMetadata(author, caption, address);

    return GestureDetector(
      onTap: () {
        if (msg is types.ImageMessage) {
          context.pushNamed(
            Routes.imageDetail,
            extra: ParamDetailImage(
              source: msg.uri,
              title: combinedMetadata,
              actionWidget: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _MediaDownloadButton(fileUri: msg.uri),
                  const SizedBox(width: 8),
                  _MediaUploadButton(fileUri: msg.uri),
                ],
              ),
            ),
          );
        } else if (msg is types.VideoMessage) {
          context.pushNamed(
            Routes.videoDetail,
            extra: ParamDetailVideo(
              source: msg.uri,
              title: combinedMetadata,
              actionWidget: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(sentAt.getTime, style: AppTheme.primaryTextStyle.copyWith(color: Colors.white)),
                  const SizedBox(width: 10),
                  _MediaDownloadButton(fileUri: msg.uri),
                  const SizedBox(width: 8),
                  _MediaUploadButton(fileUri: msg.uri),
                ],
              ),
            ),
          );
        }
      },
      child: Stack(
        fit: StackFit.expand,
        children: [
          _buildItem(context, ref, msg, height: 100),
          Container(
            color: Colors.black.withOpacity(0.5),
            alignment: Alignment.center,
            child: Text(
              "+$remaining",
              style: GoogleFonts.montserrat(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}

class _MediaUploadButton extends HookConsumerWidget {
  final String fileUri;
  const _MediaUploadButton({required this.fileUri});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoading = useState(false);
    return IconButton.filled(
      onPressed: isLoading.value
          ? null
          : () async {
        if (isLoading.value) return;
        isLoading.value = true;
        try {
          File fileToUpload;
          if (fileUri.toLowerCase().startsWith('http')) {
            AppToast.showToast(msg: "Mengunduh media...");
            try {
              final tempDir = await getTemporaryDirectory();
              final fileName = fileUri.split('/').last.split('?').first;
              final savePath = '${tempDir.path}/$fileName';
              await Dio().download(fileUri, savePath);
              fileToUpload = File(savePath);
            } catch (e) {
              AppToast.showToast(msg: "Gagal mengunduh file");
              isLoading.value = false;
              return;
            }
          } else {
            fileToUpload = File(fileUri);
            if (!fileToUpload.existsSync()) {
              if (fileUri.startsWith('file://')) {
                fileToUpload = File(fileUri.substring(7));
              }
            }
          }
          if (!fileToUpload.existsSync()) {
            AppToast.showToast(msg: "File tidak ditemukan di perangkat");
            isLoading.value = false;
            return;
          }
          AppToast.showToast(msg: "Mengunggah ke Berkas...");
          final result = await ref.read(fileCollectionDatasourceProvider).uploadFileCollection(file: fileToUpload);
          result.fold(
                (error) => AppToast.showToast(msg: "Gagal: ${error.message}"),
                (success) => AppToast.showToast(msg: "Berhasil disimpan ke Berkas"),
          );
        } catch (e) {
          AppToast.showToast(msg: "Terjadi kesalahan: $e");
        } finally {
          isLoading.value = false;
        }
      },
      color: Colors.black.withValues(alpha: 0.25),
      style: IconButton.styleFrom(shape: const CircleBorder(), padding: const EdgeInsets.all(8), backgroundColor: Colors.black.withValues(alpha: 0.25)),
      icon: isLoading.value
          ? const SizedBox(width: 19, height: 19, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : SvgPicture.asset(Assets.icons.icFilesOutline, width: 19, height: 19, colorFilter: const ColorFilter.mode(AppColors.white, BlendMode.srcIn)),
    );
  }
}

class _MediaDownloadButton extends HookConsumerWidget {
  final String fileUri;
  const _MediaDownloadButton({required this.fileUri});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!fileUri.toLowerCase().startsWith('http')) {
      return const SizedBox.shrink(); // Hide if it's already a local file
    }

    final isLoading = useState(false);
    return IconButton.filled(
      onPressed: isLoading.value
          ? null
          : () async {
        if (isLoading.value) return;
        isLoading.value = true;
        try {
          AppToast.showToast(msg: "Mulai mengunduh...");
          final downloadNotifier = ref.read(fileCollectionDownloadFileStateNotifierProvider.notifier);
          final result = await downloadNotifier.downloadFile(url: fileUri, showNotification: false);
          result.fold(
            (error) => AppToast.showToast(msg: "Gagal mengunduh file"),
            (filePath) => AppToast.showToast(msg: "File berhasil diunduh ke perangkat"),
          );
        } catch (e) {
          AppToast.showToast(msg: "Terjadi kesalahan: $e");
        } finally {
          isLoading.value = false;
        }
      },
      color: Colors.black.withValues(alpha: 0.25),
      style: IconButton.styleFrom(shape: const CircleBorder(), padding: const EdgeInsets.all(8), backgroundColor: Colors.black.withValues(alpha: 0.25)),
      icon: isLoading.value
          ? const SizedBox(width: 19, height: 19, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : SvgPicture.asset(Assets.icons.icDownload, width: 19, height: 19, colorFilter: const ColorFilter.mode(AppColors.white, BlendMode.srcIn)),
    );
  }
}