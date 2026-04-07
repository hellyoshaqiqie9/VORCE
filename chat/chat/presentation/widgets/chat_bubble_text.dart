part of '../views/chat.dart';

// [ADDED] Global Cache untuk menyimpan data Open Graph (Title, Desc, Image)
// Agar tidak reload saat di-scroll
final Map<String, Map<String, String>> _ogCache = {};

class _ChatBubbleText extends HookConsumerWidget {
  const _ChatBubbleText({
    super.key,
    required this.textSearch,
    required this.text,
    required this.author,
    required this.sentAt,
    this.isMe = false,
    this.metadata,
    this.replyAuthorResolved,
    this.replyTimeResolved,
    this.onReplyTap,
    this.onAvatarTap,
    this.avatarUrl,
    this.initials,
  });

  final String textSearch;
  final String text;
  final String author;
  final DateTime sentAt;
  final bool isMe;
  final Map<String, dynamic>? metadata;
  final String? replyAuthorResolved;
  final String? replyTimeResolved;
  final Function(String)? onReplyTap;
  final VoidCallback? onAvatarTap;
  final String? avatarUrl;
  final String? initials;

  // --- REGEX PATTERNS ---

  // 1. URL (Support domain telanjang google.id, facebook.com)
  static final _urlRegex = RegExp(
    r'((https?:\/\/)|(www\.))?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)',
    caseSensitive: false,
  );

  // 2. Email Address
  static final _emailRegex = RegExp(
    r"[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+",
    caseSensitive: false,
  );

  // 3. Phone Number (Minimal 9 digit, support +62, 08, dll)
  static final _phoneRegex = RegExp(
    r'\+?(\d{9,15})',
    caseSensitive: false,
  );

  // --- ACTION HANDLERS (Direct Launch Only) ---

