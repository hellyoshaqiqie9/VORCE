part of '../views/chat.dart';

class _HoraChatInputField extends HookConsumerWidget {
  const _HoraChatInputField({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final messageController = useTextEditingController();
    final groupId = ref.watch(horaChatGroupIdProvider);
    final isSending = useState(false);

    // Data User Sendiri
    final myUserId = ref.watch(horaChatIdProvider);
    final myUserName = ref.watch(horaChatNameProvider);
    final myUserEmail = ref.watch(horaChatEmailProvider);

    // --- STATE UI TOGGLE ---
    final showAttachmentMenu = useState(false);
    final isRecordingMode = useState(false);

    // --- TYPING & MENTION STATE ---
    final typingTimer = useRef<Timer?>(null);
    final isTyping = useState(false);
    final showMentions = useState(false);
    final mentionQuery = useState("");
    final mentionCursorIndex = useState<int>(-1);
    final staffState = ref.watch(staffStateNotifierProvider);

    // --- LINK PREVIEW STATE (OG) ---
    final ogData = useState<Map<String, String>?>(null); // {title, desc, image}
    final isOgLoading = useState(false);
    final ogDebounce = useRef<Timer?>(null);
    final lastCheckedUrl = useRef<String>("");
    final isOgClosedByUser = useState(false);

    // --- RECORDING STATE ---
    final recorderModule = useMemoized(() => FlutterSoundRecorder());
    final isRecorderInited = useState(false);
    final isPaused = useState(false);
    final timerText = useState("00:00:00");
    final amplitudeHistory = useState<List<double>>([]);
    final recorderSubscription = useRef<StreamSubscription?>(null);
    final stopwatch = useMemoized(() => Stopwatch());
    final timer = useRef<Timer?>(null);
    final recordedFilePath = useRef<String?>(null);

    // Watch Providers
    final replyMessage = ref.watch(chatReplyMessageProvider);
    final draftMsg = ref.watch(chatDraftMessageProvider);
    final focusNode = useFocusNode();

    // --- OVERLAY STATE ---
    final layerLink = useMemoized(() => LayerLink());
    final overlayEntry = useRef<OverlayEntry?>(null);

    // --- LISTENER FOCUS NODE ---
    useEffect(() {
      void onFocusChange() {
        if (focusNode.hasFocus) {
          showAttachmentMenu.value = false;
        } else {
          Future.delayed(const Duration(milliseconds: 200), () {
            if (context.mounted && !focusNode.hasFocus && showMentions.value) {
              showMentions.value = false;
            }
          });
        }
      }
      focusNode.addListener(onFocusChange);
      return () => focusNode.removeListener(onFocusChange);
    }, [focusNode]);

    // --- HELPER FETCH OG DATA ---
    Future<void> fetchOG(String url) async {
      // Set loading true dan reset ogData agar Skeleton muncul
      isOgLoading.value = true;
      ogData.value = null;

      try {
        final dio = Dio();
        final validUrl = url.startsWith('http') ? url : 'https://$url';

        final response = await dio.get(
          validUrl,
          options: Options(
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            receiveTimeout: const Duration(seconds: 5),
          ),
        );

        if (messageController.text.trim().isEmpty) return;

        if (response.statusCode == 200) {
          final html = response.data.toString();

          final titleReg = RegExp(r'<meta property="og:title" content="([^"]+)"', caseSensitive: false);
          final descReg = RegExp(r'<meta property="og:description" content="([^"]+)"', caseSensitive: false);
          final imgReg = RegExp(r'<meta property="og:image" content="([^"]+)"', caseSensitive: false);
          final fallbackTitleReg = RegExp(r'<title[^>]*>(.*?)</title>', caseSensitive: false);

          String? title = titleReg.firstMatch(html)?.group(1);
          String? description = descReg.firstMatch(html)?.group(1);
          String? image = imgReg.firstMatch(html)?.group(1);

          if (title == null || title.isEmpty) {
            title = fallbackTitleReg.firstMatch(html)?.group(1);
          }

          title = title?.replaceAll('&amp;', '&').replaceAll('&quot;', '"');

          ogData.value = {
            'title': title ?? url,
            'description': description ?? url,
            'image': image ?? '',
          };
        } else {
          // Fallback jika status code bukan 200
          ogData.value = {'title': url, 'description': url, 'image': ''};
        }
      } catch (e) {
        // Fallback jika error (misal offline/404), tetap tampilkan box dengan URL
        if (messageController.text.trim().isNotEmpty) {
          ogData.value = {'title': url, 'description': 'Link Preview', 'image': ''};
        }
      } finally {
        isOgLoading.value = false;
      }
    }

    // --- HELPER STAFF DATA ---
    List<dynamic> getStaffList() {
      return AppStateX(staffState).maybeWhen(success: (data) => (data is List) ? data : [], orElse: () => []);
    }

    String getDisplayName(dynamic staff) {
      String name = 'Unknown';
      if (staff is Map) {
        name = staff['namaKaryawan'] ?? staff['username'] ?? staff['idkaryawan'] ?? '';
      } else {
        name = (staff as dynamic).namaKaryawan ?? (staff as dynamic).username ?? '';
      }
      if (name.contains('@')) name = name.split('@')[0];
      return name;
    }

    String? getAvatarUrl(dynamic staff) {
      try {
        if (staff is Map) return staff['photoURL'] ?? staff['foto'];
        final d = staff as dynamic;
        try { return d.photoURL; } catch (_) {}
        try { return d.foto; } catch (_) {}
      } catch (_) {}
      return null;
    }

    String? getMyAvatarUrl() {
      final staffs = getStaffList();
      if (staffs.isEmpty) return null;
      final normalizedId = myUserId.toLowerCase();
      final normalizedEmail = myUserEmail.toLowerCase();

      for (var s in staffs) {
        try {
          Map<String, dynamic> itemMap;
          if (s is Map) {
            itemMap = s as Map<String, dynamic>;
          } else {
            try { itemMap = (s as dynamic).toJson(); } catch (_) { continue; }
          }
          final uid = itemMap['uid']?.toString() ?? itemMap['userId']?.toString();
          final idKaryawan = itemMap['idkaryawan']?.toString();
          final email = itemMap['email'] ?? itemMap['alamatEmail'];
          final isMe = itemMap['isMe'] == true;

          if (isMe) return itemMap['photoURL'] ?? itemMap['foto'];
          if (email != null && email.toString().toLowerCase() == normalizedEmail) return itemMap['photoURL'] ?? itemMap['foto'];
          if (uid != null && uid.toLowerCase() == normalizedId) return itemMap['photoURL'] ?? itemMap['foto'];
          if (idKaryawan != null && idKaryawan.toLowerCase() == normalizedId) return itemMap['photoURL'] ?? itemMap['foto'];
        } catch (_) {}
      }
      return null;
    }

    String getReplyAuthorName(types.Message? msg) {
      if (msg == null) return "Unknown";
      final authorId = msg.author.id;
      if (authorId == myUserId) return myUserName.isNotEmpty ? myUserName : 'Saya';
      if (myUserEmail.isNotEmpty) {
        final legacyId = myUserEmail.replaceAll('.', '_').replaceAll('@', '_');
        if (authorId == legacyId || authorId == myUserEmail) return myUserName.isNotEmpty ? myUserName : 'Saya';
      }
      if (msg.author.firstName != null && msg.author.firstName!.isNotEmpty) return msg.author.firstName!;

      final staffs = getStaffList();
      if (staffs.isNotEmpty) {
        final normalizedId = authorId.toLowerCase();
        for (var s in staffs) {
          String? email; String? name; String? idKaryawan; String? uid;
          if (s is Map<String, dynamic>) {
            email = s['alamatEmail']; name = s['namaKaryawan']; idKaryawan = s['idkaryawan']; uid = s['uid']?.toString() ?? s['userId']?.toString();
          } else {
            try {
              final dynamicObj = s as dynamic;
              email = dynamicObj.alamatEmail; name = dynamicObj.namaKaryawan; idKaryawan = dynamicObj.idkaryawan; uid = dynamicObj.uid?.toString();
            } catch (_) { continue; }
          }
          if (uid != null && uid.toLowerCase() == normalizedId) return name ?? uid!;
          if (idKaryawan != null && idKaryawan.toString().toLowerCase() == normalizedId) return name ?? idKaryawan!;
          if (email != null) {
            final transformedEmailId = email.replaceAll(RegExp(r'[.@]+'), '_').toLowerCase();
            if (transformedEmailId == normalizedId) return name ?? email;
          }
        }
      }
      String cleanName = authorId;
      if (cleanName.contains('_gmail_com')) cleanName = cleanName.replaceAll('_gmail_com', '');
      else if (cleanName.contains('@')) cleanName = cleanName.split('@')[0];
      return cleanName;
    }

    String getReplyPreviewText(types.Message? msg) {
      if (msg == null) return "";
      if (msg is types.TextMessage) return msg.text;
      if (msg is types.ImageMessage) return "📷 Image";
      if (msg is types.VideoMessage) return "📹 Video";
      if (msg is types.FileMessage) return "📄 Document";
      if (msg is types.AudioMessage) return "🎵 Audio";
      return "Custom Message";
    }

    // --- INIT RECORDER ---
    useEffect(() {
      Future<void> initRecorder() async {
        try {
          await recorderModule.openRecorder();
          await recorderModule.setSubscriptionDuration(const Duration(milliseconds: 50));
          if (context.mounted) isRecorderInited.value = true;
        } catch (e) {
          debugPrint("Gagal init recorder: $e");
        }
      }
      initRecorder();
      return () {
        recorderModule.closeRecorder();
        recorderSubscription.value?.cancel();
        timer.value?.cancel();
        ogDebounce.value?.cancel();
      };
    }, []);

    // --- INPUT LISTENER (CORE LOGIC) ---
    useEffect(() {
      void listener() {
        final text = messageController.text;

        // 1. TYPING INDICATOR
        if (text.isNotEmpty) {
          if (!isTyping.value) {
            isTyping.value = true;
            final myPhoto = getMyAvatarUrl();
            ref.read(horaChatControllerProvider).sendTypingStatus(groupId, true, photoUrl: myPhoto);
          }
          typingTimer.value?.cancel();
          typingTimer.value = Timer(const Duration(seconds: 2), () {
            isTyping.value = false;
            ref.read(horaChatControllerProvider).sendTypingStatus(groupId, false);
          });
        } else {
          if (isTyping.value) {
            isTyping.value = false;
            typingTimer.value?.cancel();
            ref.read(horaChatControllerProvider).sendTypingStatus(groupId, false);
          }
        }

        // 2. MENTION LOGIC
        final selection = messageController.selection;
        if (selection.baseOffset >= 0) {
          final textBeforeCursor = text.substring(0, selection.baseOffset);
          final atIndex = textBeforeCursor.lastIndexOf('@');

          if (atIndex != -1) {
            bool validStart = atIndex == 0 || textBeforeCursor[atIndex - 1].trim().isEmpty;
            if (validStart) {
              final query = textBeforeCursor.substring(atIndex + 1);
              if (!query.contains('\n')) {
                showMentions.value = true;
                mentionQuery.value = query;
                mentionCursorIndex.value = atIndex;

                if (!focusNode.hasFocus) {
                  focusNode.requestFocus();
                }
                return;
              }
            }
          }
        }
        showMentions.value = false;

        // 3. DETEKSI URL UNTUK OG PREVIEW
        if (text.trim().isEmpty) {
          ogDebounce.value?.cancel();
          ogData.value = null;
          isOgLoading.value = false;
          isOgClosedByUser.value = false;
          lastCheckedUrl.value = "";
        } else {
          final urlRegex = RegExp(
            r'((https?:\/\/)|(www\.))?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)',
            caseSensitive: false,
          );

          final match = urlRegex.firstMatch(text);
          if (match != null) {
            final detectedUrl = match.group(0)!;

            if (detectedUrl != lastCheckedUrl.value) {
              ogDebounce.value?.cancel();
              lastCheckedUrl.value = detectedUrl;
              isOgClosedByUser.value = false;

              // Debounce 500ms
              ogDebounce.value = Timer(const Duration(milliseconds: 500), () {
                if (!isOgClosedByUser.value) {
                  fetchOG(detectedUrl);
                }
              });
            }
          } else {
            if (ogData.value != null || isOgLoading.value) {
              ogData.value = null;
              isOgLoading.value = false;
              lastCheckedUrl.value = "";
            }
          }
        }
      }

      messageController.addListener(listener);
      return () {
        messageController.removeListener(listener);
        typingTimer.value?.cancel();
        ogDebounce.value?.cancel();
      };
    }, [messageController, groupId]);

    // --- DRAFT EFFECT ---
    useEffect(() {
      if (draftMsg.isNotEmpty) {
        Future.microtask(() {
          messageController.text = draftMsg;
          messageController.selection = TextSelection.fromPosition(TextPosition(offset: messageController.text.length));
          ref.read(chatDraftMessageProvider.notifier).state = "";
        });
      }
      return null;
    }, [draftMsg]);

    useEffect(() {
      if (replyMessage != null) focusNode.requestFocus();
      return null;
    }, [replyMessage]);

    // --- ACTIONS ---
    void cancelReply() => ref.read(chatReplyMessageProvider.notifier).state = null;

    void cancelOg() {
      ogDebounce.value?.cancel();
      ogData.value = null;
      isOgLoading.value = false;
      isOgClosedByUser.value = true;
    }

    void onMentionSelected(String cleanName) {
      focusNode.requestFocus();

      final text = messageController.text;
      int idx = mentionCursorIndex.value;

      if (idx < 0 || idx >= text.length || text[idx] != '@') {
        final cursor = messageController.selection.isValid ? messageController.selection.baseOffset : text.length;
        final searchEnd = (cursor >= 0 && cursor <= text.length) ? cursor : text.length;
        final tempText = text.substring(0, searchEnd);
        idx = tempText.lastIndexOf('@');
      }

      if (idx != -1 && idx < text.length) {
        final textBeforeAt = text.substring(0, idx);
        final queryLen = mentionQuery.value.length;
        int textEndIndex = idx + 1 + queryLen;
        if (textEndIndex > text.length) textEndIndex = text.length;

        String textAfterCursor = "";
        if (textEndIndex < text.length) textAfterCursor = text.substring(textEndIndex);

        final newText = "$textBeforeAt@$cleanName $textAfterCursor";
        messageController.text = newText;

        final newCursorPos = idx + 1 + cleanName.length + 1;
        messageController.selection = TextSelection.fromPosition(
            TextPosition(offset: newCursorPos <= newText.length ? newCursorPos : newText.length)
        );
      }

      showMentions.value = false;
      mentionQuery.value = "";
    }

    void sendMessage() async {
      final text = messageController.text.trim();
      if (text.isEmpty || isSending.value) return;
      isSending.value = true;
      try {
        String finalText = text;
        final staffs = getStaffList();
        List<String> allNames = staffs.map((s) => getDisplayName(s)).toList();
        allNames.sort((a, b) => b.length.compareTo(a.length));

        for (String name in allNames) {
          if (name.isNotEmpty) {
            final pattern = "@$name";
            if (finalText.contains(pattern)) finalText = finalText.replaceAll(pattern, "@{$name}");
          }
        }

        // [PERBAIKAN] Regex ini sekarang bisa mendeteksi nama yang mengandung spasi
        // dengan membaca teks dari karakter '@' sampai menemukan 'p!'
        final pingRegex = RegExp(r'(@[^@\n]+?)\s+[pP]!\s*$');
        if (pingRegex.hasMatch(finalText)) {
          finalText = finalText.replaceAllMapped(pingRegex, (match) => '${match.group(1)} PING!!!');
        }

        final currentReply = ref.read(chatReplyMessageProvider);
        String? replyAuthorName;
        if (currentReply != null) replyAuthorName = getReplyAuthorName(currentReply);

        await ref.read(horaChatControllerProvider).sendMessage(
          text: finalText,
          targetId: groupId,
          replyMessage: currentReply,
          replyName: replyAuthorName,
          extraMetadata: {
            'showLinkPreview': !isOgClosedByUser.value,
          },
        );

        typingTimer.value?.cancel();
        isTyping.value = false;
        ref.read(horaChatControllerProvider).sendTypingStatus(groupId, false);

        ogDebounce.value?.cancel();
        ogData.value = null;
        isOgLoading.value = false;
        isOgClosedByUser.value = false;
        lastCheckedUrl.value = "";

        messageController.clear();
        cancelReply();
        showAttachmentMenu.value = false;
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('chat.error_generic'.tr(args: [e.toString()]))));
      } finally {
        isSending.value = false;
      }
    }

