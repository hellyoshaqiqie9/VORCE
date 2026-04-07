part of 'staff.dart';

enum SortOption { newest, oldest, alphabet }

class StaffView extends HookConsumerWidget {
  const StaffView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final staffNotifier = ref.watch(staffStateNotifierProvider);
    final profile = ref.watch(profileStateNotifierProvider).dataOrNull;
    
    final isLoading = useState(true);
    final isAdmin = useState(false);
    final myEmail = useState('');

    useEffect(() {
      if (profile != null) {
        final roleStr = profile.jabatan?.toLowerCase() ?? '';
        isAdmin.value = roleStr.contains('admin');
        myEmail.value = profile.email;
      }
      return null;
    }, [profile]);

    // State untuk Search dan Sort
    final isSearching = useState(false);
    final searchQuery = useState('');
    final sortOption = useState(SortOption.newest);
    final searchController = useTextEditingController();

    Future<void> refresh() async {
      if (context.mounted) {
        await ref.read(staffStateNotifierProvider.notifier).getStaff().whenComplete(() => isLoading.value = false);
        // Fallback untuk membaca preferences jika profil belum di-load
        if (profile == null) {
          final pref = ref.read(appPreferenceProvider);
          await pref.read<String>(AppPreferenceKey.isAdmin).then((value) => isAdmin.value = value == 'true');
          await pref.read<String>(AppPreferenceKey.email).then((value) => myEmail.value = value ?? '');
        }
      }
    }

    // --- ACTIONS ---

    Future<void> kickStaffAction(String email, String name) async {
      AppBottomSheet.show(
        context,
        child: Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          child: SafeArea(
            bottom: true,
            child: AppWidgets.bottomSheet(
              title: "staff.kick".tr(context: context),
              buttonText: "staff.yes_kick".tr(context: context),
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  40.margin, // Jarak antar title dengan ikon diubah menjadi 40px
                  SvgPicture.asset(
                      Assets.icons.icDeleteStaff,
                      width: 21, // Lebar diubah menjadi 21
                      height: 16, // Tinggi diubah menjadi 16
                      colorFilter: const ColorFilter.mode(Colors.black, BlendMode.srcIn)
                  ),
                  10.margin,
                  Text(
                    "staff.kick_confirm".tr(context: context, args: [name]),
                    textAlign: TextAlign.center,
                    style: GoogleFonts.dmSans(
                      textStyle: AppTheme.primaryTextStyle.copyWith(
                        fontWeight: FontWeight.w500,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                  20.margin,
                  // Form alasan dihapus sesuai permintaan
                ],
              ),
              onTap: () async {
                context.pop();
                // Mengirimkan default reason "Dikeluarkan" karena form alasan sudah dihilangkan
                await ref.read(staffStateNotifierProvider.notifier).fireEmployee(email: email, reason: "Dikeluarkan").whenComplete(() {
                  AppToast.showToast(msg: "staff.success_kick".tr(context: context));
                  refresh();
                  if (context.canPop()) {
                    // Navigasi handled by user or pop
                  }
                });
              },
            ),
          ),
        ),
      );
    }

    Future<void> promoteStaffAction(String email) async {
      await ref.read(staffStateNotifierProvider.notifier).updateRole(email: email, action: 'promote').whenComplete(() {
        AppToast.showToast(msg: "staff.success_promote".tr(context: context));
        refresh();
      });
    }

    Future<void> demoteStaffAction(String email) async {
      await ref.read(staffStateNotifierProvider.notifier).updateRole(email: email, action: 'demote').whenComplete(() {
        AppToast.showToast(msg: "staff.success_demote".tr(context: context));
        refresh();
      });
    }

    Future<void> acceptCandidate(String email) async {
      await ref.read(staffStateNotifierProvider.notifier).verifyEmployee(email: email, approved: true).whenComplete((){
        AppToast.showToast(msg: "staff.candidate_accepted".tr(context: context));
        refresh();
      });
    }

    Future<void> rejectCandidate(String email) async {
      await ref.read(staffStateNotifierProvider.notifier).verifyEmployee(email: email, approved: false).whenComplete((){
        AppToast.showToast(msg: "staff.candidate_rejected".tr(context: context));
        refresh();
      });
    }

