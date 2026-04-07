part of '../views/chat.dart';

class HoraChatMediaPreview extends StatefulWidget {
  final String filePath;
  final String type; // 'image' or 'video'
  final String? address;
  final Function(String caption) onSend;

  const HoraChatMediaPreview({
    super.key,
    required this.filePath,
    required this.type,
    this.address,
    required this.onSend,
  });

  @override
  State<HoraChatMediaPreview> createState() => _HoraChatMediaPreviewState();
}

class _HoraChatMediaPreviewState extends State<HoraChatMediaPreview> {
  final TextEditingController _captionController = TextEditingController();
  VideoPlayerController? _videoController;
  bool _isVideoInitialized = false;

  @override
  void initState() {
    super.initState();
    if (widget.type == 'video') {
      _videoController = VideoPlayerController.file(File(widget.filePath))
        ..initialize().then((_) {
          setState(() {
            _isVideoInitialized = true;
            _videoController?.play();
            _videoController?.setLooping(true);
          });
        });
    }
  }

  @override
  void dispose() {
    _captionController.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Layer Preview (Gambar/Video)
          Center(
            child: widget.type == 'video'
                ? _buildVideoPreview()
                : Image.file(File(widget.filePath), fit: BoxFit.contain),
          ),

          // 2. Layer Top Bar (Input Caption & Back Button)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.4),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                    Expanded(
                      child: TextField(
                        controller: _captionController,
                        style: GoogleFonts.montserrat(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                        // [MODIFIKASI] Set cursor color putih
                        cursorColor: Colors.white,
                        decoration: InputDecoration(
                          hintText: "Tambah keterangan...",
                          hintStyle: GoogleFonts.montserrat(
                            color: Colors.white60,
                            fontWeight: FontWeight.w500,
                          ),
                          // [MODIFIKASI] Hilangkan semua border secara eksplisit
                          border: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          errorBorder: InputBorder.none,
                          disabledBorder: InputBorder.none,
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                        ),
                        maxLines: 3,
                        minLines: 1,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.crop_rotate, color: Colors.white),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Fitur edit akan segera hadir")));
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 3. Floating Send Button (Di Tengah Bawah)
          Positioned(
            bottom: 30, // Jarak dari bawah
            left: 0,
            right: 0,
            child: Center(
              child: SizedBox(
                width: 56, // Ukuran 56x56
                height: 56,
                child: FloatingActionButton(
                  backgroundColor: Colors.white, // Background Putih
                  elevation: 6,
                  shape: const CircleBorder(),
                  onPressed: () {
                    widget.onSend(_captionController.text.trim());
                    Navigator.pop(context);
                  },
                  // Ikon SVG Send warna FeaturePurple
                  child: SvgPicture.asset(
                    Assets.icons.icSend,
                    width: 24,
                    height: 24,
                    colorFilter: const ColorFilter.mode(
                      AppColors.featurePurple,
                      BlendMode.srcIn,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVideoPreview() {
    if (!_isVideoInitialized || _videoController == null) {
      return const Center(child: CircularProgressIndicator(color: Colors.white));
    }
    return AspectRatio(
      aspectRatio: _videoController!.value.aspectRatio,
      child: VideoPlayer(_videoController!),
    );
  }
}