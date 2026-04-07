part of '../views/chat.dart';

class _ChatContentHora extends HookConsumerWidget {
  final TextEditingController txtSearchController;

  const _ChatContentHora({super.key, required this.txtSearchController});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // --- PROVIDERS & STATE ---
    final myUserId = ref.read(horaChatIdProvider);
    final myUserName = ref.read(horaChatNameProvider);
    final groupId = ref.read(horaChatGroupIdProvider);
    final myUserEmail = ref.watch(horaChatEmailProvider);

    final searchQuery = useState(txtSearchController.text);

    // Data Loaders
    final staffState = ref.watch(staffStateNotifierProvider);
    final companyState = ref.watch(companyStateNotifierProvider);
    final fileCollectionState = ref.watch(fileCollectionStateNotifierProvider);

    // Scroll & Message State
    final messageKeys = useMemoized<Map<String, GlobalKey>>(() => {});
    final scrollController = useMemoized(() => AutoScrollController(suggestedRowHeight: 80));
    final showScrollToBottom = useState(false);
    final unreadCount = useState(0);
    final lastMessageId = useRef<String?>(null);
    final currentDisplayMessages = useRef<List<types.Message>>([]);

    // Pagination & Features
    final messageLimit = useState(20);
    final cachedMessages = useRef<List<types.Message>>([]);
    final highlightedMessageId = useState<String?>(null);
    final isPinnedViewMode = useState(false);
    final isLoadingMoreForReply = useState(false);

    // --- STREAMS ---
    final messageStream = useMemoized(
          () => ref.read(horaChatControllerProvider).getMessagesStream(groupId, limit: messageLimit.value),
      [groupId, messageLimit.value],
    );

    final pinnedMessagesAsync = ref.watch(pinnedMessagesListStreamProvider(groupId));
    final pinnedMessagesList = pinnedMessagesAsync.value ?? [];

    final pendingMessages = ref.watch(pendingMessagesProvider);

    final typingUsersAsync = ref.watch(typingUsersStreamProvider(groupId));
    final typingUsers = typingUsersAsync.value ?? [];

    // --- EFFECTS ---

    // Auto-Populate Email Provider dari Staff Data
    useEffect(() {
      if (ref.read(horaChatEmailProvider).isEmpty) {
        AppStateX(staffState).maybeWhen(
          success: (data) {
            final myData = _findStaffData(data, myUserId, myUserId: myUserId);
            if (myData != null) {
              final email = myData['email'] ?? myData['alamatEmail'];
              if (email != null && email.toString().isNotEmpty) {
                Future.microtask(() {
                  ref.read(horaChatEmailProvider.notifier).state = email.toString();
                });
              }
            }
          },
          orElse: () {},
        );
      }
      return null;
    }, [staffState]);

    // Reset pin mode jika kosong
    useEffect(() {
      if (isPinnedViewMode.value && pinnedMessagesList.isEmpty) {
        Future.microtask(() => isPinnedViewMode.value = false);
      }
      return null;
    }, [pinnedMessagesList.length, isPinnedViewMode.value]);

    // Scroll Listener
    useEffect(() {
      void onScroll() {
        if (!scrollController.hasClients) return;
        try {
          if (scrollController.offset > 500) {
            if (!showScrollToBottom.value) showScrollToBottom.value = true;
          } else {
            if (showScrollToBottom.value) {
              showScrollToBottom.value = false;
              unreadCount.value = 0;
            }
          }
        } catch (_) {}
      }
      scrollController.addListener(onScroll);
      return () => scrollController.removeListener(onScroll);
    }, [scrollController]);

    // Search Listener
    useEffect(() {
      void searchListener() => searchQuery.value = txtSearchController.text;
      txtSearchController.addListener(searchListener);
      return () => txtSearchController.removeListener(searchListener);
    }, []);

    // Initial Data Fetch
    useEffect(() {
      Future.microtask(() {
        bool isStaffLoaded = false;
        AppStateX(ref.read(staffStateNotifierProvider)).maybeWhen(
            success: (_) => isStaffLoaded = true, orElse: () => isStaffLoaded = false);

        if (!isStaffLoaded) {
          ref.read(staffStateNotifierProvider.notifier).getStaff();
        }

        bool isFileLoaded = false;
        AppStateX(ref.read(fileCollectionStateNotifierProvider)).maybeWhen(
            success: (_) => isFileLoaded = true, orElse: () => isFileLoaded = false);
        if (!isFileLoaded) ref.read(fileCollectionStateNotifierProvider.notifier).fetchCollectionData();

        AppStateX(ref.read(companyStateNotifierProvider)).maybeWhen(
          success: (data) => _updateCompanyLogo(ref, data),
          orElse: () => ref.read(companyStateNotifierProvider.notifier).getCompany(),
        );
      });
      return null;
    }, []);