    void viewStaffProfile(Staff staff) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => StaffProfileView(
            staff: staff,
            onKick: isAdmin.value
                ? (email, name) async {
              await kickStaffAction(email, name);
              if(context.mounted) Navigator.pop(context);
            }
                : null,
          ),
        ),
      );
    }

    useEffect(() {
      Future.microtask(refresh);
      return null;
    }, []);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        titleSpacing: 0,
        // Kembalikan Arrow Back agar bisa kembali
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (isSearching.value) {
              isSearching.value = false;
              searchController.clear();
              searchQuery.value = '';
            } else {
              context.pop();
            }
          },
        ),
        title: isSearching.value
            ? TextField(
          controller: searchController,
          autofocus: true,
          onChanged: (value) => searchQuery.value = value,
          decoration: InputDecoration(
            hintText: "staff.search_hint".tr(context: context),
            hintStyle: GoogleFonts.dmSans(
              textStyle: AppTheme.primaryTextStyle.copyWith(color: Colors.grey),
            ),
            border: InputBorder.none,
          ),
          style: GoogleFonts.dmSans(
            textStyle: AppTheme.primaryTextStyle.copyWith(color: Colors.black),
          ),
        )
            : Text(
          "staff.title".tr(context: context),
          style: GoogleFonts.dmSans(
            textStyle: AppTheme.primaryTextStyle.copyWith(
              color: Colors.black,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
        ),
        actions: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 40,
                child: IconButton(
                  padding: EdgeInsets.zero,
                  icon: Icon(isSearching.value ? Icons.close : Icons.search),
                  onPressed: () {
                    isSearching.value = !isSearching.value;
                    if (!isSearching.value) {
                      searchQuery.value = '';
                      searchController.clear();
                    }
                  },
                ),
              ),
              if (!isSearching.value)
                SizedBox(
                  width: 40,
                  child: IconButton(
                    padding: EdgeInsets.zero,
                    icon: Icon(
                      Icons.swap_vert,
                      color: (sortOption.value == SortOption.newest || sortOption.value == SortOption.oldest)
                          ? Colors.black
                          : Colors.grey,
                    ),
                    onPressed: () {
                      if (sortOption.value == SortOption.newest) {
                        sortOption.value = SortOption.oldest;
                        AppToast.showToast(msg: "staff.sort_oldest".tr(context: context));
                      } else {
                        sortOption.value = SortOption.newest;
                        AppToast.showToast(msg: "staff.sort_newest".tr(context: context));
                      }
                    },
                  ),
                ),
              if (!isSearching.value)
                SizedBox(
                  width: 40,
                  child: IconButton(
                    padding: EdgeInsets.zero,
                    icon: Icon(
                        Icons.sort_by_alpha,
                        color: sortOption.value == SortOption.alphabet ? Colors.black : Colors.grey
                    ),
                    onPressed: () {
                      sortOption.value = SortOption.alphabet;
                      AppToast.showToast(msg: "staff.sort_az".tr(context: context));
                    },
                  ),
                ),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: AppStateX(staffNotifier).maybeWhen(
        loading: () => const Center(child: CircularProgressIndicator()),
        success: (data) => buildStaffList(
          context,
          data,
          isAdmin.value,
          myEmail.value,
          searchQuery.value,
          sortOption.value,
          onKick: kickStaffAction,
          onPromote: promoteStaffAction,
          onDemote: demoteStaffAction,
          onAccept: acceptCandidate,
          onReject: rejectCandidate,
          onViewProfile: viewStaffProfile,
        ),
        failed: (e) => AppWidgets.errorWidget(
            message: e.message,
            onRetry: refresh
        ),
        orElse: () => const SizedBox(),
      ),
      floatingActionButton: isAdmin.value
          ? FloatingActionButton(
        onPressed: () => context.pushNamed(Routes.staffInvite),
        backgroundColor: AppColors.featurePurple,
        shape: const CircleBorder(),
        child: const Icon(Icons.add, color: Colors.white),
      )
          : null,
    );
  }
}

