import 'dart:io';
import 'dart:math' as math;

import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:apppro/core/utils/theme/color.dart';
import 'package:apppro/core/utils/theme/theme.dart';
import 'package:apppro/core/widgets/app_widgets.dart';
import 'package:apppro/feature/profile/domain/services/face_recognition_service.dart';
import 'package:easy_localization/easy_localization.dart';

class FaceRegistrationCamera extends StatefulWidget {
  const FaceRegistrationCamera({super.key});

  @override
  State<FaceRegistrationCamera> createState() => _FaceRegistrationCameraState();
}

class _FaceRegistrationCameraState extends State<FaceRegistrationCamera> with SingleTickerProviderStateMixin {
  CameraController? _cameraController;
  final FaceDetector _faceDetector = FaceDetector(
    options: FaceDetectorOptions(
      enableContours: true,
      enableClassification: true,
      enableTracking: true,
      performanceMode: FaceDetectorMode.accurate,
    ),
  );
  bool _isBusy = false;
  bool _isProcessingImage = false;
  String _instructionText = "";
  bool _isBlinkStep = false; // true after hold completes
  bool _wasEyesOpen = true;

  late AnimationController _holdController;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
    FaceRecognitionService.instance.initialize();

    _holdController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _holdController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        // After hold completes, switch to blink step
        if (mounted) {
          setState(() {
            _isBlinkStep = true;
            _instructionText = context.locale.languageCode == 'en'
                ? "Blink both eyes!"
                : "Kedipkan kedua mata!";
          });
        }
      }
    });
  }

  Future<void> _initializeCamera() async {
    final cameras = await availableCameras();
    final frontCamera = cameras.firstWhere(
      (camera) => camera.lensDirection == CameraLensDirection.front,
      orElse: () => cameras.first,
    );

    _cameraController = CameraController(
      frontCamera,
      ResolutionPreset.high,
      enableAudio: false,
      imageFormatGroup: Platform.isAndroid ? ImageFormatGroup.nv21 : ImageFormatGroup.bgra8888,
    );

    await _cameraController?.initialize();
    if (!mounted) return;
    setState(() {
      _instructionText = context.locale.languageCode == 'en' ? "Position your face in the circle" : "Posisikan wajah Anda di dalam lingkaran";
    });

    _cameraController?.startImageStream(_processCameraImage);
  }

  Future<void> _processCameraImage(CameraImage image) async {
    if (_isBusy || _isProcessingImage) return;
    _isBusy = true;

    try {
      final inputImage = _inputImageFromCameraImage(image);
      if (inputImage == null) {
        _isBusy = false;
        return;
      }

      final faces = await _faceDetector.processImage(inputImage);

      if (faces.isEmpty) {
        if (mounted) {
          setState(() => _instructionText = context.locale.languageCode == 'en' ? "Face not detected" : "Wajah tidak terdeteksi");
        }
        if (_holdController.value > 0) _holdController.reset();
      } else if (faces.length > 1) {
        if (mounted) {
          setState(() => _instructionText = context.locale.languageCode == 'en' ? "Ensure only one face is visible" : "Pastikan hanya ada satu wajah");
        }
        if (_holdController.value > 0) _holdController.reset();
      } else {
        final face = faces.first;
        final headEulerY = face.headEulerAngleY ?? 0;
        final headEulerX = face.headEulerAngleX ?? 0;

        // --- BLINK STEP ---
        if (_isBlinkStep) {
          final double leftEye = face.leftEyeOpenProbability ?? 1.0;
          final double rightEye = face.rightEyeOpenProbability ?? 1.0;
          final bool isEyesClosed = leftEye < 0.1 && rightEye < 0.1;

          if (_wasEyesOpen && isEyesClosed) {
            // Blink detected!
            _captureCallback();
          } else if (!isEyesClosed && leftEye > 0.5 && rightEye > 0.5) {
            _wasEyesOpen = true;
          } else if (isEyesClosed) {
            _wasEyesOpen = false;
          }
          return;
        }

        // --- STRAIGHT + HOLD STEP ---
        bool isCorrectPose = headEulerY.abs() < 10 && headEulerX.abs() < 10;

        if (!isCorrectPose) {
          if (mounted) {
            setState(() => _instructionText = context.locale.languageCode == 'en' ? "Look straight at the camera" : "Lihat lurus ke arah kamera");
          }
          if (_holdController.value > 0) _holdController.reset();
        } else {
          // Posisi lurus, jalankan timer progress
          if (mounted) {
            setState(() => _instructionText = context.locale.languageCode == 'en' ? "Hold still..." : "Tahan posisi...");
          }
          if (!_holdController.isAnimating && _holdController.status != AnimationStatus.completed) {
            _holdController.forward();
          }
        }
      }
    } catch (e) {
      debugPrint('Error processing image: $e');
    } finally {
      if (!_isProcessingImage) _isBusy = false;
    }
  }

  InputImage? _inputImageFromCameraImage(CameraImage image) {
    if (_cameraController == null) return null;

    final camera = _cameraController!.description;
    final sensorOrientation = camera.sensorOrientation;
    InputImageRotation? rotation;
    if (Platform.isIOS) {
      rotation = InputImageRotationValue.fromRawValue(sensorOrientation);
    } else if (Platform.isAndroid) {
      var rotationCompensation = _cameraController!.description.sensorOrientation;
      rotation = InputImageRotationValue.fromRawValue(rotationCompensation);
    }

    if (rotation == null) return null;

    final format = Platform.isAndroid ? InputImageFormat.nv21 : InputImageFormat.bgra8888;

    if (image.planes.isEmpty) return null;

    final WriteBuffer allBytes = WriteBuffer();
    for (final plane in image.planes) {
      allBytes.putUint8List(plane.bytes);
    }
    final bytes = allBytes.done().buffer.asUint8List();

    return InputImage.fromBytes(
      bytes: bytes,
      metadata: InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: rotation,
        format: format,
        bytesPerRow: image.planes.first.bytesPerRow,
      ),
    );
  }

  Future<void> _captureCallback() async {
    if (_isProcessingImage || !mounted) return;
    _isProcessingImage = true;

    try {
      HapticFeedback.vibrate();
      Future.delayed(const Duration(milliseconds: 150), () {
        HapticFeedback.vibrate();
      });

      if (mounted) {
        setState(() => _instructionText = context.locale.languageCode == 'en' ? "Hold still..." : "Tahan posisi...");
      }

      await _cameraController?.stopImageStream();
      final XFile? file = await _cameraController?.takePicture();

      if (file != null) {
        // Hasilkan Vector dari gambar
        // Karena MobileFaceNet sangat sensitif terhadap crop, kita biarkan TFLite menerima bounding box yg proporsional
        // Kita butuh box dari deteksi terakhir. Karena ini dalam frame cepat, kita proses ulang foto diamnya jika mau akurat mutlak,
        // tapi service kita sudah bisa terima file langsung dan box terakhir. 
        // Agar presisi, kita lempar crop full atau biarkan _capture bounding box?
        // Service extract embedding sudah handle deteksi boundingBox, kita kasih Rectangle utuh jika tidak ada box, tapi mari buat faceDetection untuk gambar diam.
        
        final inputImage = InputImage.fromFilePath(file.path);
        final faces = await _faceDetector.processImage(inputImage);
        
        if (faces.isEmpty) throw Exception("Face lost during capture");
        final finalBoundingBox = faces.first.boundingBox;

        final vector = await FaceRecognitionService.instance.getFaceEmbedding(
          imagePath: file.path,
          faceBoundingBox: finalBoundingBox,
        );

        if (vector != null && mounted) {
          Navigator.pop(context, {
            'vector': vector,
            'imagePath': file.path, 
          });
        } else {
          _resetAfterFailed();
        }
      }
    } catch (e) {
      debugPrint("Error capturing and processing face: $e");
      _resetAfterFailed();
    }
  }

  void _resetAfterFailed() async {
    if (mounted) {
      setState(() {
        _isProcessingImage = false;
        _instructionText = context.locale.languageCode == 'en' ? "Face processing failed. Try again." : "Gagal memproses wajah. Coba lagi.";
        _holdController.reset();
      });
      await Future.delayed(const Duration(seconds: 2));
      _cameraController?.startImageStream(_processCameraImage);
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _faceDetector.close();
    _holdController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      );
    }

    final double width = MediaQuery.of(context).size.width;
    final double height = MediaQuery.of(context).size.height;
    final double holeSize = width * 0.7;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        alignment: Alignment.topCenter,
        children: [
          // 1. KAMERA PREVIEW
          SizedBox(
            width: width,
            height: height,
            child: FittedBox(
              fit: BoxFit.cover,
              child: SizedBox(
                width: _cameraController!.value.previewSize!.height,
                height: _cameraController!.value.previewSize!.width,
                child: Transform.scale(
                  scaleX: 1, // Jika ingin mirror bisa rubah ini
                  child: CameraPreview(_cameraController!),
                ),
              ),
            ),
          ),

          // 2. OVERLAY MERAH DENGAN LUBANG TRANSPARAN (DI-BLEND OUT)
          ColorFiltered(
            colorFilter: const ColorFilter.mode(Colors.white, BlendMode.srcOut),
            child: Stack(
              fit: StackFit.expand,
              children: [
                Container(
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    backgroundBlendMode: BlendMode.dstOut,
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 40),
                    // Teks transparan
                    Text(
                      context.locale.languageCode == 'en' ? "Face Registration" : "Daftar Wajah",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.montserrat(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.transparent,
                      ),
                    ),
                    SizedBox(height: height * 0.085),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          height: holeSize,
                          width: holeSize,
                          decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),

          // 3. ELEMEN UI ATAS (TEKS & CIRCLE PAINTER)
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),

              Text(
                context.locale.languageCode == 'en' ? "Face Registration" : "Daftar Wajah",
                textAlign: TextAlign.center,
                style: GoogleFonts.montserrat(
                  fontSize: 16,
                  color: Colors.black87,
                  fontWeight: FontWeight.w600,
                ),
              ),
              SizedBox(height: height * 0.073),

              // AREA LINGKARAN & PROGRESS BAR ANIMASI
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    height: holeSize,
                    width: holeSize,
                  ),
                  SizedBox(
                    height: holeSize + 20,
                    width: holeSize + 20,
                    child: AnimatedBuilder(
                        animation: _holdController,
                        builder: (context, child) {
                          return CustomPaint(
                            painter: _SegmentedCirclePainter(
                              totalSegments: 1, // Single step
                              currentStepIndex: 0,
                              currentStepProgress: _holdController.value,
                              gapSize: 0.0,
                              activeColor: AppColors.featurePurple,
                              loadingColor: const Color(0xFFF79824),
                              inactiveColor: Colors.grey.withOpacity(0.3),
                            ),
                          );
                        }
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // INSTRUCTION TEXT
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  _instructionText,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.montserrat(
                    fontSize: 14,
                    color: Colors.black54,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),

              const Spacer(),

              // TOMBOL BATAL
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                  child: AppWidgets.primaryButton(
                    onTap: () {
                      Navigator.pop(context);
                    },
                    text: context.locale.languageCode == 'en' ? "Cancel" : "Batal",
                    backgroundColor: const Color(0xFFF5F5F5),
                    foregroundColor: AppColors.featurePurple,
                  ),
                ),
              )
            ],
          ),

          // UPLOAD OVERLAY
          if (_isProcessingImage)
            Container(
              color: Colors.black87,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: AppColors.featurePurple),
                    const SizedBox(height: 20),
                    Text(
                      _instructionText,
                      style: const TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ==========================================
// KELAS PAINTER UNTUK LINGKARAN BERSEGMEN
// ==========================================
class _SegmentedCirclePainter extends CustomPainter {
  final int totalSegments;
  final int currentStepIndex;
  final double currentStepProgress;
  final double gapSize;
  final Color activeColor;
  final Color loadingColor;
  final Color inactiveColor;

  _SegmentedCirclePainter({
    required this.totalSegments,
    required this.currentStepIndex,
    required this.currentStepProgress,
    required this.gapSize,
    required this.activeColor,
    required this.loadingColor,
    required this.inactiveColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final double strokeWidth = 8.0;
    final double radius = (size.width - strokeWidth) / 2;
    final Offset center = Offset(size.width / 2, size.height / 2);
    final double segmentArcSize = (2 * math.pi) / totalSegments;

    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(-math.pi / 2);
    canvas.translate(-center.dx, -center.dy);

    for (int i = 0; i < totalSegments; i++) {
      final Paint paint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;

      final double startAngle = (i * segmentArcSize) + (gapSize / 2);
      final double fullSweepAngle = segmentArcSize - gapSize;

      if (i < currentStepIndex) {
        paint.color = activeColor;
        canvas.drawArc(
          Rect.fromCircle(center: center, radius: radius),
          startAngle,
          fullSweepAngle,
          false,
          paint,
        );
      } else if (i == currentStepIndex) {
        paint.color = inactiveColor;
        canvas.drawArc(
          Rect.fromCircle(center: center, radius: radius),
          startAngle,
          fullSweepAngle,
          false,
          paint,
        );

        if (currentStepProgress > 0.0) {
          paint.color = loadingColor;
          final double progressSweepAngle = fullSweepAngle * currentStepProgress;
          canvas.drawArc(
            Rect.fromCircle(center: center, radius: radius),
            startAngle,
            progressSweepAngle,
            false,
            paint,
          );
        }
      } else {
        paint.color = inactiveColor;
        canvas.drawArc(
          Rect.fromCircle(center: center, radius: radius),
          startAngle,
          fullSweepAngle,
          false,
          paint,
        );
      }
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _SegmentedCirclePainter oldDelegate) {
    return oldDelegate.currentStepIndex != currentStepIndex ||
        oldDelegate.currentStepProgress != currentStepProgress ||
        oldDelegate.loadingColor != loadingColor;
  }
}
