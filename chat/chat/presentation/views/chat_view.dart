part of 'chat.dart';

class ChatViewExtra {
  final String type;
  final String data;

  const ChatViewExtra({required this.type, required this.data});
}

class ChatView extends HookConsumerWidget {
  final dynamic extra;

  const ChatView({super.key, this.extra});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ChatViewExtra? safeExtra;
    if (extra is ChatViewExtra) {
      safeExtra = extra;
    } else if (extra is Map) {
      safeExtra = ChatViewExtra(
        type: extra['type']?.toString() ?? '',
        data: extra['data']?.toString() ?? '',
      );
    }

    final isLoading = useState(true);
    final isError = useState(false);
    final errorMsg = useState('');
    final isExtra = useState(safeExtra != null);
    final isSearch = useState(false);
    final txtSearchController = useTextEditingController();

    // WATCH ONLINE USERS & COMPANY LOGO
    final groupId = ref.watch(horaChatGroupIdProvider);
    final onlineCountAsync = ref.watch(onlineUsersCountProvider(groupId));
    final companyLogo = ref.watch(horaCompanyLogoProvider);

    // [PERBAIKAN] Mengelola Lifecycle Online Status dan Notification Listener
    useEffect(() {
      if (groupId.isEmpty) return null;

      final controller = ref.read(horaChatControllerProvider);

      // Update status online saat pertama buka
      controller.updateOnlineStatus(groupId, true);

      // [ADDED] Pengecekan real-time status online dengan Timer setiap 30 detik
      // agar `lastSeen` tertrigger terus menerus dan yang inactive otomatis dihapus stream
      final timer = Timer.periodic(const Duration(seconds: 30), (timer) {
        if (!context.mounted) {
           timer.cancel();
           return;
        }
        controller.updateOnlineStatus(groupId, true);
      });

      // [ADDED] Tandai chat sudah dibaca saat masuk (dengan groupId)
      controller.markChatAsRead(groupId);

      // Cleanup function saat widget di-dispose (User keluar dari chat)
      return () {
        timer.cancel();
        controller.updateOnlineStatus(groupId, false);
        // [PERBAIKAN] Matikan listener notifikasi saat keluar chat untuk mencegah double notif
        controller.disposeChatListener();
      };
    }, [groupId]);

    // [ADDED] Fungsi untuk handle saat keluar chat (tombol back atau gesture)
    Future<void> handlePop() async {
      if (groupId.isNotEmpty) {
        final controller = ref.read(horaChatControllerProvider);
        // Tandai baca ulang untuk memastikan pesan terbaru saat chat terbuka ter-cover
        await controller.markChatAsRead(groupId);
        // Refresh provider di Home agar badge hilang
        ref.refresh(unreadChatCountStreamProvider(groupId));
      }
    }

    Future<void> setError(String msg) async {
      if (!context.mounted) return;
      isError.value = true;
      errorMsg.value = msg;
    }