Widget buildStaffList(
    BuildContext context,
    List<dynamic> staffsRaw,
    bool isAdmin,
    String myEmail,
    String searchQuery,
    SortOption sortOption,
    {
      required Function(String email, String name) onKick,
      required Function(String email) onPromote,
      required Function(String email) onDemote,
      required Function(String email) onAccept,
      required Function(String email) onReject,
      required Function(Staff staff) onViewProfile,
    }) {

  var staffs = staffsRaw.map((e) => e is Staff ? e : Staff.fromJson(e as Map<String, dynamic>)).toList();

  if (searchQuery.isNotEmpty) {
    staffs = staffs.where((s) {
      final nameLower = (s.namaKaryawan ?? '').toLowerCase();
      final queryLower = searchQuery.toLowerCase();
      return nameLower.contains(queryLower);
    }).toList();
  }

  int sortComparator(Staff a, Staff b) {
    switch (sortOption) {
      case SortOption.newest:
        return (b.id ?? 0).compareTo(a.id ?? 0);
      case SortOption.oldest:
        return (a.id ?? 0).compareTo(b.id ?? 0);
      case SortOption.alphabet:
        return (a.namaKaryawan ?? '').compareTo(b.namaKaryawan ?? '');
    }
  }

  final me = staffs.where((s) => s.alamatEmail == myEmail).toList();
  var candidates = staffs.where((s) => s.jabatan == 'Candidate' && !me.contains(s)).toList();

  // Memisahkan Admin dan Staff agar Admin selalu berada di urutan atas (setelah 'Me')
  var admins = staffs.where((s) => s.jabatan == 'Admin' && !me.contains(s)).toList();
  var regularStaff = staffs.where((s) =>
  s.jabatan == 'Staff' &&
      !me.contains(s)
  ).toList();

  var rejected = staffs.where((s) => s.jabatan == 'Rejected').toList();

  candidates.sort(sortComparator);
  admins.sort(sortComparator);
  regularStaff.sort(sortComparator);
  rejected.sort(sortComparator);

  final allStaffs = [
    ...me,
    ...admins,        // Admin selalu di atas
    ...regularStaff,  // Diikuti Staff biasa
    ...rejected,
    ...candidates,    // Kandidat dipindah agar selalu urutan paling bawah
  ];

  if (allStaffs.isEmpty) {
    return Center(child: AppWidgets.emptyWidget(message: "staff.no_data".tr(context: context)));
  }

  return RefreshIndicator(
    onRefresh: () async {},
    child: ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      itemCount: allStaffs.length,
      itemBuilder: (context, index) {
        final s = allStaffs[index];
        final isMe = me.contains(s);
        final isCandidate = candidates.contains(s);
        final isRejected = rejected.contains(s);

        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: _SimplifiedStaffCard(
            staff: s,
            isMe: isMe,
            isAdminView: isAdmin,
            isCandidate: isCandidate,
            isRejected: isRejected,
            showApproveReject: isCandidate && isAdmin, // Menampilkan tombol Approve/Reject kembali
            onKick: () => onKick(s.alamatEmail ?? '', s.namaKaryawan ?? ''),
            onAccept: () => onAccept(s.alamatEmail ?? ''),
            onReject: () => onReject(s.alamatEmail ?? ''),
            onViewProfile: () => onViewProfile(s),
          ),
        );
      },
    ),
  );
}

class _SimplifiedStaffCard extends StatelessWidget {
  final Staff staff;
  final bool isMe;
  final bool isAdminView;
  final bool isCandidate;
  final bool isRejected;
  final bool showApproveReject; // Variabel boolean dikembalikan
  final VoidCallback? onKick;
  final VoidCallback? onAccept;
  final VoidCallback? onReject;
  final VoidCallback? onViewProfile;

  const _SimplifiedStaffCard({
    required this.staff,
    this.isMe = false,
    this.isAdminView = false,
    this.isCandidate = false,
    this.isRejected = false,
    this.showApproveReject = false, // Menambahkan inisialisasi boolean
    this.onKick,
    this.onAccept,
    this.onReject,
    this.onViewProfile,
  });

