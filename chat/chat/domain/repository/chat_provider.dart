import 'package:flutter_chat_core/flutter_chat_core.dart' show Message, User;
import 'package:flutter_riverpod/legacy.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:apppro/feature/chat/domain/repository/hora_chat_controller.dart';
import 'package:apppro/feature/chat/domain/repository/messages_notifier.dart';
import 'package:uuid/uuid.dart';
import 'package:flutter_chat_types/flutter_chat_types.dart' as types;

final uuidProvider = Provider((ref) => const Uuid());

// Hapus Provider Agora Client jika tidak dipakai lagi
// final agoraChatClientProvider = ...

/// Provider untuk User ID saat ini
final horaChatIdProvider = StateProvider<String>((ref) => "");
final horaChatNameProvider = StateProvider<String>((ref) => "");
final horaChatGroupIdProvider = StateProvider<String>((ref) => "");

// [BARU] Provider Email untuk backward compatibility (Mengenali chat lama)
final horaChatEmailProvider = StateProvider<String>((ref) => "");

// Provider untuk Logo Perusahaan di Header
final horaCompanyLogoProvider = StateProvider<String>((ref) => "");

// Provider untuk menyimpan pesan draft sementara (untuk pre-fill dari halaman lain)
final chatDraftMessageProvider = StateProvider<String>((ref) => "");

// Provider untuk menyimpan pesan yang sedang di-reply
final chatReplyMessageProvider = StateProvider<types.Message?>((ref) => null);

// Provider untuk menampung pesan yang sedang proses upload (Optimistic UI)
final pendingMessagesProvider = StateProvider<List<types.Message>>((ref) => []);

// Provider MessagesNotifier (Opsional)
final horaMessagesProvider = StateNotifierProvider<MessagesNotifier, List<Message>>((ref) {
  return MessagesNotifier(ref);
});

// Provider Controller UTAMA (Firebase)
final horaChatControllerProvider = Provider<HoraChatController>((ref) {
  return HoraChatController(ref);
});

// Provider untuk stream typing indicator
final typingUsersStreamProvider = StreamProvider.autoDispose.family<List<Map<String, String>>, String>((ref, groupId) {
  final currentUserId = ref.watch(horaChatIdProvider);
  return ref.watch(horaChatControllerProvider).getTypingUsersStream(groupId, currentUserId);
});

// Provider untuk menghitung jumlah Online User
final onlineUsersCountProvider = StreamProvider.autoDispose.family<int, String>((ref, groupId) {
  return ref.watch(horaChatControllerProvider).getOnlineUsersCountStream(groupId);
});

// Provider untuk mendapatkan list pesan yang di-pin
final pinnedMessagesListStreamProvider = StreamProvider.autoDispose.family<List<types.Message>, String>((ref, groupId) {
  return ref.watch(horaChatControllerProvider).getPinnedMessagesStream(groupId);
});

// [ADDED] Provider untuk Stream jumlah Unread Message
// Provider ini memantau perubahan jumlah pesan baru dari Firestore berdasarkan waktu baca terakhir
final unreadChatCountStreamProvider = StreamProvider.autoDispose.family<int, String>((ref, groupId) {
  return ref.watch(horaChatControllerProvider).getUnreadCountStream(groupId);
});