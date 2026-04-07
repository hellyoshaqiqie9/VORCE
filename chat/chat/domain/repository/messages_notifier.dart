import 'package:agora_chat_sdk/agora_chat_sdk.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_chat_core/flutter_chat_core.dart' as types;
import 'package:flutter_riverpod/legacy.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:apppro/feature/chat/domain/repository/chat_provider.dart';

/// =======================================
/// MessagesNotifier (state untuk chat list)
/// =======================================
class MessagesNotifier extends StateNotifier<List<types.Message>> {
  final Ref _ref;

  MessagesNotifier(this._ref) : super([]);

  /// Tambah pesan baru (ditaruh paling awal)
  void addMessage(types.Message message) {
    state = [message, ...state];
  }

  /// Update pesan berdasarkan ID
  void updateMessage(String oldId, types.Message updatedMessage) {
    debugPrint('[MessagesNotifier] updateMessage called for ID: $oldId');
    state = [
      for (final message in state)
        if (message.id == oldId) updatedMessage else message,
    ];
  }

  /// Hapus pesan
  void removeMessage(String messageId) {
    state = state.where((message) => message.id != messageId).toList();
  }

  /// Replace pesan temp → server
  void replaceMessage(String localId, ChatMessage realMsg) {
    final converted = _convertToChatUIMessage(realMsg, _ref);
    if (converted != null) {
      updateMessage(localId, converted);
    }
  }

  /// Handle pesan masuk dari Agora
  void handleAgoraReceivedMessage(ChatMessage agoraMessage) {
    final convertedMessage = _convertToChatUIMessage(agoraMessage, _ref);

    if (convertedMessage != null) {
      final localId = agoraMessage.attributes?['localId'];

      if (localId != null) {
        // replace temp message
        final temp = state.firstWhereOrNull((m) => m.id == localId);
        if (temp != null) {
          debugPrint('[MessagesNotifier] Replace temp $localId → ${convertedMessage.id}');
          updateMessage(localId, convertedMessage);
          return;
        }
      }

      // fallback: cek existing serverId
      final existing = state.firstWhereOrNull((m) => m.id == convertedMessage.id);
      if (existing != null) {
        updateMessage(existing.id, convertedMessage);
      } else {
        addMessage(convertedMessage);
      }
    }
  }

  /// Convert ChatMessage (Agora) → UI Message
  types.Message? _convertToChatUIMessage(ChatMessage msg, Ref ref) {
    final String id = msg.msgId;
    final String authorId = msg.from ?? 'unknown_sender';
    final DateTime createdAt = DateTime.fromMillisecondsSinceEpoch(msg.serverTime);

    switch (msg.body.type) {
      case MessageType.TXT:
        final content = (msg.body as ChatTextMessageBody).content;
        return types.TextMessage(
          id: id,
          authorId: authorId,
          createdAt: createdAt,
          text: content ?? '',
        );

      case MessageType.IMAGE:
        final imageBody = msg.body as ChatImageMessageBody;
        return types.ImageMessage(
          id: id,
          authorId: authorId,
          createdAt: createdAt,
          source: imageBody.remotePath ?? '',
          size: imageBody.fileSize?.toInt() ?? 0,
        );

      case MessageType.VIDEO:
        final videoBody = msg.body as ChatVideoMessageBody;
        return types.VideoMessage(
          id: id,
          authorId: authorId,
          createdAt: createdAt,
          name: videoBody.displayName ?? 'video.mp4',
          source: videoBody.remotePath ?? '',
          size: videoBody.fileSize?.toInt() ?? 0,
        );

      case MessageType.FILE:
        final fileBody = msg.body as ChatFileMessageBody;
        return types.FileMessage(
          id: id,
          authorId: authorId,
          createdAt: createdAt,
          name: fileBody.displayName ?? 'file',
          source: fileBody.remotePath ?? '',
          size: fileBody.fileSize?.toInt() ?? 0,
        );

      case MessageType.VOICE:
        final voiceBody = msg.body as ChatVoiceMessageBody;
        return types.AudioMessage(
          id: id,
          authorId: authorId,
          createdAt: createdAt,
          source: voiceBody.remotePath ?? '',
          size: voiceBody.fileSize?.toInt() ?? 0,
          duration: Duration(milliseconds: voiceBody.duration ?? 0),
        );

      default:
        return types.TextMessage(
          id: id,
          authorId: authorId,
          createdAt: createdAt,
          text: "Unsupported MessageType: ${msg.body.type}",
        );
    }
  }
}