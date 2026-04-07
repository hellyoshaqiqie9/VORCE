part of '../views/chat.dart';

class ChatRecordingSheet extends StatelessWidget {
  final String timerText;
  final List<double> amplitudeHistory;
  final bool isPaused;
  final bool isSending;
  final VoidCallback onClose;
  final VoidCallback onPauseResume;
  final VoidCallback onSend;

  const ChatRecordingSheet({
    super.key,
    required this.timerText,
    required this.amplitudeHistory,
    required this.isPaused,
    required this.isSending,
    required this.onClose,
    required this.onPauseResume,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final itemWidth = (screenWidth - 32 - 16) / 2;
    final itemHeight = itemWidth / 2.0;
    final menuSheetHeight = (itemHeight * 2) + 66 + 48;

    return Container(
      height: menuSheetHeight,
      width: double.infinity,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
              color: Colors.black12, blurRadius: 10, offset: Offset(0, -5))
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.grey),
                  onPressed: onClose,
                ),
                Text(
                  timerText,
                  style: AppTheme.primaryTextStyle.copyWith(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.featurePurple,
                    fontFeatures: [const FontFeature.tabularFigures()],
                  ),
                ),
                TextButton(
                  onPressed: isSending ? null : onSend,
                  child: isSending
                      ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(
                    "KIRIM",
                    style: AppTheme.primaryTextStyle.copyWith(
                      color: AppColors.featurePurple,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: CustomPaint(
                painter: ChatSoundWavePainter(
                  amplitudes: amplitudeHistory,
                  lineColor: AppColors.featurePurple,
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 20, top: 10),
            child: GestureDetector(
              onTap: onPauseResume,
              child: Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: AppColors.featurePurple,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                        color: AppColors.featurePurple.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4))
                  ],
                ),
                child: Icon(
                  isPaused ? Icons.play_arrow_rounded : Icons.pause_rounded,
                  color: Colors.white,
                  size: 30,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ChatSoundWavePainter extends CustomPainter {
  final List<double> amplitudes;
  final Color lineColor;

  ChatSoundWavePainter({required this.amplitudes, required this.lineColor});

  @override
  void paint(Canvas canvas, Size size) {
    final splitLinePaint = Paint()
      ..color = lineColor
      ..strokeWidth = 1.0;

    final dashedPaint = Paint()
      ..color = Colors.black
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.butt;

    final wavePaint = Paint()
      ..color = lineColor
      ..strokeWidth = 1.0
      ..strokeCap = StrokeCap.round;

    final dotPaint = Paint()
      ..color = lineColor
      ..style = PaintingStyle.fill;

    final double centerX = size.width / 2;
    final double centerY = size.height / 2;
    final double maxBarHeight = size.height * 0.8;

    double dataGap = 2.0;
    double dashLength = 1.0;
    double dashSpace = 7.0;
    double dashPatternTotal = dashLength + dashSpace;

    double scrollOffset = (amplitudes.length * dataGap) % dashPatternTotal;

    canvas.save();
    canvas.clipRect(Rect.fromLTRB(centerX, 0, size.width, size.height));

    {
      double currentX = centerX + dataGap - scrollOffset;
      if (currentX < centerX) currentX += dashPatternTotal;
      while (currentX < size.width) {
        double startX = currentX - (dashLength / 2);
        double endX = currentX + (dashLength / 2);
        canvas.drawLine(
            Offset(startX, centerY), Offset(endX, centerY), dashedPaint);
        currentX += dashPatternTotal;
      }
    }
    canvas.restore();

    canvas.drawLine(
        Offset(centerX, 0), Offset(centerX, size.height), splitLinePaint);
    canvas.drawCircle(Offset(centerX, 0), 3.0, dotPaint);
    canvas.drawCircle(Offset(centerX, size.height), 3.0, dotPaint);

    for (int i = 0; i < amplitudes.length; i++) {
      double value = amplitudes[i];
      double x = centerX - (i * dataGap);
      if (x < 0) break;
      double barHeight = (value * maxBarHeight).clamp(0.0, maxBarHeight);
      if (barHeight > 2.0) {
        Offset p1 = Offset(x, centerY - (barHeight / 2));
        Offset p2 = Offset(x, centerY + (barHeight / 2));
        canvas.drawLine(p1, p2, wavePaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant ChatSoundWavePainter oldDelegate) {
    return oldDelegate.amplitudes != amplitudes;
  }
}