part of 'presence.dart';

class PresenceSettingsView extends HookConsumerWidget {
  const PresenceSettingsView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Access State
    final isShiftEnabled = ref.watch(showShiftFilterProvider);
    final selectedTimezone = ref.watch(settingsTimezoneProvider);

    // FIX: Gunakan context.locale.languageCode sebagai source of truth agar sinkron
    final currentLanguage = context.locale.languageCode;

    // --- LOGIC: MEMUAT STATUS SHIFT DARI PENYIMPANAN HP ---
    // useEffect dipanggil sekali saat halaman ini dibuka
    useEffect(() {
      Future.microtask(() async {
        try {
          final prefs = await SharedPreferences.getInstance();
          final savedShift = prefs.getBool('show_shift_filter');
          // Jika ada data tersimpan, update provider
          if (savedShift != null) {
            ref.read(showShiftFilterProvider.notifier).state = savedShift;
          }
        } catch (e) {
          debugPrint("Error loading settings: $e");
        }
      });
      return null;
    }, []);

    // --- HELPER WIDGET UNTUK CUSTOM DROPDOWN ---
    Widget buildCustomDropdown({
      required String value,
      required List<String> items,
      required Function(String?) onChanged,
      required Map<String, String> displayMap,
    }) {
      return Container(
        height: 30, // Tinggi fixed 30 (Kecil)
        padding: const EdgeInsets.symmetric(horizontal: 10), // Padding 10
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          // Border container dihapus (bersih)
        ),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: value,
            icon: SvgPicture.asset(
              Assets.icons.icArrowExpanded,
              width: 14,
              height: 14,
              colorFilter: const ColorFilter.mode(AppColors.darkGray, BlendMode.srcIn),
            ),
            isExpanded: true,
            dropdownColor: Colors.white,
            borderRadius: BorderRadius.circular(12),
            style: GoogleFonts.montserrat(
              color: AppColors.darkGray,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
            items: items.map((String itemValue) {
              return DropdownMenuItem<String>(
                value: itemValue,
                child: Align(
                  alignment: Alignment.centerRight,
                  child: Text(
                    displayMap[itemValue] ?? itemValue,
                    style: GoogleFonts.montserrat(
                      color: AppColors.darkGray,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              );
            }).toList(),
            selectedItemBuilder: (BuildContext context) {
              return items.map((String item) {
                return Align(
                  alignment: Alignment.centerRight,
                  // Padding kanan 10px pada teks terpilih agar berjarak dengan ikon expand
                  child: Padding(
                    padding: const EdgeInsets.only(right: 10.0),
                    child: Text(
                      displayMap[item] ?? item,
                      style: GoogleFonts.montserrat(
                        color: AppColors.darkGray,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                );
              }).toList();
            },
            onChanged: onChanged,
          ),
        ),
      );
    }

    // --- HELPER UNTUK ROW SETTING MANUAL ---
    Widget _buildSettingRow({
      required Widget icon,
      required String label,
      required Widget child,
    }) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.lightGrey, width: 1.0),
        ),
        child: Row(
          children: [
            // IKON
            SizedBox(
                width: 20,
                height: 20,
                child: Center(child: icon)
            ),

            // JARAK 10px
            const SizedBox(width: 10),

            // LABEL
            Expanded(
              child: Text(
                label,
                style: AppTheme.primaryTextStyle.copyWith(
                  fontWeight: FontWeight.w500,
                  fontSize: 14,
                ),
              ),
            ),

            const SizedBox(width: 8),

            // WIDGET KANAN (DROPDOWN/SWITCH)
            child,
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          "presence.settings_title".tr(),
          style: AppTheme.primaryTextStyle.copyWith(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      backgroundColor: Colors.white,
      body: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // --- 1. SETTING WAKTU (DISABLED) ---
            /*
            _buildSettingRow(
              icon: const Icon(Icons.schedule_outlined, color: AppColors.darkGray, size: 20),
              label: "presence.timezone".tr(),
              child: SizedBox(
                width: 100, // Lebar disesuaikan
                child: buildCustomDropdown(
                  value: selectedTimezone,
                  items: ['UTC+7', 'UTC+8', 'UTC+9'],
                  displayMap: {
                    'UTC+7': 'UTC+7',
                    'UTC+8': 'UTC+8',
                    'UTC+9': 'UTC+9',
                  },
                  onChanged: (String? newValue) {
                    if (newValue != null) {
                      ref.read(settingsTimezoneProvider.notifier).state = newValue;
                    }
                  },
                ),
              ),
            ),

            const SizedBox(height: 10),
            */

            // --- 2. SETTING BAHASA (DISABLED) ---
            /*
            _buildSettingRow(
              icon: const Icon(Icons.language_outlined, color: AppColors.darkGray, size: 20),
              label: "language".tr(),
              child: SizedBox(
                width: 120, // Lebar disesuaikan
                child: buildCustomDropdown(
                  value: currentLanguage,
                  items: ['id', 'en'],
                  displayMap: {
                    'id': 'Bahasa',
                    'en': 'English',
                  },
                  onChanged: (String? newValue) {
                    if (newValue != null) {
                      ref.read(settingsLanguageProvider.notifier).state = newValue;
                      final newLocale = context.supportedLocales.firstWhere(
                            (element) => element.languageCode == newValue,
                        orElse: () => context.locale,
                      );
                      context.setLocale(newLocale);
                    }
                  },
                ),
              ),
            ),

            const SizedBox(height: 10),
            */

            // --- 3. SETTING SHIFT (ACTIVE) ---
            _buildSettingRow(
              icon: SvgPicture.asset(
                Assets.icons.icClock, // PERUBAHAN: Ikon diganti menjadi icClock
                width: 20,
                height: 20,
                colorFilter: const ColorFilter.mode(AppColors.darkGray, BlendMode.srcIn),
              ),
              label: "presence.filter_shift".tr(),
              child: SizedBox(
                height: 30,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      isShiftEnabled ? "presence.on".tr() : "presence.off".tr(),
                      style: AppTheme.primaryTextStyle.copyWith(
                        color: isShiftEnabled ? AppColors.featurePurple : Colors.grey,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(width: 10),
                    // PERBAIKAN SCALING:
                    // Dibungkus SizedBox 42px agar layout rapat
                    SizedBox(
                      width: 42,
                      child: Transform.scale(
                        scale: 0.7,
                        // Align kiri agar visual nempel ke teks, tidak ada gap kosong di kiri
                        alignment: Alignment.centerLeft,
                        child: Switch(
                          value: isShiftEnabled,
                          onChanged: (bool value) async {
                            ref.read(showShiftFilterProvider.notifier).state = value;
                            try {
                              final prefs = await SharedPreferences.getInstance();
                              await prefs.setBool('show_shift_filter', value);
                            } catch (e) {
                              debugPrint("Gagal menyimpan setting shift: $e");
                            }
                          },
                          thumbColor: WidgetStateProperty.resolveWith<Color>((states) {
                            if (states.contains(WidgetState.selected)) {
                              return Colors.white;
                            }
                            return AppColors.featurePurple;
                          }),
                          trackColor: WidgetStateProperty.resolveWith<Color>((states) {
                            if (states.contains(WidgetState.selected)) {
                              return AppColors.featurePurple;
                            }
                            return const Color(0xFFF0EDFF);
                          }),
                          trackOutlineColor: WidgetStateProperty.all(AppColors.featurePurple),
                          trackOutlineWidth: WidgetStateProperty.all(1.0),
                          overlayColor: WidgetStateProperty.all(Colors.transparent),
                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }
}