    void resetRecorderState() {
      stopwatch.reset();
      stopwatch.stop();
      timer.value?.cancel();
      timerText.value = "00:00:00";
      amplitudeHistory.value = [];
      isPaused.value = false;
      recordedFilePath.value = null;
    }

    Future<void> startRecording() async {
      final status = await Permission.microphone.request();
      if (status != PermissionStatus.granted) {
        if (context.mounted) AppToast.showToast(msg: "Izin mikrofon diperlukan");
        return;
      }
      resetRecorderState();
      try {
        await recorderModule.startRecorder(toFile: 'temp_voice_note.aac', codec: Codec.aacADTS);
        stopwatch.start();
        timer.value = Timer.periodic(const Duration(milliseconds: 100), (t) {
          final duration = stopwatch.elapsed;
          final hours = duration.inHours.toString().padLeft(2, '0');
          final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
          final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
          timerText.value = "$hours:$minutes:$seconds";
        });

        int tickCounter = 0;
        recorderSubscription.value = recorderModule.onProgress!.listen((e) {
          if (e.decibels != null) {
            tickCounter++;
            double valueToInsert = 0.0;
            if (tickCounter % 4 == 0) {
              double db = e.decibels!;
              valueToInsert = (db / 80).clamp(0.0, 1.0);
            }
            amplitudeHistory.value = [valueToInsert, ...amplitudeHistory.value];
            if (amplitudeHistory.value.length > 2000) amplitudeHistory.value = amplitudeHistory.value.sublist(0, 2000);
          }
        });
      } catch (e) {
        debugPrint("Start recording failed: $e");
        isRecordingMode.value = false;
      }
    }

