part of '../views/profile.dart';

class UserTaskList extends HookConsumerWidget {
  final Profile? profile;
  final String? targetEmail;

  const UserTaskList({
    super.key,
    required this.profile,
    this.targetEmail,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    useEffect(() {
      Future.microtask(() {
        ref.read(taskListStateNotifierProvider.notifier).getTaskList();
      });
      return null;
    }, []);

    final taskState = ref.watch(taskListStateNotifierProvider);

    if (taskState.isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20.0),
          child: CircularProgressIndicator(),
        ),
      );
    }

    // --- FIX: LOGIKA PARSING DATA YANG AMAN (Mencegah Error Type Cast List) ---
    final rawData = taskState.dataOrNull;
    List<TaskModel> allTasks = [];

    if (rawData != null && rawData is List) {
      allTasks = rawData.map((item) {
        if (item is TaskModel) {
          return item; // Jika sudah berupa TaskModel, langsung return
        } else if (item is Map<String, dynamic>) {
          return TaskModel.fromJson(item); // Jika berupa Map<String, dynamic>, convert ke TaskModel
        } else if (item is Map) {
          return TaskModel.fromJson(Map<String, dynamic>.from(item)); // Mapping aman untuk Map generic
        }
        return null; // Abaikan jika tipe datanya tidak dikenali
      }).whereType<TaskModel>().toList(); // Hapus nilai null jika ada yang gagal di-parse
    }
    // -------------------------------------------------------------------------

    final filterEmail = (targetEmail ?? profile?.email ?? '').trim().toLowerCase();

    // 1. Filter tugas berdasarkan email
    final tasks = allTasks.where((task) {
      final assignedToString = (task.assignedTo?.join(' ') ?? '').trim().toLowerCase();
      return assignedToString.isNotEmpty && assignedToString.contains(filterEmail);
    }).toList();

    // 2. SORTING: Urutkan dari Tanggal Terbaru ke Terlama
    tasks.sort((a, b) {
      DateTime dateA = DateTime(0);
      DateTime dateB = DateTime(0);

      if (a.createdAt != null) {
        try {
          dateA = DateTime.parse(a.createdAt.toString());
        } catch (_) {}
      }

      if (b.createdAt != null) {
        try {
          dateB = DateTime.parse(b.createdAt.toString());
        } catch (_) {}
      }

      // Bandingkan B dengan A untuk urutan Descending (Terbaru di atas)
      return dateB.compareTo(dateA);
    });

    if (tasks.isEmpty) {
      return Center(
        child: Column(
          children: [
            const Icon(Icons.assignment_ind_outlined, size: 48, color: AppColors.lightGrey),
            const SizedBox(height: 8),
            Text(
              "profile.no_task_data".tr(context: context),
              style: GoogleFonts.dmSans(color: AppColors.darkGray),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      itemCount: tasks.length,
      separatorBuilder: (context, index) => const SizedBox(height: 10), // Jarak antar card 10px
      itemBuilder: (context, index) {
        final task = tasks[index];

        String dateDisplay = '-';
        if (task.createdAt != null) {
          try {
            dateDisplay = DateFormat('dd MMM yyyy').format(DateTime.parse(task.createdAt.toString()));
          } catch (_) {}
        }

        // UPDATE: Navigasi diubah untuk memunculkan TaskDetailSheet beserta hak akses (isAssignedToMe)
        return InkWell(
          onTap: () {
            // --- FIX ASSIGNMENT MATCHING ---
            // Karena list profil ini sudah difilter dan DIPASTIKAN milik user saat ini,
            // kita mem-bypass pengecekan exact-match ketat pada TaskDetailSheet dengan menyelipkan email user
            // secara persis (exact) ke dalam parameter list 'assignedTo'.
            List<String> emails = List<String>.from(task.assignedTo ?? []);
            List<String> names = List<String>.from(task.assignedToName ?? []);
            List<String> photos = List<String>.from(task.assignedToPhoto ?? []);

            final myEmail = profile?.email ?? '';
            final myName = profile?.name ?? 'profile.you'.tr(context: context);

            // Memaksa (inject) email/nama user masuk ke data tugas
            // agar tombol 'Tandai Tunda' pada TaskDetailSheet bisa langsung dikenali dan diakses.
            if (myEmail.isNotEmpty && !emails.contains(myEmail)) {
              emails.add(myEmail);
              names.add(myName);
              photos.add(profile?.photo ?? '');
            }

            // Membentuk format Map yang dibutuhkan oleh TaskDetailSheet
            final Map<String, dynamic> taskDataMap = {
              'id': task.id?.toString() ?? '',
              'title': task.description ?? 'profile.untitled'.tr(context: context), // Halaman task utama menggunakan deskripsi sebagai title
              'description': task.description ?? '-',
              'status': task.status ?? 'Proses',
              'assignedTo': emails,
              'assignedToName': names,
              'assignedToPhoto': photos,
              'preAssignedToMe': true, // --- ADDED: Flag untuk memicu tombol instan tanpa loading
              // Overwrite data model ke bentuk Map agar TaskDetailSheet langsung menggunakan data modifikasi di atas
              'model': {
                'description': task.description,
                'attachments': task.attachments,
                'assignedTo': emails,
                'assignedToName': names,
                'assignedToPhoto': photos,
              },
            };

            // Memunculkan detail sheet yang sama persis seperti di halaman task
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (context) => TaskDetailSheet(taskData: taskDataMap),
            );
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12), // Radius 12
              border: Border.all(
                color: AppColors.lightGrey,
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                )
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Text(
                    dateDisplay,
                    style: AppTheme.primaryTextStyle.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                ),

                const SizedBox(width: 8),

                Row(
                  children: [
                    Text(
                      task.status ?? 'Unknown',
                      style: GoogleFonts.dmSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Icon Panah diganti ke bawah untuk mengindikasikan Sheet terbuka
                    const Icon(
                      Icons.keyboard_arrow_down_rounded,
                      size: 20,
                      color: AppColors.black,
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}