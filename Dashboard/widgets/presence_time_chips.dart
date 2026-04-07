part of '../views/presence.dart';

class _PresenceTimeChips extends StatelessWidget {
  const _PresenceTimeChips({
    this.onTap,
    this.selectedChip,
    this.selectedDate,
  });

  // Mengirim value 'Masuk', 'Pulang', 'Izin' atau null
  final void Function(String chipValue)? onTap;
  final String? selectedChip;
  final DateTime? selectedDate;

  @override
  Widget build(BuildContext context) {
    // Mapping Label (Tampilan) ke Value (Data API/Logic)
    final List<Map<String, String>> chips = [
      {'label': 'presence.chip_in'.tr(), 'value': 'Masuk'},
      {'label': 'presence.chip_out'.tr(), 'value': 'Pulang'},
      {'label': 'presence.chip_leave'.tr(), 'value': 'Izin'},
    ];

    // Default status jika tidak ada yang dipilih
    String getDefaultChipValue() {
      return 'Masuk';
    }

    final String defaultChip = getDefaultChipValue();
    // Gunakan value untuk logic aktif/tidak
    String activeChipValue = selectedChip ?? defaultChip;

    return Container(
      height: 32,
      margin: const EdgeInsets.symmetric(horizontal: 10),
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        color: AppColors.lightGrey,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: List.generate(
          chips.length,
              (index) {
            final chip = chips[index];
            final String label = chip['label']!;
            final String value = chip['value']!;
            final isActive = activeChipValue == value;

            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(left: index == 0 ? 0 : 4),
                child: InkWell(
                  onTap: () {
                    onTap?.call(value);
                  },
                  borderRadius: BorderRadius.circular(10),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    decoration: BoxDecoration(
                      color: isActive ? Colors.white : Colors.transparent,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: isActive
                          ? [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ]
                          : [],
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      label,
                      textAlign: TextAlign.center,
                      style: AppTheme.primaryTextStyle.copyWith(
                        fontSize: 12,
                        // PERUBAHAN: Bold jika aktif, Normal jika tidak aktif
                        fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                        color: isActive ? AppColors.darkGray : AppColors.darkGray.withOpacity(0.5),
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}