    Future<void> stopRecording({bool discard = false}) async {
      stopwatch.stop();
      timer.value?.cancel();
      recorderSubscription.value?.cancel();
      try {
        final path = await recorderModule.stopRecorder();
        recordedFilePath.value = path;
      } catch (e) {
        debugPrint("Stop recorder failed: $e");
      }

      if (!discard && recordedFilePath.value != null) {
        final path = recordedFilePath.value!;
        final duration = timerText.value;
        final amplitudesStr = amplitudeHistory.value.join(',');
        if (File(path).existsSync()) {
          try {
            isSending.value = true;
            final dio = ref.read(dioProvided);
            final token = await ref.read(appPreferenceProvider).read<String>(AppPreferenceKey.bearerToken) ?? '';
            final fileName = "VN_${DateTime.now().millisecondsSinceEpoch}.aac";
            final formData = FormData.fromMap({'file': await MultipartFile.fromFile(path, filename: fileName)});
            final response = await dio.post('${ApiCore.baseUrl}api/berkas/upload', queryParameters: {'category': 'speech'}, data: formData, options: Options(headers: {'Authorization': 'Bearer $token', 'Content-Type': 'multipart/form-data'}));
            if (response.statusCode == 200 || response.statusCode == 201) {
              String? uploadedUrl;
              final resData = response.data;
              if (resData is Map) {
                if (resData['data'] is Map) uploadedUrl = resData['data']['downloadUrl'];
                else if (resData['data'] is String) uploadedUrl = resData['data'];
              }
              if (uploadedUrl != null && uploadedUrl.isNotEmpty) {
                await ref.read(horaChatControllerProvider).sendUploadedRecordingMessage(audioUrl: uploadedUrl, durationText: duration, amplitudes: amplitudesStr, targetId: groupId);
              }
            }
          } catch (e) {
            if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gagal mengirim rekaman: $e')));
          } finally {
            isSending.value = false;
          }
        }
      }
      resetRecorderState();
      isRecordingMode.value = false;
    }

