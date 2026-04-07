import 'dart:async';
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_chat_types/flutter_chat_types.dart' as types;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:apppro/feature/chat/domain/repository/chat_provider.dart';
import 'package:apppro/core/service/notification/push_notification_provider.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:apppro/feature/profile/domain/repositories/profile_provider.dart';
import 'package:apppro/api/core/state/app_state.dart';

class HoraChatController {
  final Ref _ref;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  StreamSubscription<RemoteMessage>? _onMessageSubscription;

  static const String _collectionName = 'companies';
  static String _getKeyLastRead(String groupId) => 'hora_last_read_$groupId';

  HoraChatController(this._ref);

  Future<void> initChatService(String currentGroupId) async {
    try {
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true, badge: true, sound: true,
      );

      debugPrint(">>> Chat Init. Opened GroupID (CompanyID): $currentGroupId");

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        await _onMessageSubscription?.cancel();
        _onMessageSubscription = FirebaseMessaging.onMessage.listen((RemoteMessage message) {
          debugPrint('=== FCM Message Received (Foreground) ===');
          final data = message.data;
          final String? msgCompanyId = data['companyId']?.toString();
          final String? fallbackId = (data['groupId'] ?? data['targetId'])?.toString();
          final String idToCheck = msgCompanyId ?? fallbackId ?? '';
          final String currentIdStr = currentGroupId.toString();

          if (idToCheck == currentIdStr) {
            return;
          }
          _ref.read(localNotificationServiceProvider).showLocalBannerFromRemoteMessage(message);
        });
      }
    } catch (e) {
      debugPrint("Error init FCM: $e");
    }
  }

  void disposeChatListener() {
    debugPrint("Disposing Chat Listener...");
    _onMessageSubscription?.cancel();
    _onMessageSubscription = null;
  }

  Future<void> markChatAsRead(String groupId) async {
    if (groupId.isEmpty) return;
    try {
      final querySnapshot = await _firestore
          .collection(_collectionName)
          .doc(groupId)
          .collection('messages')
          .orderBy('createdAt', descending: true)
          .limit(1)
          .get();

      DateTime lastMessageTime;

      if (querySnapshot.docs.isNotEmpty) {
        final data = querySnapshot.docs.first.data();
        if (data['createdAt'] is Timestamp) {
          lastMessageTime = (data['createdAt'] as Timestamp).toDate();
        } else {
          lastMessageTime = DateTime.now();
        }
      } else {
        lastMessageTime = DateTime.now();
      }

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_getKeyLastRead(groupId), lastMessageTime.toIso8601String());
    } catch (e) {
      debugPrint("Failed to mark chat as read: $e");
    }
  }

  Stream<int> getUnreadCountStream(String groupId) async* {
    if (groupId.isEmpty) {
      yield 0;
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final lastReadString = prefs.getString(_getKeyLastRead(groupId));

    DateTime lastReadTime = lastReadString != null
        ? DateTime.parse(lastReadString)
        : DateTime.now();

    yield* _firestore.collection(_collectionName).doc(groupId).collection('messages')
        .where('createdAt', isGreaterThan: Timestamp.fromDate(lastReadTime))
        .limit(100)
        .snapshots()
        .map((snapshot) {
      final currentUserId = _ref.read(horaChatIdProvider);
      final unreadDocs = snapshot.docs.where((doc) {
        final data = doc.data();
        final authorId = data['authorId']?.toString();
        return authorId != currentUserId;
      });
      return unreadDocs.length;
    });
  }

  Future<DocumentSnapshot?> getMessageSnapshot(String groupId, String messageId) async {
    try {
      final doc = await _firestore.collection(_collectionName).doc(groupId).collection('messages').doc(messageId).get();
      return doc.exists ? doc : null;
    } catch (e) { return null; }
  }

  Future<int> countMessagesNewerThan(String groupId, DateTime timestamp) async {
    try {
      final query = _firestore.collection(_collectionName).doc(groupId).collection('messages')
          .where('createdAt', isGreaterThan: Timestamp.fromDate(timestamp));
      final countQuery = await query.count().get();
      return countQuery.count ?? 0;
    } catch (e) { return 0; }
  }

  Future<void> updateOnlineStatus(String groupId, bool isOnline) async {
    final currentUserId = _ref.read(horaChatIdProvider);
    final currentUserName = _ref.read(horaChatNameProvider);
    if (groupId.isEmpty || currentUserId.isEmpty) return;

    try {
      final docRef = _firestore.collection(_collectionName).doc(groupId).collection('online_users').doc(currentUserId);
      if (isOnline) {
        await docRef.set({
          'userId': currentUserId,
          'userName': currentUserName,
          'lastSeen': FieldValue.serverTimestamp(),
          'isOnline': true,
        });
      } else {
        await docRef.delete();
      }
    } catch (e) { debugPrint("Error updating online status: $e"); }
  }

  Stream<int> getOnlineUsersCountStream(String groupId) {
    if (groupId.isEmpty) return Stream.value(0);
    return _firestore.collection(_collectionName).doc(groupId).collection('online_users').snapshots().map((s) {
      final now = DateTime.now();
      return s.docs.where((doc) {
        final data = doc.data();
        if (data['lastSeen'] == null) return false;
        final lastSeen = (data['lastSeen'] as Timestamp).toDate();
        // Hanya hitung user yang aktif dalam 1 menit terakhir
        return now.difference(lastSeen).inMinutes < 1;
      }).length;
    });
  }

  Future<void> sendTypingStatus(String groupId, bool isTyping, {String? photoUrl}) async {
    final currentUserId = _ref.read(horaChatIdProvider);
    final currentUserName = _ref.read(horaChatNameProvider);
    if (groupId.isEmpty || currentUserId.isEmpty) return;

    try {
      final docRef = _firestore.collection(_collectionName).doc(groupId).collection('typing_status').doc(currentUserId);
      if (isTyping) {
        await docRef.set({
          'isTyping': true,
          'userName': currentUserName,
          'photoUrl': photoUrl,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      } else {
        await docRef.delete();
      }
    } catch (e) { debugPrint("Error sending typing status: $e"); }
  }

  Stream<List<Map<String, String>>> getTypingUsersStream(String groupId, String excludeUserId) {
    if (groupId.isEmpty) return const Stream.empty();
    return _firestore.collection(_collectionName).doc(groupId).collection('typing_status').snapshots().map((snapshot) {
      return snapshot.docs.where((doc) {
        return doc.id != excludeUserId && doc.data()['isTyping'] == true;
      }).map((doc) {
        final data = doc.data();
        return {
          'id': doc.id,
          'name': data['userName'] as String? ?? 'Seseorang',
          'photoUrl': data['photoUrl'] as String? ?? '',
        };
      }).toList();
    });
  }

  Future<void> pinMessage(String groupId, types.Message message, String authorName) async {
    if (groupId.isEmpty) return;
    try {
      await _firestore.collection(_collectionName).doc(groupId).collection('messages').doc(message.id).update({
        'metadata.isPinned': true,
        'metadata.pinnedBy': authorName,
        'metadata.pinnedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) { debugPrint("Gagal pin pesan: $e"); }
  }

  Future<void> unpinMessage(String groupId, String messageId) async {
    if (groupId.isEmpty) return;
    try {
      await _firestore.collection(_collectionName).doc(groupId).collection('messages').doc(messageId).update({'metadata.isPinned': FieldValue.delete()});
    } catch (e) { debugPrint("Gagal unpin pesan: $e"); }
  }

  Stream<List<types.Message>> getPinnedMessagesStream(String groupId) {
    if (groupId.isEmpty) return const Stream.empty();
    return _firestore.collection(_collectionName).doc(groupId).collection('messages')
        .where('metadata.isPinned', isEqualTo: true)
        .snapshots()
        .map((snapshot) {
      final messages = _mapQuerySnapshotToMessages(snapshot);
      messages.sort((a, b) => (b.createdAt ?? 0).compareTo(a.createdAt ?? 0));
      return messages;
    });
  }

  Stream<List<types.Message>> getMessagesStream(String groupId, {int limit = 20}) {
    if (groupId.isEmpty) return const Stream.empty();
    return _firestore.collection(_collectionName).doc(groupId).collection('messages')
        .orderBy('createdAt', descending: true)
        .limit(limit)
        .snapshots()
        .map((snapshot) => _mapQuerySnapshotToMessages(snapshot));
  }

  List<types.Message> _mapQuerySnapshotToMessages(QuerySnapshot snapshot) {
    return snapshot.docs.map((doc) {
      final data = doc.data() as Map<String, dynamic>;
      final createdAt = data['createdAt'] is Timestamp ? (data['createdAt'] as Timestamp).toDate() : DateTime.now();
      final authorId = data['authorId']?.toString() ?? 'unknown';
      final id = doc.id;
      final type = data['type'];
      final metadata = data['metadata'] as Map<String, dynamic>? ?? {};
      final authorName = data['authorName']?.toString();
      final authorEmail = data['authorEmail']?.toString();
      final userMetadata = {'email': authorEmail};

      final user = types.User(
          id: authorId,
          firstName: authorName,
          metadata: userMetadata
      );

      if (type == 'image') {
        return types.ImageMessage(
          id: id, author: user, createdAt: createdAt.millisecondsSinceEpoch,
          name: data['name'] ?? 'image.jpg', size: (data['size'] ?? 0).toInt(), uri: data['uri'] ?? '', metadata: metadata,
        );
      } else if (type == 'video') {
        return types.VideoMessage(
          id: id, author: user, createdAt: createdAt.millisecondsSinceEpoch,
          name: data['name'] ?? 'video.mp4', size: (data['size'] ?? 0).toInt(), uri: data['uri'] ?? '', metadata: metadata,
        );
      } else if (type == 'file') {
        return types.FileMessage(
          id: id, author: user, createdAt: createdAt.millisecondsSinceEpoch,
          name: data['name'] ?? 'document', size: (data['size'] ?? 0).toInt(), uri: data['uri'] ?? '', metadata: metadata, mimeType: data['mimeType'],
        );
      } else if (type == 'custom') {
        return types.CustomMessage(
          id: id, author: user, createdAt: createdAt.millisecondsSinceEpoch, metadata: metadata,
        );
      } else {
        return types.TextMessage(
          id: id, author: user, createdAt: createdAt.millisecondsSinceEpoch, text: data['text']?.toString() ?? '', metadata: metadata,
        );
      }
    }).toList();
  }

  Future<void> sendMessage({
    required String text,
    required String targetId,
    types.Message? replyMessage,
    String? replyName,
    Map<String, dynamic>? extraMetadata,
  }) async {
    final currentUserId = _ref.read(horaChatIdProvider);
    final currentUserName = _ref.read(horaChatNameProvider);
    final currentUserEmail = _ref.read(horaChatEmailProvider);

    if (currentUserId.isEmpty || targetId.isEmpty) return;

    Map<String, dynamic> metadata = {'platform': Platform.isAndroid ? 'android' : 'ios'};

    if (extraMetadata != null) {
      metadata.addAll(extraMetadata);
    }

    if (text.contains('PING!!!')) {
      metadata['isUrgent'] = true;
      metadata['priority'] = 'high';
    }

    if (replyMessage != null) {
      String replyType = "text";
      String replyPreview = "";
      if (replyMessage is types.TextMessage) { replyPreview = replyMessage.text; replyType = "text"; }
      else if (replyMessage is types.ImageMessage) { replyPreview = "胴 Foto"; replyType = "image"; }
      else if (replyMessage is types.VideoMessage) { replyPreview = "磁 Video"; replyType = "video"; }
      else if (replyMessage is types.FileMessage) { replyPreview = "塘 Dokumen"; replyType = "file"; }
      else { replyPreview = "Pesan"; replyType = "custom"; }

      String replyTime = "";
      if (replyMessage.createdAt != null) {
        final date = DateTime.fromMillisecondsSinceEpoch(replyMessage.createdAt!);
        replyTime = "${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}";
      }

      metadata['replyTo'] = {
        'id': replyMessage.id, 'text': replyPreview, 'type': replyType,
        'authorId': replyMessage.author.id, 'authorName': replyName ?? 'Unknown',
        'time': replyTime,
      };
    }

    final messageData = {
      'authorId': currentUserId,
      'authorName': currentUserName,
      'authorEmail': currentUserEmail,
      'createdAt': FieldValue.serverTimestamp(),
      'text': text, 'type': 'text', 'metadata': metadata,
    };

    try {
      await _firestore.collection(_collectionName).doc(targetId).collection('messages').add(messageData);
    } catch (e) { debugPrint("Gagal kirim pesan: $e"); rethrow; }
  }

  Future<void> sendTaskMessage({required String taskId, required String taskTitle, required String targetId}) async {
    final currentUserId = _ref.read(horaChatIdProvider);
    final currentUserName = _ref.read(horaChatNameProvider);
    final currentUserEmail = _ref.read(horaChatEmailProvider);
    if (currentUserId.isEmpty || targetId.isEmpty) return;
    final messageData = {
      'authorId': currentUserId, 'authorName': currentUserName, 'authorEmail': currentUserEmail,
      'createdAt': FieldValue.serverTimestamp(), 'type': 'custom',
      'metadata': {'subtype': 'task', 'taskId': taskId, 'taskTitle': taskTitle, 'platform': Platform.isAndroid ? 'android' : 'ios'},
    };
    await _firestore.collection(_collectionName).doc(targetId).collection('messages').add(messageData);
  }

  Future<void> sendLeaveMessage({required String leaveId, required String leaveTitle, required String targetId}) async {
    final currentUserId = _ref.read(horaChatIdProvider);
    final currentUserName = _ref.read(horaChatNameProvider);
    final currentUserEmail = _ref.read(horaChatEmailProvider);
    if (currentUserId.isEmpty || targetId.isEmpty) return;
    final messageData = {
      'authorId': currentUserId, 'authorName': currentUserName, 'authorEmail': currentUserEmail,
      'createdAt': FieldValue.serverTimestamp(), 'type': 'custom',
      'metadata': {'subtype': 'leave_request', 'leaveId': leaveId, 'leaveTitle': leaveTitle, 'platform': Platform.isAndroid ? 'android' : 'ios'},
    };
    await _firestore.collection(_collectionName).doc(targetId).collection('messages').add(messageData);
  }

  Future<void> sendReimbursementMessage({required String reimbursementId, required String title, required String amount, required String targetId}) async {
    final currentUserId = _ref.read(horaChatIdProvider);
    final currentUserName = _ref.read(horaChatNameProvider);
    final currentUserEmail = _ref.read(horaChatEmailProvider);
    if (currentUserId.isEmpty || targetId.isEmpty) return;
    final messageData = {
      'authorId': currentUserId, 'authorName': currentUserName, 'authorEmail': currentUserEmail,
      'createdAt': FieldValue.serverTimestamp(), 'type': 'custom',
      'metadata': {'subtype': 'reimbursement', 'reimbursementId': reimbursementId, 'title': title, 'amount': amount, 'platform': Platform.isAndroid ? 'android' : 'ios'},
    };
    await _firestore.collection(_collectionName).doc(targetId).collection('messages').add(messageData);
  }

  Future<void> sendProfileMessage({required String targetId}) async {
    final currentUserId = _ref.read(horaChatIdProvider);
    final currentUserName = _ref.read(horaChatNameProvider);
    final currentUserEmail = _ref.read(horaChatEmailProvider);
    if (currentUserId.isEmpty || targetId.isEmpty) return;
    final messageData = {
      'authorId': currentUserId, 'authorName': currentUserName, 'authorEmail': currentUserEmail,
      'createdAt': FieldValue.serverTimestamp(), 'type': 'custom',
      'metadata': {'subtype': 'profile_share', 'platform': Platform.isAndroid ? 'android' : 'ios'},
    };
    await _firestore.collection(_collectionName).doc(targetId).collection('messages').add(messageData);
  }

  Future<void> sendContactMessage({required String contactId, required String shareToken, required String contactName, required String targetId}) async {
    final currentUserId = _ref.read(horaChatIdProvider);
    final currentUserName = _ref.read(horaChatNameProvider);
    final currentUserEmail = _ref.read(horaChatEmailProvider);
    if (currentUserId.isEmpty || targetId.isEmpty) return;
    final messageData = {
      'authorId': currentUserId, 'authorName': currentUserName, 'authorEmail': currentUserEmail,
      'createdAt': FieldValue.serverTimestamp(), 'type': 'custom',
      'metadata': {'subtype': 'contact_share', 'contactId': contactId, 'shareToken': shareToken, 'contactName': contactName, 'platform': Platform.isAndroid ? 'android' : 'ios'},
    };
    await _firestore.collection(_collectionName).doc(targetId).collection('messages').add(messageData);
  }

  Future<void> sendRecordingMessage({required String filePath, required String durationText, required String amplitudes, required String targetId}) async {
    File file = File(filePath);
    String fileName = "REC_${DateTime.now().millisecondsSinceEpoch}.aac";
    try {
      Reference ref = _storage.ref().child('chat_audio/$targetId/$fileName');
      UploadTask uploadTask = ref.putFile(file);
      TaskSnapshot snapshot = await uploadTask;
      String downloadUrl = await snapshot.ref.getDownloadURL();
      await sendUploadedRecordingMessage(audioUrl: downloadUrl, durationText: durationText, amplitudes: amplitudes, targetId: targetId);
    } catch (e) { debugPrint("Gagal kirim rekaman: $e"); rethrow; }
  }

  Future<void> sendUploadedRecordingMessage({required String audioUrl, required String durationText, required String amplitudes, required String targetId}) async {
    final currentUserId = _ref.read(horaChatIdProvider);
    final currentUserName = _ref.read(horaChatNameProvider);
    final currentUserEmail = _ref.read(horaChatEmailProvider);
    if (currentUserId.isEmpty || targetId.isEmpty) return;
    final messageData = {
      'authorId': currentUserId, 'authorName': currentUserName, 'authorEmail': currentUserEmail,
      'createdAt': FieldValue.serverTimestamp(), 'type': 'custom',
      'metadata': {'subtype': 'recording', 'audioUrl': audioUrl, 'duration': durationText, 'amplitudes': amplitudes, 'platform': Platform.isAndroid ? 'android' : 'ios'},
    };
    await _firestore.collection(_collectionName).doc(targetId).collection('messages').add(messageData);
  }

  Future<void> sendSharedMediaMessage({
    required String downloadUrl,
    required String name,
    required int size,
    required String mimeType,
    required String typeString, // 'image', 'video', or 'file'
    required String targetId,
  }) async {
    final currentUserId = _ref.read(horaChatIdProvider);
    final currentUserName = _ref.read(horaChatNameProvider);
    final currentUserEmail = _ref.read(horaChatEmailProvider);
    if (currentUserId.isEmpty || targetId.isEmpty) return;
    
    final messageData = {
      'authorId': currentUserId, 
      'authorName': currentUserName, 
      'authorEmail': currentUserEmail,
      'createdAt': FieldValue.serverTimestamp(), 
      'uri': downloadUrl, 
      'type': typeString, 
      'name': name,
      'size': size,
      'mimeType': mimeType,
      'metadata': {},
    };
    try {
      await _firestore.collection(_collectionName).doc(targetId).collection('messages').add(messageData);
    } catch (e) { 
      debugPrint("Gagal kirim shared media: $e"); 
    }
  }

  // [UPDATE] Menambahkan parameter caption dan address
  Future<void> sendImageSendMessage({required String filePath, required String targetId, String? caption, String? address}) async {
    final currentUserId = _ref.read(horaChatIdProvider);
    final currentUserName = _ref.read(horaChatNameProvider);
    final currentUserEmail = _ref.read(horaChatEmailProvider);
    File file = File(filePath);
    String fileName = "IMG_${DateTime.now().millisecondsSinceEpoch}.jpg";
    try {
      Reference ref = _storage.ref().child('chat_media/$targetId/$fileName');
      UploadTask uploadTask = ref.putFile(file);
      TaskSnapshot snapshot = await uploadTask;
      String downloadUrl = await snapshot.ref.getDownloadURL();

      Map<String, dynamic> metadata = {};
      if (caption != null && caption.isNotEmpty) {
        metadata['caption'] = caption;
      }
      if (address != null && address.isNotEmpty) {
        metadata['address'] = address;
      }

      final messageData = {
        'authorId': currentUserId, 'authorName': currentUserName, 'authorEmail': currentUserEmail,
        'createdAt': FieldValue.serverTimestamp(), 'uri': downloadUrl, 'type': 'image', 'name': fileName,
        'size': snapshot.totalBytes,
        'metadata': metadata,
      };
      await _firestore.collection(_collectionName).doc(targetId).collection('messages').add(messageData);
    } catch (e) { debugPrint("Gagal upload gambar: $e"); }
  }

  // [UPDATE] Menambahkan parameter caption dan address
  Future<void> sendVideoSendMessage({required String filePath, required String targetId, String? caption, String? address}) async {
    final currentUserId = _ref.read(horaChatIdProvider);
    final currentUserName = _ref.read(horaChatNameProvider);
    final currentUserEmail = _ref.read(horaChatEmailProvider);
    File file = File(filePath);
    String fileName = "VID_${DateTime.now().millisecondsSinceEpoch}.mp4";
    try {
      Reference ref = _storage.ref().child('chat_media/$targetId/$fileName');
      UploadTask uploadTask = ref.putFile(file);
      TaskSnapshot snapshot = await uploadTask;
      String downloadUrl = await snapshot.ref.getDownloadURL();

      Map<String, dynamic> metadata = {};
      if (caption != null && caption.isNotEmpty) {
        metadata['caption'] = caption;
      }
      if (address != null && address.isNotEmpty) {
        metadata['address'] = address;
      }

      final messageData = {
        'authorId': currentUserId, 'authorName': currentUserName, 'authorEmail': currentUserEmail,
        'createdAt': FieldValue.serverTimestamp(), 'uri': downloadUrl, 'type': 'video', 'name': fileName,
        'size': snapshot.totalBytes,
        'metadata': metadata,
      };
      await _firestore.collection(_collectionName).doc(targetId).collection('messages').add(messageData);
    } catch (e) { debugPrint("Gagal upload video: $e"); }
  }

  Future<void> sendFileSendMessage({required String filePath, required String fileName, required String targetId, String? mimeType}) async {
    final currentUserId = _ref.read(horaChatIdProvider);
    final currentUserName = _ref.read(horaChatNameProvider);
    final currentUserEmail = _ref.read(horaChatEmailProvider);
    File file = File(filePath);
    String storageName = "DOC_${DateTime.now().millisecondsSinceEpoch}_$fileName";
    try {
      Reference ref = _storage.ref().child('chat_docs/$targetId/$storageName');
      UploadTask uploadTask = ref.putFile(file);
      TaskSnapshot snapshot = await uploadTask;
      String downloadUrl = await snapshot.ref.getDownloadURL();
      final messageData = {
        'authorId': currentUserId, 'authorName': currentUserName, 'authorEmail': currentUserEmail,
        'createdAt': FieldValue.serverTimestamp(), 'uri': downloadUrl, 'type': 'file', 'name': fileName, 'size': snapshot.totalBytes, 'mimeType': mimeType,
      };
      await _firestore.collection(_collectionName).doc(targetId).collection('messages').add(messageData);
    } catch (e) { debugPrint("Gagal upload dokumen: $e"); }
  }
}