    Future<void> onExtra() async {
      final groupIdRef = ref.watch(horaChatGroupIdProvider);
      if (safeExtra == null) return;
      try {
        switch (safeExtra!.type) {
          case 'draft':
            ref.read(chatDraftMessageProvider.notifier).state = safeExtra!.data;
            break;
          case 'message':
            await ref.read(horaChatControllerProvider).sendMessage(text: safeExtra!.data, targetId: groupIdRef);
            break;
          case 'image':
            await ref.read(horaChatControllerProvider).sendImageSendMessage(filePath: safeExtra!.data, targetId: groupIdRef);
            break;
          case 'video':
            await ref.read(horaChatControllerProvider).sendVideoSendMessage(filePath: safeExtra!.data, targetId: groupIdRef);
            break;
          case 'task':
            final parts = safeExtra!.data.split('|');
            if (parts.length >= 2) {
              final tId = parts[0];
              final tTitle = parts.sublist(1).join('|');
              await ref.read(horaChatControllerProvider).sendTaskMessage(
                  taskId: tId,
                  taskTitle: tTitle,
                  targetId: groupIdRef
              );
            }
            break;
          case 'leave_request':
            final parts = safeExtra!.data.split('|');
            if (parts.length >= 2) {
              final lId = parts[0];
              final lTitle = parts.sublist(1).join('|');
              await ref.read(horaChatControllerProvider).sendLeaveMessage(
                leaveId: lId,
                leaveTitle: lTitle,
                targetId: groupIdRef,
              );
            }
            break;
          case 'profile_share':
            await ref.read(horaChatControllerProvider).sendProfileMessage(
              targetId: groupIdRef,
            );
            break;
          case 'file_share':
            final parts = safeExtra!.data.split('|');
            if (parts.length >= 5) {
              final url = parts[0];
              final name = parts[1];
              final sizeStr = parts[2];
              final mimeType = parts[3];
              final typeString = parts[4];
              int byteSize = 0;
              try { byteSize = int.parse(sizeStr); } catch (_) {}
              
              await ref.read(horaChatControllerProvider).sendSharedMediaMessage(
                downloadUrl: url,
                name: name,
                size: byteSize,
                mimeType: mimeType,
                typeString: typeString,
                targetId: groupIdRef,
              );
            }
            break;
          case 'reimbursement':
            final parts = safeExtra!.data.split('|');
            if (parts.length >= 3) {
              final rId = parts[0];
              final rTitle = parts[1];
              final rAmount = parts[2];
              await ref.read(horaChatControllerProvider).sendReimbursementMessage(
                reimbursementId: rId,
                title: rTitle,
                amount: rAmount,
                targetId: groupIdRef,
              );
            }
            break;
          case 'contact_share':
            final parts = safeExtra!.data.split('|');
            if (parts.length >= 3) {
              final contactId = parts[0];
              final shareToken = parts[1];
              final contactName = parts.sublist(2).join('|');

              await ref.read(horaChatControllerProvider).sendContactMessage(
                contactId: contactId,
                shareToken: shareToken,
                contactName: contactName,
                targetId: groupIdRef,
              );
            }
            break;
          case 'recording':
            final parts = safeExtra!.data.split('|');
            if (parts.length >= 3) {
              final filePath = parts[0];
              final duration = parts[1];
              final amplitudes = parts[2];

              await ref.read(horaChatControllerProvider).sendRecordingMessage(
                filePath: filePath,
                durationText: duration,
                amplitudes: amplitudes,
                targetId: groupIdRef,
              );
            }
            break;
        }
        isExtra.value = false;
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('chat.share_failed'.tr(args: [e.toString()]))));
      }
    }

    Future<void> init() async {
      isLoading.value = true;
      isError.value = false;

      final minLoaderDuration = Future.delayed(const Duration(milliseconds: 1000));

      try {
        final savedName = await ref.read(appPreferenceProvider).read<String>(AppPreferenceKey.name);
        final companyId = await ref.read(appPreferenceProvider).read<String>(AppPreferenceKey.idperusahaan);

        // [FIX] Mengambil UID dan Email
        final user = FirebaseAuth.instance.currentUser;
        final String? myUid = user?.uid;
        final String? myEmail = user?.email;

        if (companyId == null || myUid == null) {
          return setError("chat.login_incomplete".tr());
        }

        ref.read(horaChatIdProvider.notifier).state = myUid;
        ref.read(horaChatNameProvider.notifier).state = savedName ?? "User";
        ref.read(horaChatGroupIdProvider.notifier).state = companyId;

        if (myEmail != null) {
          ref.read(horaChatEmailProvider.notifier).state = myEmail;
        }

        await ref.read(horaChatControllerProvider).initChatService(companyId);

      } catch (e) {
        await setError("chat.init_failed".tr(args: [e.toString()]));
      } finally {
        await minLoaderDuration;

        if (context.mounted) {
          isLoading.value = false;

          if (isExtra.value && !isError.value) {
            await onExtra();
          }
        }
      }
    }

    useEffect(() {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        init();
      });
      return null;
    }, []);

    // Widget Helper Title
    Widget buildAppBarTitle() {
      if (isSearch.value) {
        return TextField(
          autofocus: true,
          controller: txtSearchController,
          style: AppTheme.primaryTextStyle.copyWith(color: Colors.white),
          cursorColor: Colors.white,
          decoration: InputDecoration(
            hintText: 'chat.search_hint'.tr(context: context),
            hintStyle: TextStyle(color: Colors.white70),
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
          ),
          onChanged: (value) {},
        );
      }

      return Row(
        children: [
          // [LOGO PERUSAHAAN]
          Container(
            margin: const EdgeInsets.only(right: 10),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 1.5),
            ),
            child: companyLogo.isNotEmpty
                ? CircleAvatar(
              radius: 12,
              backgroundColor: Colors.white24,
              backgroundImage: NetworkImage(companyLogo),
              onBackgroundImageError: (_, __) => const Icon(Icons.business, color: Colors.white, size: 12),
            )
                : const CircleAvatar(
              radius: 12,
              backgroundColor: Colors.white24,
              child: Icon(Icons.business, color: Colors.white, size: 14),
            ),
          ),

          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              onlineCountAsync.when(
                data: (count) {
                  return Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: count > 0 ? AppColors.ijo : Colors.grey.shade400,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 1),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        "$count Online",
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  );
                },
                loading: () => const Text(
                  "Memuat...",
                  style: TextStyle(fontSize: 12, color: Colors.white70),
                ),
                error: (err, stack) => const SizedBox.shrink(),
              ),
            ],
          ),
        ],
      );
    }

    // [ADDED] PopScope untuk menghandle tombol back dan refresh
    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) async {
        if (didPop) return;
        await handlePop();
        if (context.mounted) {
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: AppColors.featurePurple,
          elevation: 0,
          iconTheme: const IconThemeData(color: Colors.white),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            // Override tombol back di AppBar juga
            onPressed: () async {
              await handlePop();
              if (context.mounted) {
                Navigator.pop(context);
              }
            },
          ),
          title: buildAppBarTitle(),
          actions: [
            IconButton(
              icon: Icon(
                !isSearch.value ? Icons.search_outlined : Icons.close,
                color: Colors.white,
              ),
              onPressed: () {
                isSearch.value = !isSearch.value;
                txtSearchController.clear();
              },
            ),
          ],
        ),
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: AppWidgets.layoutWithSkeletonizer(
                  enabled: isLoading.value,
                  child: isError.value
                      ? AppWidgets.errorWidget(onRetry: init, message: errorMsg.value)
                      : _ChatContentHora(txtSearchController: txtSearchController),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}