  Future<void> _launchURL(BuildContext context, String url) async {
    final validUrl = url.startsWith('http') ? url : 'https://$url';
    final uri = Uri.parse(validUrl);
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tidak dapat membuka link')));
    }
  }

  Future<void> _launchEmail(BuildContext context, String email) async {
    final uri = Uri(scheme: 'mailto', path: email);
    try {
      await launchUrl(uri);
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tidak dapat membuka email')));
    }
  }

  Future<void> _launchPhoneCall(BuildContext context, String phone) async {
    final uri = Uri(scheme: 'tel', path: phone);
    try {
      await launchUrl(uri);
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tidak dapat melakukan panggilan')));
    }
  }

  // Menggunakan RichText (Bukan SelectableText) agar tidak ada zoom/magnifier sistem
  Widget _buildRichText(BuildContext context, String text, String query) {
    // Style dasar
    final defaultStyle = AppTheme.primaryTextStyle.copyWith(
        color: Colors.black, fontWeight: FontWeight.w600);

    // Style untuk highlight pencarian (Background Kuning)
    final highlightStyle = defaultStyle.copyWith(backgroundColor: Colors.yellow);

    // Style untuk Mention (Ungu)
    final mentionStyle = defaultStyle.copyWith(
        color: AppColors.featurePurple, fontWeight: FontWeight.bold);

    // Style untuk PING!!! (Merah & Extra Bold)
    final pingStyle = defaultStyle.copyWith(
        color: Colors.red, fontWeight: FontWeight.w900);

    // Style untuk Link/Action (Ungu & Garis Bawah)
    final actionStyle = defaultStyle.copyWith(
        color: AppColors.featurePurple, decoration: TextDecoration.underline);

    List<TextSpan> spans = [];
    final lowerQuery = query.toLowerCase();

    // LEVEL 1: Split Mention @{...}
    text.splitMapJoin(
      RegExp(r'@\{([^}]+)\}'),
      onMatch: (Match match) {
        final String nameInside = match[1]!;
        final String displayName = nameInside; // removed @ symbol
        if (query.isNotEmpty && displayName.toLowerCase().contains(lowerQuery)) {
          spans.add(TextSpan(text: displayName, style: mentionStyle.copyWith(backgroundColor: Colors.yellow)));
        } else {
          spans.add(TextSpan(text: displayName, style: mentionStyle));
        }
        return '';
      },
      onNonMatch: (String textLevel1) {
        // LEVEL 2: Split PING!!!
        textLevel1.splitMapJoin(
          RegExp(r'PING!!!'),
          onMatch: (Match match) {
            spans.add(TextSpan(text: match.group(0), style: pingStyle));
            return '';
          },
          onNonMatch: (String textLevel2) {
            // LEVEL 3: Split Email (Check Email SEBELUM URL)
            textLevel2.splitMapJoin(
              _emailRegex,
              onMatch: (Match match) {
                final String email = match.group(0)!;
                spans.add(TextSpan(
                  text: email,
                  style: actionStyle,
                  recognizer: TapGestureRecognizer()..onTap = () => _launchEmail(context, email),
                ));
                return '';
              },
              onNonMatch: (String textLevel3) {
                // LEVEL 4: Split URL
                textLevel3.splitMapJoin(
                  _urlRegex,
                  onMatch: (Match match) {
                    final String url = match.group(0)!;
                    spans.add(TextSpan(
                      text: url,
                      style: actionStyle,
                      recognizer: TapGestureRecognizer()..onTap = () => _launchURL(context, url),
                    ));
                    return '';
                  },
                  onNonMatch: (String textLevel4) {
                    // LEVEL 5: Split Phone Numbers
                    textLevel4.splitMapJoin(
                      _phoneRegex,
                      onMatch: (Match match) {
                        final String phone = match.group(0)!;
                        spans.add(TextSpan(
                          text: phone,
                          style: actionStyle,
                          // Langsung panggil telepon, tanpa menu WA/Dialog
                          recognizer: TapGestureRecognizer()..onTap = () => _launchPhoneCall(context, phone),
                        ));
                        return '';
                      },
                      onNonMatch: (String finalSegment) {
                        // LEVEL 6: Search Highlight (Final)
                        if (query.isEmpty) {
                          spans.add(TextSpan(text: finalSegment, style: defaultStyle));
                        } else {
                          final lowerText = finalSegment.toLowerCase();
                          int start = 0;
                          while (true) {
                            final index = lowerText.indexOf(lowerQuery, start);
                            if (index < 0) {
                              spans.add(TextSpan(text: finalSegment.substring(start), style: defaultStyle));
                              break;
                            }
                            if (index > start) {
                              spans.add(TextSpan(text: finalSegment.substring(start, index), style: defaultStyle));
                            }
                            spans.add(TextSpan(
                              text: finalSegment.substring(index, index + query.length),
                              style: highlightStyle,
                            ));
                            start = index + query.length;
                          }
                        }
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

  Widget _buildReplyWidget(Map<String, dynamic> replyData) {
    final String replyAuthor = replyAuthorResolved ?? replyData['authorName'] ?? 'Unknown';
    final String replyId = replyData['id'] ?? '';
    final String replyTime = replyTimeResolved ?? replyData['time']?.toString() ?? '';

    return GestureDetector(
      onTap: () {
        if (replyId.isNotEmpty && onReplyTap != null) onReplyTap!(replyId);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: !isMe
              ? Border.all(color: AppColors.pesanAbu, width: 1.5)
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                replyAuthor,
                style: GoogleFonts.montserrat(
                  color: AppColors.featurePurple,
                  fontWeight: FontWeight.w500,
                  fontSize: 12,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (replyTime.isNotEmpty) ...[
              const SizedBox(width: 8),
              Text(
                replyTime,
                style: GoogleFonts.montserrat(
                  color: AppColors.featurePurple,
                  fontWeight: FontWeight.w500,
                  fontSize: 11,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final replyData = metadata?['replyTo'] as Map<String, dynamic>?;
    final isPinned = metadata?['isPinned'] == true;

    // Check metadata 'showLinkPreview'. Default true jika tidak ada.
    final bool showLinkPreview = metadata?['showLinkPreview'] ?? true;

    // Radius 10px dan logic sudut lancip/lengkung
    final borderRadius = BorderRadius.only(
      topLeft: Radius.circular(isMe ? 10 : 0),
      topRight: Radius.circular(isMe ? 0 : 10),
      bottomLeft: const Radius.circular(10),
      bottomRight: const Radius.circular(10),
    );

    // Cek apakah ada URL dalam teks untuk Open Graph
    final firstUrlMatch = _urlRegex.firstMatch(text);
    final String? detectedUrl = firstUrlMatch?.group(0);

    final bubbleWidget = Container(
      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.70),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isMe ? const Color(0xFFD3C8FF) : Colors.white,
        border: Border.all(color: AppColors.lightGrey, width: 1),
        borderRadius: borderRadius,
      ),
      child: IntrinsicWidth(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            // 1. Header (Nama & Waktu)
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
                            style: AppTheme.secondaryTextStyle.copyWith(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppColors.featurePurple))),
                    const SizedBox(width: 8),
                    Text(sentAt.getTime,
                        style: AppTheme.secondaryTextStyle.copyWith(
                            fontSize: 12, color: AppColors.featurePurple)),
                  ],
                ),
              ),

            // 2. Reply Widget (Jika ada)
            if (replyData != null) _buildReplyWidget(replyData),

            // 3. Open Graph Preview (POSISI TENGAH)
            if (detectedUrl != null && showLinkPreview) ...[
              _LinkPreviewCard(url: detectedUrl),
              const SizedBox(height: 8), // Jarak ke teks
            ],

            // 4. Teks Pesan (RichText - Tanpa Zoom/Selection)
            Stack(
              children: [
                Padding(
                  padding: EdgeInsets.only(bottom: isPinned ? 12.0 : 0.0),
                  child: _buildRichText(context, text, textSearch),
                ),
                if (isPinned)
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Transform.rotate(
                        angle: 0.5,
                        child: Image.asset('assets/images/pin.png', width: 16, height: 16, fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Icon(Icons.error, size: 16, color: Colors.red))),
                  ),
              ],
            ),
          ],
        ),
      ),
    );

    if (isMe) {
      return Align(
          alignment: Alignment.centerRight,
          child: Padding(
            padding: const EdgeInsets.only(right: 6.0),
            child: bubbleWidget,
          ));
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
}

// --- WIDGET HELPER UNTUK LINK PREVIEW ---
class _LinkPreviewCard extends HookWidget {
  final String url;

  const _LinkPreviewCard({required this.url});

  @override
  Widget build(BuildContext context) {
    // State: title, description, image, host
    final metaData = useState<Map<String, String>?>(null);
    final isLoading = useState(true);
    final isError = useState(false);

    // Normalisasi URL awal
    final validUrl = url.startsWith('http') ? url : 'https://$url';

    // Ambil Hostname untuk fallback (e.g. "google.com")
    final String hostDisplay = Uri.tryParse(validUrl)?.host ?? url;

    useEffect(() {
      Future<void> fetchOG() async {
        // [FIX] Cek Cache dulu sebelum request
        if (_ogCache.containsKey(validUrl)) {
          metaData.value = _ogCache[validUrl];
          isLoading.value = false;
          return;
        }

        if (!context.mounted) return;

        try {
          final dio = Dio();
          // Gunakan User-Agent browser agar tidak diblokir server (Error 403)
          final response = await dio.get(
            validUrl,
            options: Options(
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              },
              receiveTimeout: const Duration(seconds: 5),
            ),
          );

          if (response.statusCode == 200 && context.mounted) {
            final html = response.data.toString();

            // Regex Pattern
            final titleReg = RegExp(r'<meta property="og:title" content="([^"]+)"', caseSensitive: false);
            final descReg = RegExp(r'<meta property="og:description" content="([^"]+)"', caseSensitive: false);
            final imgReg = RegExp(r'<meta property="og:image" content="([^"]+)"', caseSensitive: false);

            // Fallback Title (<title>...</title>)
            final fallbackTitleReg = RegExp(r'<title[^>]*>(.*?)</title>', caseSensitive: false);

            String? title = titleReg.firstMatch(html)?.group(1);
            String? description = descReg.firstMatch(html)?.group(1);
            String? image = imgReg.firstMatch(html)?.group(1);

            // Jika OG Title kosong, cari <title> biasa
            if (title == null || title.isEmpty) {
              title = fallbackTitleReg.firstMatch(html)?.group(1);
            }

            // Sanitasi HTML entities dasar jika perlu (sederhana)
            title = title?.replaceAll('&amp;', '&').replaceAll('&quot;', '"');

            if (title != null || description != null || image != null) {
              final data = {
                'title': title ?? hostDisplay,
                'description': description ?? validUrl,
                'image': image ?? '',
              };

              // [FIX] Simpan ke Cache
              _ogCache[validUrl] = data;

              if (context.mounted) {
                metaData.value = data;
              }
            } else {
              // HTML didapat tapi tidak ada tag yang dikenal -> Fallback ke Host
              isError.value = true;
            }
          } else {
            isError.value = true;
          }
        } catch (e) {
          if (context.mounted) isError.value = true;
        } finally {
          if (context.mounted) isLoading.value = false;
        }
      }

      fetchOG();
      return null;
    }, [url]);

    // Loading Indicator Kecil
    if (isLoading.value) {
      return const SizedBox(
          height: 20,
          child: Center(
              child: SizedBox(
                  width: 12, height: 12,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.featurePurple)
              )
          )
      );
    }

    // --- RENDER UI ---

    // Tentukan Data yang akan ditampilkan
    final String displayTitle = !isError.value && metaData.value != null ? (metaData.value!['title'] ?? hostDisplay) : hostDisplay;
    final String displayDesc = !isError.value && metaData.value != null ? (metaData.value!['description'] ?? validUrl) : validUrl;
    final String? displayImg = !isError.value && metaData.value != null ? metaData.value!['image'] : null;
    final bool hasImage = displayImg != null && displayImg.isNotEmpty;

    return GestureDetector(
      onTap: () async {
        try {
          await launchUrl(Uri.parse(validUrl), mode: LaunchMode.externalApplication);
        } catch (_) {}
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white, // [FIXED] Pastikan Background Putih
          borderRadius: BorderRadius.circular(8),
          // [FIX] Border PesanAbu tipis (0.5)
          border: Border.all(color: AppColors.pesanAbu, width: 0.5),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Gambar (Jika ada)
            if (hasImage)
              Image.network(
                displayImg,
                height: 120, // Tinggi gambar dibatasi agar tidak terlalu besar
                // [CRITICAL FIX] Hapus width: double.infinity agar tidak crash di dalam IntrinsicWidth
                fit: BoxFit.cover,
                errorBuilder: (ctx, err, stack) => const SizedBox.shrink(),
              ),

            // 2. Teks Info (Title, Desc/Link)
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Row(
                children: [
                  // Jika tidak ada gambar, tampilkan ikon link/rantai sebagai pemanis (ala WhatsApp jika no image)
                  if (!hasImage)
                    Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                          color: Colors.grey.shade200,
                          borderRadius: BorderRadius.circular(4)
                      ),
                      child: const Icon(Icons.link, size: 20, color: Colors.grey),
                    ),

                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          displayTitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTheme.primaryTextStyle.copyWith(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            color: Colors.black,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          displayDesc, // Deskripsi atau URL jika deskripsi kosong
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTheme.secondaryTextStyle.copyWith(
                            fontSize: 10,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}