    ref.listen(companyStateNotifierProvider, (_, next) {
      AppStateX(next).maybeWhen(success: (data) => _updateCompanyLogo(ref, data), orElse: () {});
    });

    // --- METHODS ---

    void scrollToBottom() {
      if (scrollController.hasClients) {
        scrollController.animateTo(0, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
        unreadCount.value = 0;
      }
    }

    Future<void> _executeScroll(String tId) async {
      final currentList = currentDisplayMessages.value;
      int targetIndex = currentList.indexWhere((m) => m.id == tId);
      if (targetIndex == -1) return;

      int currentVisibleIndex = 0;
      for (int i = 0; i < currentList.length; i++) {
        final k = messageKeys[currentList[i].id];
        if (k != null && k.currentContext != null) {
          currentVisibleIndex = i;
          break;
        }
      }

      bool isScrollingUp = targetIndex > currentVisibleIndex;
      bool found = false;

      for (int i = 0; i < 30; i++) {
        final k = messageKeys[tId];
        if (k != null && k.currentContext != null) {
          await Scrollable.ensureVisible(
            k.currentContext!,
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeInOut,
            alignment: 0.5,
          );
          found = true;
          break;
        }

        if (!scrollController.hasClients) break;
        final maxExt = scrollController.position.maxScrollExtent;
        final minExt = scrollController.position.minScrollExtent;

        if (isScrollingUp) {
          final targetOff = (scrollController.offset + 500).clamp(minExt, maxExt);
          await scrollController.animateTo(targetOff, duration: const Duration(milliseconds: 150), curve: Curves.linear);
          if (scrollController.offset >= maxExt) break;
        } else {
          final targetOff = (scrollController.offset - 500).clamp(minExt, maxExt);
          await scrollController.animateTo(targetOff, duration: const Duration(milliseconds: 150), curve: Curves.linear);
          if (scrollController.offset <= minExt) break;
        }
      }

      if (found) {
        highlightedMessageId.value = tId;
        await Future.delayed(const Duration(milliseconds: 2500));
        if (context.mounted) highlightedMessageId.value = null;
      }
    }

    void scrollToMessage(String targetId) async {
      final currentList = currentDisplayMessages.value;
      int index = currentList.indexWhere((m) => m.id == targetId);

      if (index != -1) {
        await _executeScroll(targetId);
      } else {
        if (isPinnedViewMode.value) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Pesan tidak ada di daftar pin")));
          return;
        }
        isLoadingMoreForReply.value = true;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Mencari pesan lama..."), duration: Duration(milliseconds: 1500)));

        try {
          final controller = ref.read(horaChatControllerProvider);
          final doc = await controller.getMessageSnapshot(groupId, targetId);
          if (doc != null && doc.exists) {
            final data = doc.data() as Map<String, dynamic>;
            DateTime? targetDate;
            try {
              targetDate = (data['createdAt'] as dynamic).toDate();
            } catch (_) {}

            if (targetDate != null) {
              final count = await controller.countMessagesNewerThan(groupId, targetDate);
              messageLimit.value = count + 15; // + buffer
              await Future.delayed(const Duration(milliseconds: 1000));

              final newIndex = currentDisplayMessages.value.indexWhere((m) => m.id == targetId);
              if (newIndex != -1) {
                await _executeScroll(targetId);
              }
            }
          }
        } catch (e) {
          debugPrint("Err scroll: $e");
        } finally {
          isLoadingMoreForReply.value = false;
        }
      }
    }

