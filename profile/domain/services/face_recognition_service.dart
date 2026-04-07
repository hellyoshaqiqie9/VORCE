import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:image/image.dart' as img;
import 'package:tflite_flutter/tflite_flutter.dart';

class FaceRecognitionService {
  FaceRecognitionService._privateConstructor();
  static final FaceRecognitionService instance = FaceRecognitionService._privateConstructor();

  Interpreter? _interpreter;
  bool _isInitialized = false;

  // Resolusi tipikal MobileFaceNet adalah 112x112
  static const int _inputSize = 112; 

  // Inisialisasi TFLite Interpreter
  Future<void> initialize() async {
    if (_isInitialized) return;
    try {
      final options = InterpreterOptions()..threads = 4;
      _interpreter = await Interpreter.fromAsset('assets/models/mobilefacenet.tflite', options: options);
      _isInitialized = true;
      debugPrint("FaceRecognitionService: Interpreter initialized successfully.");
    } catch (e) {
      debugPrint("FaceRecognitionService Error initializing interpreter: $e");
    }
  }

  // Mengubah gambar (dari raw CameraImage atau File) menjadi Array RGB yang dinormalisasi untuk input MobileFaceNet
  Future<List<double>?> getFaceEmbedding({
    required String imagePath,
    required Rect faceBoundingBox,
  }) async {
    if (!_isInitialized) await initialize();
    if (_interpreter == null) return null;

    try {
      // 1. Load Original Image (Using image package)
      final bytes = await File(imagePath).readAsBytes();
      img.Image? originalImage = img.decodeImage(bytes);
      if (originalImage == null) {
        debugPrint("FaceRecognitionService: Failed to decode image");
        return null;
      }

      // Pastikan faceBoundingBox tidak keluar dari batas asal gambar
      int x = faceBoundingBox.left.toInt().clamp(0, originalImage.width);
      int y = faceBoundingBox.top.toInt().clamp(0, originalImage.height);
      int w = faceBoundingBox.width.toInt().clamp(1, originalImage.width - x);
      int h = faceBoundingBox.height.toInt().clamp(1, originalImage.height - y);

      // 2. Crop Face
      img.Image faceCrop = img.copyCrop(originalImage, x: x, y: y, width: w, height: h);

      // 3. Resize ke input shape model (112x112)
      img.Image resizedFace = img.copyResize(faceCrop, width: _inputSize, height: _inputSize);

      // 4. Preprocess (Ubah piksel ke Float32List, dikurangi rata-rata The MobileFaceNet norm: value = (pixel - 127.5) / 128)
      // Input tensor shape umumnya [1, 112, 112, 3]
      var input = List.generate(
        1,
        (i) => List.generate(
          _inputSize,
          (y) => List.generate(
            _inputSize,
            (x) => List.generate(3, (c) => 0.0),
          ),
        ),
      );

      for (int y = 0; y < _inputSize; y++) {
        for (int x = 0; x < _inputSize; x++) {
          final pixel = resizedFace.getPixel(x, y);
          // Normalisasi MobileFaceNet: (val - 127.5) / 127.5 atau (val - 127.5) / 128
          input[0][y][x][0] = ((pixel.r as num) - 127.5) / 128; // Red
          input[0][y][x][1] = ((pixel.g as num) - 127.5) / 128; // Green
          input[0][y][x][2] = ((pixel.b as num) - 127.5) / 128; // Blue
        }
      }

      // 5. Output shape untuk MobileFaceNet umumnya [1, 192] (bisa juga 128, kita cek dari outputTensor shape)
      var outputShape = _interpreter!.getOutputTensor(0).shape; 
      int outputLength = outputShape.isNotEmpty ? outputShape.last : 192; // Biasanya 192
      
      var output = List.generate(1, (i) => List.filled(outputLength, 0.0));

      // 6. Jalankan Inference
      _interpreter!.run(input, output);

      // Kembalikan float array dari hasil
      return output[0];
    } catch (e) {
      debugPrint("FaceRecognitionService: Error generating embedding: $e");
      return null;
    }
  }

  void dispose() {
    _interpreter?.close();
  }
}
