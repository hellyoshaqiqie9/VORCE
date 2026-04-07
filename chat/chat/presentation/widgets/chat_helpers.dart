part of '../views/chat.dart';

class ChatLogicHelper {
  /// Cek apakah pesan ini dari user yang sedang login
  static bool checkIsMe({
    required String messageAuthorId,
    required String myUserId,
    required String myUserEmail,
  }) {
    if (messageAuthorId == myUserId) return true;
    if (myUserEmail.isNotEmpty) {
      final legacyId = myUserEmail.replaceAll('.', '_').replaceAll('@', '_');
      if (messageAuthorId == legacyId) return true;
      if (messageAuthorId == myUserEmail) return true;
    }
    return false;
  }

  /// Normalisasi pesan agar library UI mengenali ID "Saya" dengan benar
  static types.Message normalizeMessageAuthor({
    required types.Message message,
    required String myUserId,
    required String myUserName,
    required String myUserEmail,
  }) {
    // Cek dulu apakah ini saya
    final isMe = checkIsMe(
      messageAuthorId: message.author.id,
      myUserId: myUserId,
      myUserEmail: myUserEmail,
    );

    // Jika pesan ini dari saya tapi ID-nya masih pakai email/legacy,
    // kita ubah sementara author-nya jadi UID agar posisi chat di kanan.
    if (isMe && message.author.id != myUserId) {
      final newAuthor = types.User(id: myUserId, firstName: myUserName);
      if (message is types.TextMessage) return message.copyWith(author: newAuthor);
      if (message is types.ImageMessage) return message.copyWith(author: newAuthor);
      if (message is types.VideoMessage) return message.copyWith(author: newAuthor);
      if (message is types.FileMessage) return message.copyWith(author: newAuthor);
      if (message is types.CustomMessage) return message.copyWith(author: newAuthor);
      if (message is types.AudioMessage) return message.copyWith(author: newAuthor);
    }
    return message;
  }

  /// Mengamankan parsing list staff dari dynamic data
  static List<dynamic> getSafeStaffList(dynamic data) {
    if (data is List) return data;
    if (data is Map<String, dynamic>) {
      if (data['data'] is List) return data['data'];
    }
    return [];
  }

  /// Mencari data staff spesifik berdasarkan ID/Email
  static dynamic findStaffData(dynamic rawData, String authorId) {
    final staffs = getSafeStaffList(rawData);
    if (staffs.isEmpty) return null;

    final normalizedId = authorId.toLowerCase();

    for (var s in staffs) {
      String? email;
      String? idKaryawan;
      String? uid;

      try {
        final d = s as dynamic;
        if (s is Map) {
          email = s['email'] ?? s['alamatEmail'];
          idKaryawan = s['idkaryawan']?.toString();
          uid = s['uid']?.toString() ?? s['userId']?.toString();
        } else {
          email = d.alamatEmail;
          idKaryawan = d.idkaryawan;
          try {
            uid = d.uid?.toString();
          } catch (_) {}
        }

        if (uid != null && uid.toLowerCase() == normalizedId) return s;
        if (idKaryawan != null && idKaryawan.toString().toLowerCase() == normalizedId) return s;

        if (email != null) {
          final emailLower = email.toLowerCase();
          if (emailLower == normalizedId) return s;
          final transformedEmailId = emailLower.replaceAll(RegExp(r'[.@]+'), '_');
          if (transformedEmailId == normalizedId) return s;
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  /// Mendapatkan nama author final (Prioritas: Saya > Stored Name > Staff List > ID)
  static String resolveAuthorName({
    required dynamic rawData,
    required String authorId,
    required String? storedName,
    required String myUserId,
    required String myUserName,
    required String myUserEmail,
  }) {
    // 1. Cek Saya
    if (checkIsMe(messageAuthorId: authorId, myUserId: myUserId, myUserEmail: myUserEmail)) {
      return myUserName.isNotEmpty ? myUserName : 'Saya';
    }

    // 2. Cek Stored Name (dari Firestore)
    if (storedName != null && storedName.isNotEmpty) {
      return storedName;
    }

    // 3. Cek Staff List
    final staff = findStaffData(rawData, authorId);
    if (staff != null) {
      try {
        final d = staff as dynamic;
        if (staff is Map) {
          return staff['username'] ?? staff['namaKaryawan'] ?? 'Unknown';
        }
        return d.namaKaryawan ?? 'Unknown';
      } catch (_) {}
    }

    // 4. Fallback ID
    String cleanName = authorId;
    if (cleanName.contains('_gmail_com')) {
      cleanName = cleanName.replaceAll('_gmail_com', '');
    } else if (cleanName.contains('@')) {
      cleanName = cleanName.split('@')[0];
    }
    cleanName = cleanName.replaceAll('_', ' ');
    return cleanName;
  }

  /// Mendapatkan Avatar URL
  static String? resolveAuthorAvatar(dynamic rawData, String authorId) {
    final staff = findStaffData(rawData, authorId);
    if (staff != null) {
      try {
        final d = staff as dynamic;
        if (staff is Map) {
          return staff['photoURL'] ?? staff['foto'];
        }
        return d.foto;
      } catch (_) {}
    }
    return null;
  }
}