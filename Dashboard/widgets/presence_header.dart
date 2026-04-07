part of '../views/presence.dart';

class _PresenceHeader extends HookConsumerWidget {
  final StopWatchTimer stopWatchTimer;
  final bool isSessionActive;
  final VoidCallback? onAbsenceTap; // Callback untuk aksi absen
  final bool isDisabled; // Indikator disable jika sedang izin

  const _PresenceHeader({
    required this.stopWatchTimer,
    required this.isSessionActive,
    this.onAbsenceTap,
    this.isDisabled = false, // Default false
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pref = ref.read(appPreferenceProvider);
    final photo = useState('https://horaapp.id/assets/img/favicon.png');

    // TAMBAHAN: Buat GlobalKey untuk mendapatkan koordinat dan ukuran tombol kalender
    final calendarKey = useMemoized(() => GlobalKey());

    // Ambil tanggal yang sedang dipilih
    final selectedDate = ref.watch(selectedPresenceDateProvider);

    useEffect(() {
      Future.microtask(() async {
        await pref
            .read<String>(AppPreferenceKey.profilePicture)
            .then((value) => value!.isNotEmpty ? photo.value = value.toString().toUrlImageHora : 'https://avatar.iran.liara.run/public');
      });
      return null;
    }, []);

    // Tinggi standar untuk menyamakan kedua sisi
    const double headerCardHeight = 40.0;

    // --- PERUBAHAN: Fungsi Pick Date memanggil Custom Calendar Dropdown ---
    Future<void> _pickDate(BuildContext context) async {
      // 1. Dapatkan posisi (X,Y) dari tombol kalender di layar
      final RenderBox? renderBox = calendarKey.currentContext?.findRenderObject() as RenderBox?;
      if (renderBox == null) return;

      final position = renderBox.localToGlobal(Offset.zero);
      final size = renderBox.size;

      // 2. Tampilkan dialog custom yang diposisikan seperti dropdown
      final DateTime? picked = await showGeneralDialog<DateTime>(
        context: context,
        barrierDismissible: true,
        barrierLabel: "CalendarDropdown",
        barrierColor: Colors.black.withOpacity(0.15), // Efek redup di latar belakang
        transitionDuration: const Duration(milliseconds: 200),
        pageBuilder: (context, animation, secondaryAnimation) {
          return Stack(
            children: [
              Positioned(
                // Tempatkan kalender tepat di bawah tombol (Y) ditambah margin 8px
                top: position.dy + size.height + 8,
                // Sejajarkan ke kiri (X) sesuai padding layar
                left: 10,
                child: Material(
                  color: Colors.transparent,
                  child: Container(
                    // Set lebar agar tidak menabrak batas layar
                    width: MediaQuery.of(context).size.width > 340 ? 320 : MediaQuery.of(context).size.width - 20,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.15),
                          blurRadius: 15,
                          spreadRadius: 2,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    // Menggunakan widget Custom Calendar buatan sendiri
                    child: _CustomCalendarDropdown(initialDate: selectedDate),
                  ),
                ),
              ),
            ],
          );
        },
        // Animasi transisi ringan bergaya dropdown menu
        transitionBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, -0.05), // Mulai sedikit dari atas
                end: Offset.zero,
              ).animate(CurvedAnimation(
                parent: animation,
                curve: Curves.easeOut,
              )),
              child: child,
            ),
          );
        },
      );

      // 3. Jika user memilih tanggal baru, update provider
      if (picked != null && picked != selectedDate) {
        ref.read(selectedPresenceDateProvider.notifier).state = picked;
      }
    }

    // --- LOGIKA WARNA IKON ---
    final now = DateTime.now();
    // Cek apakah tanggal yang dipilih adalah Hari Ini
    final bool isToday = selectedDate.year == now.year &&
        selectedDate.month == now.month &&
        selectedDate.day == now.day;

    // Hitam jika hari ini, Feature Purple jika tanggal lain (history)
    final Color iconColor = isToday ? Colors.black : AppColors.featurePurple;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 10,
        vertical: 0,
      ),
      width: context.width,
      color: Colors.transparent,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // --- KIRI: PILIH TANGGAL (IKON SAJA) ---
          InkWell(
            key: calendarKey, // TAMBAHAN: Masukkan GlobalKey ke sini agar terdeteksi koordinatnya
            onTap: () => _pickDate(context),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              height: headerCardHeight,
              width: headerCardHeight, // Lebar dibuat sama dengan tinggi agar kotak
              // Padding disesuaikan agar ikon di tengah
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Center(
                // Ikon berubah warna sesuai logika filter (Hitam/Ungu)
                child: Icon(
                  Icons.event_outlined,
                  size: 20,
                  color: iconColor,
                ),
              ),
            ),
          ),

          // --- KANAN: DURASI & SWITCH ---
          Container(
            height: headerCardHeight,
            // Padding kanan dikurangi menjadi 0 agar switch 0.5 tidak menyisakan ruang kosong di tepi
            padding: const EdgeInsets.fromLTRB(14, 0, 0, 0),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // TIMER DURASI KERJA
                StreamBuilder<int>(
                  stream: stopWatchTimer.rawTime,
                  initialData: stopWatchTimer.rawTime.value,
                  builder: (context, snapshot) {
                    final value = snapshot.data;
                    final displayTime = StopWatchTimer.getDisplayTime(
                      value ?? 0,
                      hours: true,
                      minute: true,
                      second: true,
                      milliSecond: false,
                    );
                    return Text(
                      displayTime,
                      style: AppTheme.primaryTextStyle.copyWith(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: isDisabled ? Colors.grey : Colors.black, // Warna pudar jika disable
                      ),
                    );
                  },
                ),

                // SWITCH CUSTOM (Skala 0.5)
                // Menggunakan SizedBox untuk membatasi lebar layout agar jarak lebih rapat
                SizedBox(
                  width: 45, // Membatasi ruang agar teks timer dan switch lebih berdekatan
                  child: Transform.scale(
                    scale: 0.5,
                    alignment: Alignment.center,
                    child: Switch(
                      value: isSessionActive,
                      onChanged: isDisabled ? null : (val) { // Jika disabled, null agar tidak bisa di-tap
                        if (onAbsenceTap != null) {
                          onAbsenceTap!();
                        }
                      },
                      // --- KUSTOMISASI WARNA SWITCH TERBARU ---
                      thumbColor: WidgetStateProperty.resolveWith<Color>((states) {
                        if (states.contains(WidgetState.disabled)) {
                          return Colors.white; // Disable: Thumb #FFFFFF
                        }
                        if (states.contains(WidgetState.selected)) {
                          return Colors.white; // ON: Thumb #FFFFFF
                        }
                        return AppColors.featurePurple; // OFF: Thumb #7857FF
                      }),
                      trackColor: WidgetStateProperty.resolveWith<Color>((states) {
                        if (states.contains(WidgetState.disabled)) {
                          return AppColors.greyIconUnselected; // Disable: Track #797979
                        }
                        if (states.contains(WidgetState.selected)) {
                          return AppColors.featurePurple; // ON: Track #7857FF
                        }
                        return AppColors.switchBarBackground; // OFF: Track #EDEDED
                      }),
                      trackOutlineColor: WidgetStateProperty.resolveWith<Color?>((states) {
                        if (states.contains(WidgetState.disabled)) {
                          return AppColors.greyIconUnselected; // Outline samakan dengan track
                        }
                        if (states.contains(WidgetState.selected)) {
                          return AppColors.featurePurple; // Outline samakan dengan track
                        }
                        return AppColors.switchBarBackground; // Outline samakan dengan track
                      }),
                      trackOutlineWidth: WidgetStateProperty.all(1.0),
                      overlayColor: WidgetStateProperty.all(Colors.transparent),
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// --- WIDGET KALENDER CUSTOM (BARU) ---
class _CustomCalendarDropdown extends HookWidget {
  final DateTime initialDate;

  const _CustomCalendarDropdown({required this.initialDate});

  @override
  Widget build(BuildContext context) {
    // State manajemen tanggal saat ini
    final focusedDate = useState(DateTime(initialDate.year, initialDate.month));
    final selectedDate = useState(initialDate);

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    final monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    final weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

    // Fungsi Navigasi
    void changeMonth(int delta) {
      final newDate = DateTime(focusedDate.value.year, focusedDate.value.month + delta);
      // Cegah melihat bulan di masa depan
      if (newDate.year > now.year || (newDate.year == now.year && newDate.month > now.month)) return;
      focusedDate.value = newDate;
    }

    void changeYear(int delta) {
      final newDate = DateTime(focusedDate.value.year + delta, focusedDate.value.month);
      // Cegah melihat tahun di masa depan, min batas tahun 2020
      if (newDate.year > now.year || newDate.year < 2020) return;
      focusedDate.value = newDate;
    }

    // Variabel batas untuk mendisable panah navigasi masa depan
    final isNextMonthDisabled = focusedDate.value.year == now.year && focusedDate.value.month == now.month;
    final isNextYearDisabled = focusedDate.value.year == now.year;
    final isPrevYearDisabled = focusedDate.value.year <= 2020;

    // Kalkulasi Kalender
    final firstDayOffset = DateTime(focusedDate.value.year, focusedDate.value.month, 1).weekday - 1; // 0=Sen, 6=Min
    final daysInMonth = DateUtils.getDaysInMonth(focusedDate.value.year, focusedDate.value.month);
    final prevMonthDate = DateTime(focusedDate.value.year, focusedDate.value.month - 1);
    final prevMonthDays = DateUtils.getDaysInMonth(prevMonthDate.year, prevMonthDate.month);

    final List<Widget> dayWidgets = [];

    // Tambahkan hari dari bulan sebelumnya (Greyed Out)
    for (int i = 0; i < firstDayOffset; i++) {
      final day = prevMonthDays - firstDayOffset + i + 1;
      dayWidgets.add(
        Center(
          child: Text(
            '$day',
            style: AppTheme.primaryTextStyle.copyWith(color: Colors.grey[300]),
          ),
        ),
      );
    }

    // Tambahkan hari pada bulan yang aktif
    for (int i = 1; i <= daysInMonth; i++) {
      final currentDate = DateTime(focusedDate.value.year, focusedDate.value.month, i);
      final isSelected = currentDate.year == selectedDate.value.year &&
          currentDate.month == selectedDate.value.month &&
          currentDate.day == selectedDate.value.day;
      final isFuture = currentDate.isAfter(today);

      // LOGIKA BARU: Cek apakah tanggal iterasi ini adalah hari ini (today)
      final isTodayDay = currentDate.year == today.year &&
          currentDate.month == today.month &&
          currentDate.day == today.day;

      dayWidgets.add(
        GestureDetector(
          onTap: isFuture
              ? null
              : () {
            selectedDate.value = currentDate;
            Navigator.pop(context, currentDate); // Kembalikan nilai
          },
          child: Container(
            margin: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: isSelected ? AppColors.featurePurple : Colors.transparent,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              '$i',
              style: AppTheme.primaryTextStyle.copyWith(
                // PERUBAHAN: Jika ini adalah hari ini (namun tidak dipilih), warnanya menjadi Feature Purple
                color: isFuture
                    ? Colors.grey[300]
                    : (isSelected
                    ? Colors.white
                    : (isTodayDay ? AppColors.featurePurple : Colors.black)),
                fontWeight: isSelected || isTodayDay ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        ),
      );
    }

    // Tambahkan hari untuk bulan depan agar tinggi grid selalu sama (Total 42 sel / 6 minggu)
    final remainingCells = 42 - dayWidgets.length;
    for (int i = 1; i <= remainingCells; i++) {
      dayWidgets.add(
        Center(
          child: Text(
            '$i',
            style: AppTheme.primaryTextStyle.copyWith(color: Colors.grey[300]),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // HEADER KONTROL (Sesuai Gambar)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              // --- KONTROL BULAN ---
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  InkWell(
                    onTap: () => changeMonth(-1),
                    child: const Padding(padding: EdgeInsets.all(4), child: Icon(Icons.arrow_left, color: Colors.grey, size: 28)),
                  ),
                  SizedBox(
                    width: 85,
                    child: Text(
                      monthNames[focusedDate.value.month - 1],
                      textAlign: TextAlign.center,
                      style: AppTheme.primaryTextStyle.copyWith(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ),
                  InkWell(
                    onTap: isNextMonthDisabled ? null : () => changeMonth(1),
                    child: Padding(
                      padding: const EdgeInsets.all(4),
                      child: Icon(Icons.arrow_right, color: isNextMonthDisabled ? Colors.grey.shade300 : Colors.grey, size: 28),
                    ),
                  ),
                ],
              ),
              // --- KONTROL TAHUN ---
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  InkWell(
                    onTap: isPrevYearDisabled ? null : () => changeYear(-1),
                    child: Padding(padding: const EdgeInsets.all(4), child: Icon(Icons.arrow_left, color: isPrevYearDisabled ? Colors.grey.shade300 : Colors.grey, size: 28)),
                  ),
                  SizedBox(
                    width: 45,
                    child: Text(
                      '${focusedDate.value.year}',
                      textAlign: TextAlign.center,
                      style: AppTheme.primaryTextStyle.copyWith(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ),
                  InkWell(
                    onTap: isNextYearDisabled ? null : () => changeYear(1),
                    child: Padding(
                      padding: const EdgeInsets.all(4),
                      child: Icon(Icons.arrow_right, color: isNextYearDisabled ? Colors.grey.shade300 : Colors.grey, size: 28),
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 16),

          // BARIS HARI (Sen, Sel, Rab...)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: weekDays.map((d) => Expanded(
              child: Text(
                d,
                textAlign: TextAlign.center,
                style: AppTheme.secondaryTextStyle.copyWith(color: Colors.grey, fontSize: 12),
              ),
            )).toList(),
          ),

          const SizedBox(height: 8),

          // GRID TANGGAL
          GridView.count(
            shrinkWrap: true,
            crossAxisCount: 7,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.0,
            padding: EdgeInsets.zero,
            children: dayWidgets,
          ),
        ],
      ),
    );
  }
}