  @override
  Widget build(BuildContext context) {
    // Logic untuk menentukan Role Admin
    bool isAdminRole = (staff.jabatan?.toLowerCase() ?? '') == 'admin';
    Color nameColor = isRejected ? Colors.grey : Colors.black87;

    return InkWell(
      onTap: (!isCandidate && !isRejected && onViewProfile != null) ? onViewProfile : null,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: Colors.grey.shade200,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 4,
                offset: const Offset(0, 2),
              )
            ]
        ),
        child: Row(
          children: [
            Stack(
              children: [
                CircleAvatar(
                    radius: 18,
                    backgroundColor: isMe ? Colors.blue.withOpacity(0.1) : Colors.grey.shade100,
                    backgroundImage: (staff.foto != null && staff.foto!.isNotEmpty)
                        ? NetworkImage(staff.foto!)
                        : null,
                    child: (staff.foto != null && staff.foto!.isNotEmpty)
                        ? null
                        : Text(
                      (staff.namaKaryawan?.isNotEmpty == true) ? staff.namaKaryawan![0].toUpperCase() : "?",
                      style: GoogleFonts.dmSans(
                        textStyle: AppTheme.primaryTextStyle.copyWith(fontWeight: FontWeight.bold, color: Colors.black54),
                      ),
                    )
                ),
                if (isAdminRole && (staff.foto == null || staff.foto!.isEmpty))
                  Positioned(
                    left: 0, top: 0,
                    child: Container(
                      padding: const EdgeInsets.all(1),
                      decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                      child: const Icon(Icons.shield, color: Colors.black, size: 10),
                    ),
                  )
              ],
            ),
            12.margin,
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          staff.namaKaryawan ?? "staff.no_name".tr(context: context),
                          style: GoogleFonts.dmSans(
                            textStyle: AppTheme.primaryTextStyle.copyWith(
                              fontWeight: FontWeight.w600,
                              color: nameColor,
                              decoration: isRejected ? TextDecoration.lineThrough : null,
                            ),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  // Teks "Kandidat" sudah dihilangkan dari sini
                ],
              ),
            ),

            // --- Kanan ---
            if (showApproveReject)
              Row(
                children: [
                  InkWell(
                    onTap: onAccept,
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      height: 24,
                      alignment: Alignment.center,
                      padding: const EdgeInsets.symmetric(horizontal: 12), // Padding horizontal saja
                      decoration: BoxDecoration(
                        color: AppColors.featurePurple,
                        borderRadius: BorderRadius.circular(8), // Radius 8px
                      ),
                      child: Text(
                        "staff.accept".tr(context: context),
                        style: GoogleFonts.dmSans(
                          fontSize: 14, // Ukuran teks diubah menjadi 14px
                          fontWeight: FontWeight.w500,
                          color: Colors.white,
                          height: 1.0, // Mencegah spasi vertikal tambahan dari font
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  InkWell(
                    onTap: onReject,
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      height: 24,
                      alignment: Alignment.center,
                      padding: const EdgeInsets.symmetric(horizontal: 12), // Padding horizontal saja
                      decoration: BoxDecoration(
                        color: AppColors.merah,
                        borderRadius: BorderRadius.circular(8), // Radius 8px
                      ),
                      child: Text(
                        "staff.reject".tr(context: context),
                        style: GoogleFonts.dmSans(
                          fontSize: 14, // Ukuran teks diubah menjadi 14px
                          fontWeight: FontWeight.w500,
                          color: Colors.white,
                          height: 1.0, // Mencegah spasi vertikal tambahan dari font
                        ),
                      ),
                    ),
                  ),
                ],
              )
            else if (!isRejected && !isCandidate)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Menampilkan ikon admin jika user tersebut admin
                  if (isAdminRole)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4.0),
                      child: SvgPicture.asset(
                        Assets.icons.icAdmin,
                        width: 16,
                        height: 16,
                      ),
                    ),
                  // Menampilkan ikon hapus untuk Admin jika yang login adalah admin dan bukan dirinya sendiri
                  if (isAdminView && !isMe)
                    InkWell(
                      onTap: onKick,
                      borderRadius: BorderRadius.circular(20),
                      child: Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: SvgPicture.asset(
                          Assets.icons.icDeleteStaff,
                          width: 21, // Lebar diubah menjadi 21
                          height: 16, // Tinggi diubah menjadi 16
                          colorFilter: const ColorFilter.mode(Colors.black, BlendMode.srcIn),
                        ),
                      ),
                    ),
                ],
              )
            else if (isRejected && isAdminView)
                InkWell(
                  onTap: onKick,
                  child: Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: SvgPicture.asset(
                      Assets.icons.icDeleteStaff,
                      width: 21, // Lebar diubah menjadi 21
                      height: 16, // Tinggi diubah menjadi 16
                      colorFilter: const ColorFilter.mode(Colors.black, BlendMode.srcIn),
                    ),
                  ),
                )
          ],
        ),
      ),
    );
  }
}