    Future<void> togglePause() async {
      if (recorderModule.isPaused) {
        await recorderModule.resumeRecorder();
        stopwatch.start();
        recorderSubscription.value?.resume();
        isPaused.value = false;
      } else {
        await recorderModule.pauseRecorder();
        stopwatch.stop();
        recorderSubscription.value?.pause();
        isPaused.value = true;
      }
    }

    // --- MEDIA HANDLERS ---
    void handleCamera() async {
      showAttachmentMenu.value = false;
      if (isSending.value) return;
      final result = await Navigator.push(context, MaterialPageRoute(builder: (context) => const CameraLocationView(returnOnCapture: true)));

      if (result != null) {
        String filePath = '';
        String address = '';

        if (result is Map) {
          filePath = result['path'] ?? '';
          address = result['address'] ?? '';
        } else if (result is String) {
          filePath = result;
        }

        if (filePath.isEmpty || !context.mounted) return;

        final ext = path.extension(filePath).toLowerCase();
        final type = ['.mp4', '.mov', '.avi', '.mkv'].contains(ext) ? 'video' : 'image';

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => HoraChatMediaPreview(
              filePath: filePath,
              type: type,
              address: address, // Pass address ke preview
              onSend: (caption) async {
                // Proses Kirim dengan Caption & Address
                isSending.value = true;
                try {
                  if (type == 'video') {
                    await ref.read(horaChatControllerProvider).sendVideoSendMessage(filePath: filePath, targetId: groupId, caption: caption, address: address);
                  } else {
                    final tempId = const Uuid().v4();
                    final tempMessage = types.ImageMessage(
                      author: types.User(id: myUserId),
                      createdAt: DateTime.now().millisecondsSinceEpoch,
                      id: tempId,
                      name: path.basename(filePath),
                      size: File(filePath).lengthSync(),
                      uri: filePath,
                      metadata: {
                        'status': 'uploading',
                        'caption': caption,
                        'address': address
                      },
                    );
                    ref.read(pendingMessagesProvider.notifier).update((state) => [tempMessage, ...state]);
                    await ref.read(horaChatControllerProvider).sendImageSendMessage(filePath: filePath, targetId: groupId, caption: caption, address: address);
                    ref.read(pendingMessagesProvider.notifier).update((state) => state.where((m) => m.id != tempId).toList());
                  }
                  cancelReply();
                } catch (e) {
                  if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('chat.error_generic'.tr(args: [e.toString()]))));
                } finally {
                  isSending.value = false;
                }
              },
            ),
          ),
        );
      }
    }

    void handleMedia() async {
      showAttachmentMenu.value = false;
      if (isSending.value) return;

      try {
        var pickedImage = await ImagePicker().pickImage(source: ImageSource.gallery);
        if (pickedImage == null) return;

        // Kompresi (Fitur lama dipertahankan)
        File file = File(pickedImage.path);
        final dir = await getTemporaryDirectory();
        final targetPath = path.join(dir.absolute.path, "compressed_${path.basename(file.path)}");
        final compressedImage = await FlutterImageCompress.compressAndGetFile(file.absolute.path, targetPath, quality: 50);
        if (compressedImage != null) pickedImage = XFile(compressedImage.path);
        final filePath = pickedImage.path;

        if (!context.mounted) return;

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => HoraChatMediaPreview(
              filePath: filePath,
              type: 'image', // Image picker hanya untuk gambar
              address: null, // Galeri biasanya tidak ada info lokasi langsung
              onSend: (caption) async {
                isSending.value = true;
                try {
                  final tempId = const Uuid().v4();
                  final tempMessage = types.ImageMessage(author: types.User(id: myUserId), createdAt: DateTime.now().millisecondsSinceEpoch, id: tempId, name: path.basename(filePath), size: File(filePath).lengthSync(), uri: filePath, metadata: {'status': 'uploading', 'caption': caption});
                  ref.read(pendingMessagesProvider.notifier).update((state) => [tempMessage, ...state]);
                  await ref.read(horaChatControllerProvider).sendImageSendMessage(filePath: filePath, targetId: groupId, caption: caption);
                  ref.read(pendingMessagesProvider.notifier).update((state) => state.where((m) => m.id != tempId).toList());
                  cancelReply();
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('chat.error_generic'.tr(args: [e.toString()]))));
                } finally {
                  isSending.value = false;
                }
              },
            ),
          ),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('chat.error_generic'.tr(args: [e.toString()]))));
      }
    }

    void handleDocument() async {
      showAttachmentMenu.value = false;
      if (isSending.value) return;
      isSending.value = true;
      try {
        FilePickerResult? result = await FilePicker.platform.pickFiles(type: FileType.any);
        if (result != null && result.files.single.path != null) {
          File file = File(result.files.single.path!);
          String fileName = result.files.single.name;
          await ref.read(horaChatControllerProvider).sendFileSendMessage(filePath: file.path, fileName: fileName, targetId: groupId, mimeType: result.files.single.extension);
          ref.read(fileCollectionStateNotifierProvider.notifier).uploadFileCollection(file: file);
          cancelReply();
        } else {
          isSending.value = false;
        }
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('chat.error_document'.tr(args: [e.toString()]))));
      } finally {
        isSending.value = false;
      }
    }

    void handleVoiceNote() {
      showAttachmentMenu.value = false;
      isRecordingMode.value = true;
      startRecording();
    }

    void toggleMenu() {
      if (showAttachmentMenu.value) {
        showAttachmentMenu.value = false;
      } else {
        FocusScope.of(context).unfocus();
        Future.delayed(const Duration(milliseconds: 100), () {
          showAttachmentMenu.value = true;
        });
      }
    }

    // --- OVERLAY LOGIC IMPLEMENTATION ---

    final allStaff = getStaffList();
    final filteredStaff = showMentions.value
        ? allStaff.where((s) => getDisplayName(s).toLowerCase().contains(mentionQuery.value.toLowerCase())).toList()
        : [];

    void removeOverlay() {
      overlayEntry.value?.remove();
      overlayEntry.value = null;
    }

    void createAndShowOverlay() {
      removeOverlay(); // Hapus yang lama jika ada

      // Jangan tampilkan jika tidak ada data
      if (!showMentions.value || filteredStaff.isEmpty) return;

      final entry = OverlayEntry(
        builder: (context) {
          return CompositedTransformFollower(
            link: layerLink,
            showWhenUnlinked: false,
            targetAnchor: Alignment.topCenter,
            followerAnchor: Alignment.bottomCenter,
            offset: const Offset(0, 0),
            child: Align(
              alignment: Alignment.bottomCenter,
              child: Material(
                elevation: 0,
                color: Colors.transparent,
                child: Container(
                  width: MediaQuery.of(context).size.width,
                  height: 60,
                  decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                      border: Border(top: BorderSide(color: Colors.grey.shade200), bottom: BorderSide.none)
                  ),
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    itemCount: filteredStaff.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 10),
                    itemBuilder: (ctx, index) {
                      final staff = filteredStaff[index];
                      final displayName = getDisplayName(staff);
                      final avatarUrl = getAvatarUrl(staff);
                      final bool hasAvatar = avatarUrl != null && avatarUrl.isNotEmpty;

                      return GestureDetector(
                        onTap: () => onMentionSelected(displayName),
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                          ),
                          child: CircleAvatar(
                            radius: 20,
                            backgroundColor: AppColors.featurePurple.withOpacity(0.1),
                            backgroundImage: hasAvatar ? NetworkImage(avatarUrl) : null,
                            child: !hasAvatar
                                ? Text(
                              displayName.isNotEmpty ? displayName[0].toUpperCase() : '?',
                              style: const TextStyle(
                                color: AppColors.featurePurple,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            )
                                : null,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          );
        },
      );

      Overlay.of(context).insert(entry);
      overlayEntry.value = entry;
    }

    useEffect(() {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (showMentions.value && filteredStaff.isNotEmpty) {
          createAndShowOverlay();
        } else {
          removeOverlay();
        }
      });
      return () => removeOverlay();
    }, [showMentions.value, mentionQuery.value, filteredStaff]);


    // --- UI RENDER ---

    if (isRecordingMode.value) {
      return ChatRecordingSheet(
        timerText: timerText.value,
        amplitudeHistory: amplitudeHistory.value,
        isPaused: isPaused.value,
        isSending: isSending.value,
        onClose: () => stopRecording(discard: true),
        onPauseResume: togglePause,
        onSend: () => stopRecording(discard: false),
      );
    }

    final bool showOgPreview = (isOgLoading.value || ogData.value != null);

    // Dummy data untuk efek skeleton
    final skeletonData = {
      'title': 'Loading Title Preview...',
      'description': 'Loading description text here for skeleton effect...',
      'image': '',
    };

    final displayData = isOgLoading.value ? skeletonData : ogData.value;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [

        // 1. Reply Preview [Sudah di-Update Sesuai Tampilan Baru]
        if (replyMessage != null)
          Container(
            // Menghilangkan margin sepenuhnya agar langsung menempel rata dengan input field
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              // Border hanya di atas saja tanpa border kanan kiri atau bawah
              border: Border(
                top: BorderSide(color: Colors.grey.shade300, width: 1),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Text(
                    "Kepada : ${getReplyAuthorName(replyMessage)}",
                    style: AppTheme.primaryTextStyle.copyWith(
                      color: Colors.black, // Berwarna hitam solid
                      fontWeight: FontWeight.w600,
                      fontSize: 12, // 12px
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                // Mengambil data format waktu dari timestamp pesan
                Text(
                  replyMessage.createdAt != null
                      ? "${DateTime.fromMillisecondsSinceEpoch(replyMessage.createdAt!).hour.toString().padLeft(2, '0')}:${DateTime.fromMillisecondsSinceEpoch(replyMessage.createdAt!).minute.toString().padLeft(2, '0')}"
                      : "",
                  style: AppTheme.secondaryTextStyle.copyWith(
                    color: Colors.black, // Berwarna hitam solid
                    fontSize: 12, // 12px
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  onTap: cancelReply,
                  borderRadius: BorderRadius.circular(12),
                  child: const Icon(Icons.close, size: 16, color: Colors.black), // Ikon berubah hitam
                ),
              ],
            ),
          ),

        // 2. Open Graph Link Preview with Skeletonizer
        if (showOgPreview && displayData != null)
          Skeletonizer(
            enabled: isOgLoading.value,
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Colors.grey.shade200), bottom: BorderSide(color: Colors.grey.shade200)),
              ),
              constraints: const BoxConstraints(maxHeight: 80),
              child: Row(
                children: [
                  // Gambar Kecil
                  if (!isOgLoading.value && displayData['image'] != null && displayData['image']!.isNotEmpty)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: Image.network(
                        displayData['image']!,
                        width: 60,
                        height: 60,
                        fit: BoxFit.cover,
                        errorBuilder: (ctx, err, stack) => Container(
                          width: 60, height: 60,
                          color: Colors.grey.shade100,
                          child: const Icon(Icons.link, size: 20, color: Colors.grey),
                        ),
                      ),
                    )
                  else
                    Container(
                      width: 60, height: 60,
                      decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(6)),
                      child: isOgLoading.value ? null : const Icon(Icons.link, size: 24, color: Colors.grey),
                    ),

                  const SizedBox(width: 12),

                  // Teks Judul & Deskripsi
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          displayData['title'] ?? 'Link',
                          style: AppTheme.primaryTextStyle.copyWith(fontWeight: FontWeight.bold, fontSize: 13),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          displayData['description'] ?? '',
                          style: AppTheme.secondaryTextStyle.copyWith(fontSize: 11, color: Colors.grey),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),

                  // Tombol X untuk menutup preview (Jangan di-skeleton)
                  Skeleton.ignore(
                    child: IconButton(
                      icon: const Icon(Icons.close, size: 20, color: Colors.black54),
                      onPressed: cancelOg,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    ),
                  ),
                ],
              ),
            ),
          ),

        // 3. Input Row
        CompositedTransformTarget(
          link: layerLink,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: const Color(0xFFEEEEEE), width: 1))),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                GestureDetector(
                  onTap: toggleMenu,
                  child: Container(
                    height: 38, width: 38, margin: const EdgeInsets.only(bottom: 2),
                    color: Colors.transparent,
                    child: Icon(showAttachmentMenu.value ? Icons.close : Icons.add, size: 24, color: Colors.black87),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    constraints: const BoxConstraints(minHeight: 38),
                    child: TextField(
                      key: const ValueKey('chat_input_field'),
                      controller: messageController,
                      focusNode: focusNode,
                      // [PERBAIKAN] Mendeteksi '@' diikuti teks apa pun, lalu diakhiri 'p!'
                      onChanged: (val) {
                        final autoPingRegex = RegExp(r'@[^@\n]+\s+[pP]!\s*$');
                        if (autoPingRegex.hasMatch(val) && !isSending.value) {
                          sendMessage();
                        }
                      },
                      spellCheckConfiguration: const SpellCheckConfiguration.disabled(),
                      decoration: InputDecoration(hintText: "chat.input_hint".tr(context: context), hintStyle: AppTheme.secondaryTextStyle.copyWith(color: Colors.grey.shade400, fontWeight: FontWeight.w500), border: InputBorder.none, enabledBorder: InputBorder.none, focusedBorder: InputBorder.none),
                      textInputAction: TextInputAction.newline,
                      keyboardType: TextInputType.multiline,
                      style: AppTheme.primaryTextStyle.copyWith(color: Colors.black87),
                      maxLines: 4, minLines: 1,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  onTap: () { FocusScope.of(context).unfocus(); sendMessage(); },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(height: 38, margin: const EdgeInsets.only(bottom: 2), padding: const EdgeInsets.symmetric(horizontal: 12), alignment: Alignment.center, child: Text("KIRIM", style: AppTheme.primaryTextStyle.copyWith(color: const Color(0xFF5A30FF), fontWeight: FontWeight.w700))),
                ),
              ],
            ),
          ),
        ),

        // 4. Attachment Sheet
        AnimatedSize(
          duration: const Duration(milliseconds: 200),
          child: showAttachmentMenu.value
              ? ChatAttachmentSheet(
            onCamera: handleCamera,
            onMedia: handleMedia,
            onDocument: handleDocument,
            onVoice: handleVoiceNote,
          )
              : const SizedBox.shrink(),
        ),
      ],
    );
  }
}