    Widget wrapMessage(Widget child, types.Message message, int index) {
      final isHighlighted = highlightedMessageId.value == message.id;
      final key = messageKeys.putIfAbsent(message.id, () => GlobalKey());

      return Container(
        key: key,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 5),
          child: TweenAnimationBuilder<Color?>(
            duration: const Duration(milliseconds: 3000),
            curve: Curves.easeInOut,
            tween: ColorTween(
                begin: Colors.transparent,
                end: isHighlighted ? Colors.black.withOpacity(0.2) : Colors.transparent
            ),
            builder: (context, color, _) {
              // Menambahkan SwipeToReply agar gesture balas pesan berjalan normal
              return SwipeToReply(
                onReply: () {
                  ref.read(chatReplyMessageProvider.notifier).state = message;
                },
                highlightColor: color, // Menggunakan property bawaan dari widget SwipeToReply Anda
                child: child,
              );
            },
          ),
        ),
      );
    }

    void handleMessageLongPress(BuildContext context, types.Message message) async {
      if (message.metadata?['status'] == 'uploading') return;

      final RenderBox object = context.findRenderObject() as RenderBox;
      final offset = object.localToGlobal(Offset.zero);
      final size = object.size;
      final bubbleCenter = offset.dx + (size.width / 2);
      const double estimatedMenuWidth = 140.0;
      final double leftPos = bubbleCenter - (estimatedMenuWidth / 2);
      final position = RelativeRect.fromLTRB(leftPos, offset.dy, leftPos + estimatedMenuWidth, offset.dy + size.height);

      final items = <PopupMenuEntry<String>>[];
      final textStyle = AppTheme.primaryTextStyle.copyWith(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black);

      items.add(PopupMenuItem<String>(value: 'reply', height: 36, child: Text('Balas pesan', style: textStyle)));

      String? urlToLaunch;
      if (message is types.TextMessage) {
        final urlRegExp = RegExp(r'(https?:\/\/[^\s]+|www\.[^\s]+)');
        final match = urlRegExp.firstMatch(message.text);
        if (match != null) {
          urlToLaunch = match.group(0);
          if (urlToLaunch != null && !urlToLaunch.startsWith('http')) urlToLaunch = 'https://$urlToLaunch';
        }
        items.add(const PopupMenuItem<String>(enabled: false, height: 1, child: Divider()));
        items.add(PopupMenuItem<String>(value: 'copy', height: 36, child: Text('Salin konten', style: textStyle)));

        if (urlToLaunch != null) {
          items.add(const PopupMenuItem<String>(enabled: false, height: 1, child: Divider()));
          items.add(PopupMenuItem<String>(value: 'open_web', height: 36, child: Text('Buka di web', style: textStyle)));
        }
      }

      items.add(const PopupMenuItem<String>(enabled: false, height: 1, child: Divider()));
      final isPinned = message.metadata?['isPinned'] == true;
      items.add(PopupMenuItem<String>(value: isPinned ? 'unpin' : 'pin', height: 36, child: Text(isPinned ? 'Lepas Pin' : 'Pin Pesan', style: textStyle)));

      final selectedValue = await showMenu<String>(
        context: context,
        position: position,
        elevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        color: Colors.white,
        items: items,
        constraints: const BoxConstraints(minWidth: 120, maxWidth: 160),
      );

      if (selectedValue == 'reply') {
        ref.read(chatReplyMessageProvider.notifier).state = message;
      } else if (selectedValue == 'copy' && message is types.TextMessage) {
        await Clipboard.setData(ClipboardData(text: message.text));
        if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pesan disalin'), duration: Duration(seconds: 1)));
      } else if (selectedValue == 'open_web' && urlToLaunch != null) {
        try {
          await launchUrl(Uri.parse(urlToLaunch), mode: LaunchMode.externalApplication);
        } catch (_) {}
      } else if (selectedValue == 'pin') {
        final authorName = _resolveAuthorNameLocal(
            rawData: AppStateX(staffState).maybeWhen(success: (d) => d, orElse: () => []),
            authorId: message.author.id,
            authorEmail: message.author.metadata?['email'],
            storedName: message.author.firstName,
            myUserId: myUserId,
            myUserName: myUserName,
            myUserEmail: myUserEmail);
        await ref.read(horaChatControllerProvider).pinMessage(groupId, message, authorName);
      } else if (selectedValue == 'unpin') {
        await ref.read(horaChatControllerProvider).unpinMessage(groupId, message.id);
      }
    }

    // --- ALGORITMA GROUPING MEDIA ---
    List<types.Message> groupMediaMessages(List<types.Message> messages) {
      if (messages.isEmpty) return [];
      final grouped = <types.Message>[];
      final buffer = <types.Message>[];

      void flushBuffer() {
        if (buffer.isEmpty) return;

        if (buffer.length == 1) {
          grouped.add(buffer.first);
        } else {
          final firstMsg = buffer.first;
          final groupMessage = types.CustomMessage(
            author: firstMsg.author,
            createdAt: firstMsg.createdAt,
            id: 'group_${firstMsg.id}',
            metadata: {
              'subtype': 'media_group',
              'messages': List<types.Message>.from(buffer).reversed.toList(),
            },
          );
          grouped.add(groupMessage);
        }
        buffer.clear();
      }

      for (int i = 0; i < messages.length; i++) {
        final current = messages[i];
        final isImage = current is types.ImageMessage;
        final isVideo = current is types.VideoMessage;
        final isMedia = isImage || isVideo;

        final caption = current.metadata?['caption'] as String?;
        final hasCaption = caption != null && caption.trim().isNotEmpty;

        if (isMedia && !hasCaption) {
          if (buffer.isEmpty) {
            buffer.add(current);
          } else {
            final prev = buffer.last;
            final sameAuthor = prev.author.id == current.author.id;
            final sameDay = _isSameDay(prev.createdAt, current.createdAt);

            if (sameAuthor && sameDay) {
              buffer.add(current);
            } else {
              flushBuffer();
              buffer.add(current);
            }
          }
        } else {
          flushBuffer();
          grouped.add(current);
        }
      }
      flushBuffer();
      return grouped;
    }

    return StreamBuilder<List<types.Message>>(
      stream: isPinnedViewMode.value ? null : messageStream,
      builder: (context, snapshot) {
        List<types.Message> messages = [];
        bool isLoading = false;
        String? error;

        if (isPinnedViewMode.value) {
          messages = pinnedMessagesList;
          isLoading = pinnedMessagesAsync.isLoading;
        } else {
          if (snapshot.hasError) error = snapshot.error.toString();
          if (snapshot.hasData) {
            cachedMessages.value = snapshot.data!;
            messages = snapshot.data!;
          } else {
            messages = cachedMessages.value;
          }
          if (snapshot.connectionState == ConnectionState.waiting && messages.isEmpty) isLoading = true;
        }

        if (error != null) return Center(child: Text('Error: $error'));
        if (isLoading && messages.isEmpty) return const Center(child: CircularProgressIndicator());
        if (isPinnedViewMode.value && messages.isEmpty) return const SizedBox.shrink();

        final displayList = [...pendingMessages, ...messages];

        if (displayList.isNotEmpty) {
          final newestId = displayList.first.id;
          if (lastMessageId.value != null && lastMessageId.value != newestId && !isPinnedViewMode.value) {
            if (showScrollToBottom.value) Future.microtask(() => unreadCount.value++);
          }
          lastMessageId.value = newestId;
        }

        List<types.Message> filteredMessages = searchQuery.value.isNotEmpty
            ? displayList.where((msg) => msg is types.TextMessage && msg.text.toLowerCase().contains(searchQuery.value.toLowerCase())).toList()
            : List.from(displayList);

        if (typingUsers.isNotEmpty && !isPinnedViewMode.value) {
          filteredMessages.insert(
              0,
              types.CustomMessage(
                author: const types.User(id: 'typing_id'),
                createdAt: DateTime.now().millisecondsSinceEpoch,
                id: 'typing_indicator_id',
                metadata: {'subtype': 'typing_indicator', 'users': typingUsers},
              ));
        }

        // --- FINAL LIST CONSTRUCTION ---

        final normalizedMessages = filteredMessages.map((msg) {
          return ChatLogicHelper.normalizeMessageAuthor(message: msg, myUserId: myUserId, myUserName: myUserName, myUserEmail: myUserEmail);
        }).toList();

        final groupedMessages = groupMediaMessages(normalizedMessages);
        currentDisplayMessages.value = groupedMessages;

        final rawStaffData = AppStateX(staffState).maybeWhen(success: (d) => d, orElse: () => []);

        final myAvatarUrl = _findStaffAvatar(rawStaffData, myUserId, myUserId: myUserId);

        void handleAvatarTap(String authorId, String? authorEmail) {
          final staffData = _findStaffData(rawStaffData, authorId, authorEmail: authorEmail);

          if (staffData != null) {
            try {
              final staff = Staff.fromJson(staffData);
              context.pushNamed(Routes.staffProfileDetail, extra: staff);
            } catch (e) {
              debugPrint("Error parsing staff data: $e");
              AppToast.showToast(msg: "Gagal membuka profil");
            }
          } else {
            AppToast.showToast(msg: "Profil tidak ditemukan");
          }
        }

        return Stack(
          children: [
            Column(
              children: [
                ChatPinHeader(
                  pinCount: pinnedMessagesList.length,
                  isPinnedViewMode: isPinnedViewMode.value,
                  onTap: () => isPinnedViewMode.value = !isPinnedViewMode.value,
                ),

                if (isLoadingMoreForReply.value) const LinearProgressIndicator(minHeight: 2, color: AppColors.featurePurple, backgroundColor: Colors.white),

                Expanded(
                  child: Chat(
                    messages: groupedMessages,
                    scrollController: scrollController,
                    onEndReached: () async {
                      if (!isPinnedViewMode.value) messageLimit.value += 20;
                    },
                    onEndReachedThreshold: 0.8,
                    onMessageLongPress: handleMessageLongPress,
                    onSendPressed: (partialText) => ref.read(horaChatControllerProvider).sendMessage(text: partialText.text, targetId: groupId),
                    user: types.User(id: myUserId, firstName: myUserName),
                    customBottomWidget: isPinnedViewMode.value ? const SizedBox.shrink() : const _HoraChatInputField(),

                    dateHeaderThreshold: 86400000,
                    dateHeaderBuilder: (header) {
                      return _buildDateHeader(context, header.dateTime.millisecondsSinceEpoch);
                    },

                    showUserAvatars: false, showUserNames: false,

                    // --- MESSAGE BUILDERS ---
                    textMessageBuilder: (msg, {required messageWidth, required showName}) {
                      return wrapMessage(
                          _buildBubble(
                              context: context,
                              message: msg,
                              rawStaffData: rawStaffData,
                              myUserId: myUserId,
                              myUserEmail: myUserEmail,
                              myUserName: myUserName,
                              myAvatarUrl: myAvatarUrl,
                              searchQuery: searchQuery.value,
                              onReplyTap: scrollToMessage,
                              onAvatarTap: () => handleAvatarTap(msg.author.id, msg.author.metadata?['email']),
                              childBuilder: (authorName, avatarUrl, initials, isMe) => _ChatBubbleText(
                                  textSearch: searchQuery.value,
                                  text: msg.text,
                                  author: authorName,
                                  sentAt: _toDate(msg.createdAt),
                                  isMe: isMe,
                                  metadata: msg.metadata,
                                  replyAuthorResolved: _resolveReplyName(msg, rawStaffData, myUserId, myUserName, myUserEmail),
                                  replyTimeResolved: _resolveReplyTime(msg, groupedMessages),
                                  onReplyTap: scrollToMessage,
                                  onAvatarTap: () => handleAvatarTap(msg.author.id, msg.author.metadata?['email']),
                                  avatarUrl: avatarUrl,
                                  initials: initials)),
                          msg,
                          groupedMessages.indexOf(msg));
                    },

                    imageMessageBuilder: (msg, {required messageWidth}) {
                      return wrapMessage(
                          _buildBubble(
                              context: context,
                              message: msg,
                              rawStaffData: rawStaffData,
                              myUserId: myUserId,
                              myUserEmail: myUserEmail,
                              myUserName: myUserName,
                              myAvatarUrl: myAvatarUrl,
                              searchQuery: "",
                              onReplyTap: scrollToMessage,
                              onAvatarTap: () => handleAvatarTap(msg.author.id, msg.author.metadata?['email']),
                              childBuilder: (authorName, avatarUrl, initials, isMe) => _ChatBubbleMediaGroup(
                                  messages: [msg], author: authorName, sentAt: _toDate(msg.createdAt), isMe: isMe, avatarUrl: avatarUrl, initials: initials)),
                          msg,
                          groupedMessages.indexOf(msg));
                    },

                    videoMessageBuilder: (msg, {required messageWidth}) {
                      return wrapMessage(
                          _buildBubble(
                              context: context,
                              message: msg,
                              rawStaffData: rawStaffData,
                              myUserId: myUserId,
                              myUserEmail: myUserEmail,
                              myUserName: myUserName,
                              myAvatarUrl: myAvatarUrl,
                              searchQuery: "",
                              onReplyTap: scrollToMessage,
                              onAvatarTap: () => handleAvatarTap(msg.author.id, msg.author.metadata?['email']),
                              childBuilder: (authorName, avatarUrl, initials, isMe) => _ChatBubbleMediaGroup(
                                  messages: [msg], author: authorName, sentAt: _toDate(msg.createdAt), isMe: isMe, avatarUrl: avatarUrl, initials: initials)),
                          msg,
                          groupedMessages.indexOf(msg));
                    },

                    fileMessageBuilder: (msg, {required messageWidth}) {
                      return wrapMessage(
                          _buildBubble(
                              context: context,
                              message: msg,
                              rawStaffData: rawStaffData,
                              myUserId: myUserId,
                              myUserEmail: myUserEmail,
                              myUserName: myUserName,
                              myAvatarUrl: myAvatarUrl,
                              searchQuery: "",
                              onReplyTap: scrollToMessage,
                              onAvatarTap: () => handleAvatarTap(msg.author.id, msg.author.metadata?['email']),
                              childBuilder: (authorName, avatarUrl, initials, isMe) =>
                                  _ChatBubbleSpecial(
                                    message: msg, 
                                    author: authorName, 
                                    sentAt: _toDate(msg.createdAt), 
                                    isMe: isMe,
                                    avatarUrl: avatarUrl,
                                    initials: initials,
                                    onAvatarTap: () => handleAvatarTap(msg.author.id, msg.author.metadata?['email'])
                                  )),
                          msg,
                          groupedMessages.indexOf(msg));
                    },

                    customMessageBuilder: (msg, {required messageWidth}) {
                      final subtype = msg.metadata?['subtype'];
                      if (subtype == 'typing_indicator') return _buildTypingIndicator(msg.metadata?['users'], rawStaffData);

                      if (subtype == 'media_group') {
                        final subMessagesRaw = msg.metadata?['messages'];
                        final subMessages = (subMessagesRaw is List) ? List<types.Message>.from(subMessagesRaw) : <types.Message>[];

                        return wrapMessage(
                            _buildBubble(
                                context: context,
                                message: msg,
                                rawStaffData: rawStaffData,
                                myUserId: myUserId,
                                myUserEmail: myUserEmail,
                                myUserName: myUserName,
                                myAvatarUrl: myAvatarUrl,
                                searchQuery: "",
                                onReplyTap: scrollToMessage,
                                onAvatarTap: () => handleAvatarTap(msg.author.id, msg.author.metadata?['email']),
                                childBuilder: (authorName, avatarUrl, initials, isMe) => _ChatBubbleMediaGroup(
                                  messages: subMessages,
                                  author: authorName,
                                  sentAt: _toDate(msg.createdAt),
                                  isMe: isMe,
                                  avatarUrl: avatarUrl,
                                  initials: initials,
                                )),
                            msg,
                            groupedMessages.indexOf(msg));
                      }

                      Widget bubbleContent = const SizedBox.shrink();
                      if (['task', 'leave_request', 'profile_share', 'reimbursement', 'recording', 'contact_share'].contains(subtype)) {
                        return wrapMessage(
                            _buildBubble(
                                context: context,
                                message: msg,
                                rawStaffData: rawStaffData,
                                myUserId: myUserId,
                                myUserEmail: myUserEmail,
                                myUserName: myUserName,
                                myAvatarUrl: myAvatarUrl,
                                searchQuery: "",
                                onReplyTap: scrollToMessage,
                                onAvatarTap: () => handleAvatarTap(msg.author.id, msg.author.metadata?['email']),
                                childBuilder: (authorName, avatarUrl, initials, isMe) {
                                  return _ChatBubbleSpecial(
                                      message: msg,
                                      author: authorName,
                                      sentAt: _toDate(msg.createdAt),
                                      isMe: isMe,
                                      avatarUrl: avatarUrl,
                                      initials: initials,
                                      onAvatarTap: () => handleAvatarTap(msg.author.id, msg.author.metadata?['email'])
                                  );
                                }),
                            msg,
                            groupedMessages.indexOf(msg));
                      }

                      return const SizedBox.shrink();
                    },
                    theme: const DefaultChatTheme(
                      backgroundColor: Color(0xFFEDEDED),
                      primaryColor: Colors.transparent,
                      secondaryColor: Colors.transparent,
                      messageInsetsHorizontal: 0,
                      messageInsetsVertical: 0,
                      inputBackgroundColor: Colors.transparent,
                      dateDividerTextStyle: TextStyle(color: Colors.black54, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
            ChatScrollToBottomButton(
              isVisible: showScrollToBottom.value && !isPinnedViewMode.value,
              unreadCount: unreadCount.value,
              onTap: scrollToBottom,
            ),
          ],
        );
      },
    );
  }

  String? _resolveReplyTime(types.Message message, List<types.Message> allMessages) {
    final replyData = message.metadata?['replyTo'] as Map<String, dynamic>?;
    if (replyData == null) return null;

    if (replyData['time'] != null && replyData['time'].toString().isNotEmpty) {
      return replyData['time'].toString();
    }

    final replyId = replyData['id'];
    if (replyId != null) {
      final originalMsg = allMessages.firstWhereOrNull((m) => m.id == replyId);
      if (originalMsg != null && originalMsg.createdAt != null) {
        final date = DateTime.fromMillisecondsSinceEpoch(originalMsg.createdAt!);
        return "${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}";
      }
    }
    return null;
  }

  Map<String, dynamic>? _findStaffData(dynamic rawData, String authorId, {String? myUserId, String? authorEmail}) {
    List<dynamic> listData = [];

    if (rawData is List) {
      listData = rawData;
    } else if (rawData is Map<String, dynamic>) {
      if (rawData.containsKey('data') && rawData['data'] is List) {
        listData = rawData['data'];
      } else if (rawData.containsKey('results') && rawData['results'] is List) {
        listData = rawData['results'];
      } else {
        if (rawData.containsKey('email') || rawData.containsKey('uid')) {
          listData = [rawData];
        }
      }
    } else {
      return null;
    }

    final normalizedId = authorId.toLowerCase();
    final normalizedEmail = authorEmail?.toLowerCase();

    for (var s in listData) {
      if (s == null) continue;

      String? uid;
      String? idKaryawan;
      String? email;
      bool? isMe;
      String? username;

      try {
        Map<String, dynamic> itemMap;
        if (s is Map) {
          itemMap = s as Map<String, dynamic>;
        } else {
          try {
            itemMap = (s as dynamic).toJson();
          } catch (_) {
            continue;
          }
        }

        uid = itemMap['uid']?.toString() ?? itemMap['userId']?.toString();
        idKaryawan = itemMap['idkaryawan']?.toString();
        email = itemMap['email'] ?? itemMap['alamatEmail'];
        isMe = itemMap['isMe'];
        username = itemMap['username'] ?? itemMap['namaKaryawan'];

        if (normalizedEmail != null && email != null) {
          if (email.toLowerCase() == normalizedEmail) {
            return itemMap;
          }
        }

        if (myUserId != null && normalizedId == myUserId.toLowerCase() && isMe == true) {
          return itemMap;
        }

        if (uid != null && uid.toLowerCase() == normalizedId) {
          return itemMap;
        }

        if (idKaryawan != null && idKaryawan.toString().toLowerCase() == normalizedId) {
          return itemMap;
        }

        if (username != null && username.toLowerCase() == normalizedId) {
          return itemMap;
        }

        if (email != null) {
          final emailLower = email.toLowerCase();
          if (emailLower == normalizedId) {
            return itemMap;
          }
          final transformedEmailId = emailLower.replaceAll(RegExp(r'[.@]+'), '_');
          if (transformedEmailId == normalizedId) {
            return itemMap;
          }
        }
      } catch (_) {}
    }
    return null;
  }

  String? _findStaffAvatar(dynamic rawData, String id, {String? myUserId, String? authorEmail}) {
    final staff = _findStaffData(rawData, id, myUserId: myUserId, authorEmail: authorEmail);
    if (staff != null) {
      return staff['photoURL'] ?? staff['photoUrl'] ?? staff['foto'] ?? staff['imageUrl'];
    }
    return null;
  }

  String _resolveAuthorNameLocal({
    required dynamic rawData,
    required String authorId,
    String? authorEmail,
    required String? storedName,
    required String myUserId,
    required String myUserName,
    required String myUserEmail,
  }) {
    final staff = _findStaffData(rawData, authorId, myUserId: myUserId, authorEmail: authorEmail);
    if (staff != null) return staff['username'] ?? staff['namaKaryawan'] ?? 'Unknown';

    if (authorId == myUserId) return myUserName.isNotEmpty ? myUserName : 'Saya';
    if (storedName != null && storedName.isNotEmpty) return storedName;

    String cleanName = authorId;
    if (cleanName.contains('_gmail_com'))
      cleanName = cleanName.replaceAll('_gmail_com', '');
    else if (cleanName.contains('@')) cleanName = cleanName.split('@')[0];
    return cleanName;
  }

  Widget _buildBubble({
    required BuildContext context,
    required types.Message message,
    required dynamic rawStaffData,
    required String myUserId,
    required String myUserEmail,
    required String myUserName,
    String? myAvatarUrl,
    required String searchQuery,
    required Function(String) onReplyTap,
    required VoidCallback onAvatarTap,
    required Widget Function(String author, String? avatar, String? initials, bool isMe) childBuilder,
  }) {
    final isMe = ChatLogicHelper.checkIsMe(messageAuthorId: message.author.id, myUserId: myUserId, myUserEmail: myUserEmail);

    String authorName = '';
    String? avatarUrl;
    final String? msgEmail = message.author.metadata?['email'];

    if (isMe) {
      final myData = _findStaffData(rawStaffData, myUserId, myUserId: myUserId, authorEmail: msgEmail ?? myUserEmail);
      if (myData != null) {
        authorName = myData['username'] ?? myData['namaKaryawan'] ?? (myUserName.isNotEmpty ? myUserName : 'Saya');
        avatarUrl = myData['photoURL'] ?? myData['photoUrl'] ?? myData['foto'];
      } else {
        if (myUserName.isNotEmpty && myUserName != myUserId) {
          authorName = myUserName;
        } else {
          authorName = 'Saya';
        }
        avatarUrl = myAvatarUrl;
      }
    } else {
      final staff = _findStaffData(rawStaffData, message.author.id, authorEmail: msgEmail);

      if (staff != null) {
        authorName = staff['username'] ?? staff['namaKaryawan'] ?? 'Unknown';
        avatarUrl = staff['photoURL'] ?? staff['photoUrl'] ?? staff['foto'];
      }

      if (authorName.isEmpty) {
        if (message.author.firstName != null && message.author.firstName!.isNotEmpty) {
          authorName = message.author.firstName!;
        }
      }

      if (authorName.isEmpty) {
        String cleanName = message.author.id;
        if (cleanName.contains('_gmail_com'))
          cleanName = cleanName.replaceAll('_gmail_com', '');
        else if (cleanName.contains('@')) cleanName = cleanName.split('@')[0];
        authorName = cleanName;
      }
    }

    final initials = authorName.isNotEmpty ? authorName[0].toUpperCase() : '?';

    return childBuilder(authorName, avatarUrl, initials, isMe);
  }

  String? _resolveReplyName(types.Message message, dynamic rawData, String myId, String myName, String myEmail) {
    final replyData = message.metadata?['replyTo'] as Map<String, dynamic>?;
    if (replyData != null && replyData['authorId'] != null) {
      return _resolveAuthorNameLocal(
          rawData: rawData, authorId: replyData['authorId'], storedName: replyData['authorName'], myUserId: myId, myUserName: myName, myUserEmail: myEmail);
    }
    return null;
  }

  Widget _buildDateHeader(BuildContext context, int? timestamp) {
    if (timestamp == null) return const SizedBox.shrink();
    final date = DateTime.fromMillisecondsSinceEpoch(timestamp);
    String text;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = DateTime(now.year, now.month, now.day - 1);
    final msgDate = DateTime(date.year, date.month, date.day);
    if (msgDate == today)
      text = 'today'.tr(context: context);
    else if (msgDate == yesterday)
      text = 'chat.yesterday'.tr(context: context);
    else
      text = DateFormat('d MMMM yyyy', context.locale.toString()).format(date);
    return Center(
      child: Container(
        margin: const EdgeInsets.only(top: 12, bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(color: const Color(0xFFF5F5F5), borderRadius: BorderRadius.circular(12)),
        child: Text(text, style: GoogleFonts.montserrat(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black)),
      ),
    );
  }

  Widget _buildTypingIndicator(dynamic usersData, dynamic rawStaffData) {
    final users = usersData as List<dynamic>? ?? [];
    return Padding(
        padding: const EdgeInsets.only(left: 0, bottom: 4, top: 4),
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: users.map((u) {
              final userMap = u as Map<String, dynamic>;
              final userId = userMap['id'];
              String? avatarUrl = userMap['photoUrl'];

              if (userId != null) {
                final localAvatar = _findStaffAvatar(rawStaffData, userId);
                if (localAvatar != null && localAvatar.isNotEmpty) {
                  avatarUrl = localAvatar;
                }
              }

              return TypingBubble(name: userMap['name'] ?? '', avatarUrl: avatarUrl);
            }).toList()));
  }

  DateTime _toDate(int? ms) => ms != null ? DateTime.fromMillisecondsSinceEpoch(ms) : DateTime.now();

  bool _isSameDay(int? t1, int? t2) {
    if (t1 == null || t2 == null) return false;
    final d1 = DateTime.fromMillisecondsSinceEpoch(t1);
    final d2 = DateTime.fromMillisecondsSinceEpoch(t2);
    return d1.year == d2.year && d1.month == d2.month && d1.day == d2.day;
  }

  void _updateCompanyLogo(WidgetRef ref, dynamic data) {
    if (data == null) return;
    try {
      final dynamic company = data;
      final String? logo = company.logo;
      if (logo != null && logo.isNotEmpty) {
        ref.read(horaCompanyLogoProvider.notifier).state = logo;
        return;
      }
    } catch (_) {}
    if (data is Map) {
      final logo = data['logo'] ?? data['logoPerusahaan'];
      if (logo != null && logo.toString().isNotEmpty) ref.read(horaCompanyLogoProvider.notifier).state = logo.toString();
    } else if (data is List && data.isNotEmpty) {
      final firstItem = data[0];
      if (firstItem is Map) {
        final logo = firstItem['logo'] ?? firstItem['logoPerusahaan'];
        if (logo != null) ref.read(horaCompanyLogoProvider.notifier).state = logo.toString();
      }
    }
  }
}