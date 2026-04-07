part of '../views/presence.dart';

class _PresenceStopwatch extends HookConsumerWidget {
  const _PresenceStopwatch(this._stopWatchTimer);

  final StopWatchTimer _stopWatchTimer;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 30,
        vertical: 44,
      ),
      decoration: BoxDecoration(
        color: AppColors.white,
        shape: BoxShape.circle,
        border: Border.all(
          color: AppColors.blue,
          width: 3.3,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          StreamBuilder<int>(
              stream: _stopWatchTimer.rawTime,
              builder: (context, snap) {
                final value = snap.data ?? 0;
                return Text(
                  StopWatchTimer.getDisplayTime(value, milliSecond: false),
                  style: GoogleFonts.montserrat(
                    fontSize: 16,
                    color: AppColors.darkGray,
                    fontWeight: FontWeight.w600,
                  ),
                );
              }),
          4.margin,
          Text(
            DateTime.now().getTime,
            style: GoogleFonts.montserrat(
              fontSize: 14,
              color: AppColors.darkGray,
            ),
          ),
        ],
      ),
    );
  }
}
