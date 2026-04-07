import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dartz/dartz.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:apppro/api/core/exception/app_exception.dart';
import 'package:apppro/api/token/fcm_token.dart';
import 'package:apppro/core/service/pref/app_preference.dart';
import 'package:apppro/core/service/pref/app_preference_key.dart';
import 'package:apppro/core/utils/helper/formatter/error_response_formater.dart';
import 'package:apppro/core/utils/helper/helper.dart';
import 'package:apppro/feature/profile/data/profile_api.dart';
import 'package:apppro/feature/profile/domain/entities/company.dart';
import 'package:apppro/feature/profile/domain/entities/invitation.dart';
import 'package:apppro/feature/profile/domain/entities/staff.dart';
import 'package:apppro/feature/profile/domain/repositories/profile_provider.dart';
import 'package:apppro/feature/profile/domain/repositories/profile_repository.dart';

import 'package:apppro/feature/auth/data/auth_api.dart';
import 'package:apppro/api/core/response/app_response.dart';
import 'package:google_sign_in/google_sign_in.dart';

class ProfileDatasource implements ProfileRepository {
  final ProfileApi profileApi;
  final AuthApi authApi;
  final AppPreference appPreference;
  final Ref ref;

  ProfileDatasource({
    required this.profileApi,
    required this.authApi,
    required this.appPreference,
    required this.ref,
  });

  Map<String, dynamic> _mapFirestoreToProfile(Map<String, dynamic> firestoreData) {
    return {
      'namaKaryawan': firestoreData['username'] ?? firestoreData['namaKaryawan'] ?? '',
      'alamatEmail': firestoreData['alamatEmail'] ?? firestoreData['email'] ?? '',
      'noHP': firestoreData['noTelp'] ?? '',
      'noWA': firestoreData['noWA'] ?? '',
      'alamatLoc': firestoreData['alamatLoc'] ?? '',
      'foto': firestoreData['photoURL'] ?? firestoreData['foto'] ?? '',
      'namaPerusahaan': firestoreData['companyName'] ?? firestoreData['namaPerusahaan'] ?? '',
      'idperusahaan': firestoreData['idCompany'] ?? firestoreData['idperusahaan'] ?? '',
      'jabatan': firestoreData['role'] ?? '',
      'role': firestoreData['role'] ?? '',
      'idkaryawan': firestoreData['uid'] ?? '',
      'status': firestoreData['status'] ?? '',
      'gender': firestoreData['gender'] ?? '',
      'liked': 'no',
    };
  }

  Future<void> _updateLocalPreferences(Map<String, dynamic> data) async {
    if (data['alamatEmail'] != null) await appPreference.write<String>(AppPreferenceKey.email, data['alamatEmail']);
    if (data['namaKaryawan'] != null) await appPreference.write<String>(AppPreferenceKey.name, data['namaKaryawan']);

    String? roleStr = data['jabatan']?.toString() ?? data['role']?.toString();
    if (roleStr != null && roleStr.isNotEmpty) {
      await appPreference.write<String>(AppPreferenceKey.jabatan, roleStr);
      await appPreference.write<String>(AppPreferenceKey.role, roleStr);

      bool isAdmin = roleStr.toLowerCase().contains('admin');
      await appPreference.write<String>(AppPreferenceKey.isAdmin, isAdmin.toString());
    }

    if (data['idperusahaan'] != null) await appPreference.write<String>(AppPreferenceKey.idperusahaan, data['idperusahaan']);
    if (data['namaPerusahaan'] != null) await appPreference.write<String>(AppPreferenceKey.namaPerusahaan, data['namaPerusahaan']);

    if (data['foto'] != null) {
      await appPreference.write<String>(AppPreferenceKey.profilePicture, data['foto'].toString());
      ref.read(photoProfileProvider.notifier).state = data['foto'].toString();
    }
  }

  // --- NEW: FETCH LOCAL CACHE ---
  // Mengambil data dari AppPreference dan menyusunnya menjadi Map yang sesuai dengan Profile Model
  @override
  Future<Either<AppException, dynamic>> getLocalProfileCache() async {
    try {
      final name = await appPreference.read<String>(AppPreferenceKey.name) ?? '';
      final email = await appPreference.read<String>(AppPreferenceKey.email) ?? '';
      final photo = await appPreference.read<String>(AppPreferenceKey.profilePicture) ?? '';
      final role = await appPreference.read<String>(AppPreferenceKey.role) ?? '';
      final idPerusahaan = await appPreference.read<String>(AppPreferenceKey.idperusahaan) ?? '';
      final namaPerusahaan = await appPreference.read<String>(AppPreferenceKey.namaPerusahaan) ?? '';
      final idKaryawan = await appPreference.read<String>(AppPreferenceKey.idkaryawan) ?? '';

      // Jika email kosong, berarti belum login / cache kosong
      if (email.isEmpty) {
        return Left(AppException(message: "No local cache found"));
      }

      final Map<String, dynamic> localData = {
        'namaKaryawan': name,
        'alamatEmail': email,
        'foto': photo,
        'jabatan': role,
        'role': role,
        'idperusahaan': idPerusahaan,
        'namaPerusahaan': namaPerusahaan,
        'idkaryawan': idKaryawan,
        // Default values for fields not strictly stored in simple pref key
        'noHP': '',
        'noWA': '',
        'alamatLoc': '',
        'status': 'active',
      };

      debugPrint("Local Cache Loaded: $name");
      return Right(localData);
    } catch (e) {
      return Left(AppException(message: "Failed to load local cache"));
    }
  }
  // ------------------------------

  String _getSafeMessage(dynamic data) {
    if (data is Map<String, dynamic>) {
      return data['message']?.toString() ??
          data['msg']?.toString() ??
          data['data']?.toString() ??
          "Success";
    } else if (data is String) {
      return data;
    }
    return "Success";
  }

  Map<String, dynamic> _decodeJwt(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return {};
      String payload = parts[1];
      switch (payload.length % 4) {
        case 0: break;
        case 2: payload += '=='; break;
        case 3: payload += '='; break;
        default: throw Exception('Illegal base64url string!"');
      }
      payload = payload.replaceAll('-', '+').replaceAll('_', '/');
      final String decoded = utf8.decode(base64Url.decode(payload));
      return json.decode(decoded);
    } catch (e) {
      debugPrint("DEBUG JWT Error decoding: $e");
      return {};
    }
  }

  Map<String, dynamic>? _parseResponseData(dynamic data) {
    if (data is List && data.isNotEmpty) return data.first as Map<String, dynamic>;
    else if (data is Map<String, dynamic>) return data;
    else if (data is String) {
      try {
        final decoded = jsonDecode(data);
        if (decoded is List && decoded.isNotEmpty) return decoded.first as Map<String, dynamic>;
        return decoded as Map<String, dynamic>;
      } catch (e) {
        debugPrint("Error parsing JSON string: $e");
        return null;
      }
    }
    return null;
  }

  @override
  Future<Either<AppException, dynamic>> signOut() async {
    try {
      // 1. Panggil API Logout terlebih dahulu (maksimal 5 detik agar tidak menggantung terlalu lama)
      try {
        final rawToken = await appPreference.read<String>(AppPreferenceKey.bearerToken);
        final tokenHeader = rawToken != null && rawToken.isNotEmpty ? 'Bearer ${rawToken.replaceAll('Bearer ', '').trim()}' : '';
        if (tokenHeader.isNotEmpty) {
          await authApi.signOut(token: tokenHeader).timeout(const Duration(seconds: 5));
        }
      } catch (e) {
        debugPrint("Gagal proses logout API: $e");
      }

      // 2. Lakukan log out Google SignIn setelah API selesai
      try {
        final GoogleSignIn googleSignIn = GoogleSignIn();
        final bool isSignedIn = await googleSignIn.isSignedIn().timeout(const Duration(seconds: 3), onTimeout: () => false);
        if (isSignedIn) {
          await googleSignIn.disconnect().timeout(const Duration(seconds: 3), onTimeout: () => null);
          await googleSignIn.signOut().timeout(const Duration(seconds: 3), onTimeout: () => null);
        }
      } catch (e) {
        debugPrint("Gagal proses logout Google: $e");
      }

      // 3. Hapus cache lokal
      await appPreference.singOut();

      return Right(AppResponse(
          code: 200,
          message: "Logout Berhasil (Local & API)",
          data: null
      ));

    } catch (e) {
      // Fallback manual jika deleteAll bermasalah
      await appPreference.write(AppPreferenceKey.bearerToken, '');
      await appPreference.write(AppPreferenceKey.email, '');
      await appPreference.write(AppPreferenceKey.currentAbsenceId, '');
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> getCompanyProfileByToken() async {
    try {
      String? tokenRaw = await appPreference.read<String>(AppPreferenceKey.bearerToken);
      if (tokenRaw == null || tokenRaw.isEmpty) return Left(AppException(message: "Token autentikasi tidak ditemukan"));

      String cleanToken = tokenRaw.replaceAll('Bearer ', '').trim();

      try {
        final Map<String, dynamic> tokenPayload = _decodeJwt(cleanToken);
        if (tokenPayload.containsKey('role')) {
          final String roleFromToken = tokenPayload['role'].toString();
          debugPrint("ProfileDatasource: FORCE SAVING ROLE FROM TOKEN -> $roleFromToken");

          await appPreference.write<String>(AppPreferenceKey.role, roleFromToken);
          await appPreference.write<String>(AppPreferenceKey.jabatan, roleFromToken);

          final bool isAdmin = roleFromToken.toLowerCase().contains('admin');
          await appPreference.write<String>(AppPreferenceKey.isAdmin, isAdmin.toString());
        }
      } catch (e) {
        debugPrint("ProfileDatasource: Failed to decode fallback token: $e");
      }

      if (tokenRaw != cleanToken) await appPreference.write<String>(AppPreferenceKey.bearerToken, cleanToken);

      try {
        final userRes = await profileApi.getUserProfileByToken();
        if (userRes.response.statusCode == 200) {
        }
      } catch (e) {
        debugPrint("Warning: API User Profile fail, using Firestore later.");
      }

      final res = await profileApi.getCompanyProfileByToken();
      if (res.response.statusCode == 200) {
        final Map<String, dynamic>? data = _parseResponseData(res.response.data);
        if (data != null) {
          if (data['idperusahaan'] != null) await appPreference.write<String>(AppPreferenceKey.idperusahaan, data['idperusahaan']);
          if (data['namaPerusahaan'] != null) await appPreference.write<String>(AppPreferenceKey.namaPerusahaan, data['namaPerusahaan']);
        }
        return Right(res.response.data);
      } else {
        return Left(AppException(message: ErrorResponseFormater.extractErrorsDynamic(res.response.data), code: res.response.statusCode));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Stream<Either<AppException, dynamic>> getProfileStream() async* {
    try {
      final String? email = await appPreference.read<String>(AppPreferenceKey.email);

      if (email == null || email.isEmpty) {
        yield Left(AppException(message: "Email tidak ditemukan untuk stream data."));
        return;
      }

      debugPrint("Streaming Profile for: $email at path users/$email");

      final stream = FirebaseFirestore.instance
          .collection('users')
          .doc(email)
          .snapshots();

      await for (final snapshot in stream) {
        if (snapshot.exists && snapshot.data() != null) {
          final firestoreData = snapshot.data()!;
          final mappedData = _mapFirestoreToProfile(firestoreData);

          await _updateLocalPreferences(mappedData);

          yield Right(mappedData);
        } else {
          yield Left(AppException(message: "Data profil tidak ditemukan di Firestore"));
        }
      }
    } catch (e) {
      yield Left(AppException(message: "Stream Error: ${e.toString()}"));
    }
  }

  @override
  Future<Either<AppException, dynamic>> getProfile() async {
    try {
      final String? email = await appPreference.read<String>(AppPreferenceKey.email);
      if (email == null || email.isEmpty) {
        return Left(AppException(message: "Email tidak ditemukan. Silahkan login ulang."));
      }

      debugPrint("Fetching Profile Once (Firestore) for: $email");

      final doc = await FirebaseFirestore.instance.collection('users').doc(email).get();

      if (doc.exists && doc.data() != null) {
        final firestoreData = doc.data()!;
        final mappedData = _mapFirestoreToProfile(firestoreData);

        await _updateLocalPreferences(mappedData);
        return Right(mappedData);
      } else {
        debugPrint("Firestore kosong, mencoba fallback ke API legacy...");
        final res = await profileApi.getUserProfileByToken();
        if (res.response.statusCode == 200) {
          final Map<String, dynamic>? data = _parseResponseData(res.response.data);
          if (data != null) {
            return Right(data);
          }
        }
        return Left(AppException(message: "Profil tidak ditemukan"));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> deleteAccount() async {
    try {
      final email = await appPreference.read<String>(AppPreferenceKey.email);
      if (email == null || email.isEmpty) {
        return Left(AppException(message: "Email tidak ditemukan, silahkan login ulang."));
      }

      final res = await profileApi.deleteAccount(email: email);

      if (res.response.statusCode == 200 || res.response.statusCode == 204) {
        
        // --- ADDED: Log Activity EMPLOYEE_SELF_DELETE via API ---
        try {
          final tokenRaw = await appPreference.read<String>(AppPreferenceKey.bearerToken);
          final String authHeader = tokenRaw != null && tokenRaw.isNotEmpty 
              ? 'Bearer ${tokenRaw.replaceAll('Bearer ', '').trim()}' 
              : '';
              
          if (authHeader.isNotEmpty) {
            await profileApi.postLogActivity(
              token: authHeader,
              body: {
                  "action": "EMPLOYEE_SELF_DELETE",
                  "description": "Akun $email telah dihapus permanen | Account $email has been permanently deleted",
                  "target": email,
              }
            );
          }
        } catch (e) {
          debugPrint("Warning: Gagal menambahkan log activity (delete account): $e");
        }
        // ------------------------------------------------

        await signOut();
        return Right(res.response.data ?? "Akun berhasil dihapus");
      } else {
        return Left(AppException(
          message: ErrorResponseFormater.extractErrorsDynamic(res.response.data),
          code: res.response.statusCode,
        ));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  // --- NEW: Implementasi Hapus Perusahaan ---
  @override
  Future<Either<AppException, dynamic>> deleteCompany(String email, String reason) async {
    try {
      final res = await profileApi.deleteCompany(body: {
        'email': email,
        'reason': reason
      });

      if (res.response.statusCode == 200 || res.response.statusCode == 201 || res.response.statusCode == 204) {
        // Otomatis melakukan Sign Out setelah perusahaan dihapus
        await signOut();
        return Right(res.response.data ?? "Perusahaan berhasil dihapus");
      } else {
        return Left(AppException(
          message: ErrorResponseFormater.extractErrorsDynamic(res.response.data),
          code: res.response.statusCode,
        ));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }
  // ------------------------------------------

  @override
  Future<Either<AppException, dynamic>> getCompany() async {
    try {
      final companyResult = await getCompanyProfileByToken();

      return await companyResult.fold(
              (error) async => Left(error),
              (data) async {
            Company company;
            if (data is List) {
              if (data.isEmpty) return Left(AppException(message: "Data perusahaan tidak ditemukan"));
              company = Company.fromJson(data.first);
            } else {
              company = Company.fromJson(data);
            }

            await appPreference.write<String>(AppPreferenceKey.isSubscribsion, company.status);

            try {
              final staffRes = await profileApi.getCompanyStaffList();
              if (staffRes.response.statusCode == 200) {
                final staffData = staffRes.response.data;
                if (staffData is Map<String, dynamic> && staffData.containsKey('total')) {
                  final int totalKaryawan = staffData['total'] as int;
                  company = company.copyWith(totalEmployee: totalKaryawan);
                }
              }
            } catch (e) {
              debugPrint("Silent Error: Gagal mengambil total karyawan di halaman profil: $e");
            }

            try {
              final sizeRes = await profileApi.getTotalFileSize(category: "ALL");
              if (sizeRes.response.statusCode == 200) {
                final sizeData = sizeRes.response.data;
                if (sizeData is Map<String, dynamic>) {
                  double totalBytes = 0.0;
                  if (sizeData['totalBytes'] != null) {
                    totalBytes = double.tryParse(sizeData['totalBytes'].toString()) ?? 0.0;
                  }
                  double totalMB = totalBytes / (1024 * 1024);
                  company = company.copyWith(totalStorage: totalMB);
                }
              }
            } catch (e) {
              debugPrint("Silent Error: Gagal mengambil total storage: $e");
            }

            return Right(company);
          }
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> getStaff() async {
    try {
      String? tokenRaw = await appPreference.read<String>(AppPreferenceKey.bearerToken);
      if (tokenRaw != null) {
        String cleanToken = tokenRaw.replaceAll('Bearer ', '').trim();
        if (tokenRaw != cleanToken) await appPreference.write<String>(AppPreferenceKey.bearerToken, cleanToken);
      }

      String myEmail = await appPreference.read<String>(AppPreferenceKey.email) ?? "";
      String? idPerusahaan = await appPreference.read<String>(AppPreferenceKey.idperusahaan);

      final staffListResponse = await profileApi.getCompanyStaffList();

      if (staffListResponse.response.statusCode != 200) {
        return Left(AppException(
          message: ErrorResponseFormater.extractErrorsDynamic(staffListResponse.response.data),
          code: staffListResponse.response.statusCode,
        ));
      }

      Map<String, String> nameToIdMap = {};
      if (idPerusahaan != null) {
        try {
          final attendanceResponse = await profileApi.getStaffListWithIds(
              idPerusahaan: idPerusahaan,
              tglStart: "0001-01-01",
              tglEnd: "2100-01-01"
          );

          if (attendanceResponse.response.statusCode == 200) {
            final data = attendanceResponse.response.data;
            if (data is List) {
              for (var item in data) {
                if (item is Map) {
                  String? name = item['NamaKaryawan'];
                  String? id = item['IDKaryawan'];
                  if (name != null && id != null) {
                    nameToIdMap[name.toLowerCase().trim()] = id;
                  }
                }
              }
            }
          }
        } catch (e) {
          debugPrint("Warning: Gagal mengambil referensi ID dari HomeA: $e");
        }
      }

      final data = staffListResponse.response.data;
      List rawList = [];
      if (data is Map<String, dynamic> && data['data'] is List) {
        rawList = data['data'];
      } else if (data is List) {
        rawList = data;
      }

      final List<dynamic> staffList = rawList.map((json) {
        int generateIntId(dynamic val) {
          if (val is int) return val;
          if (val is String) {
            if (RegExp(r'^\d+$').hasMatch(val)) return int.tryParse(val) ?? 0;
            return val.hashCode;
          }
          return 0;
        }

        String status = json['status']?.toString().toLowerCase() ?? '';
        String role = json['role']?.toString().toLowerCase() ?? '';
        String finalJabatan = 'Staff';

        if (status == 'rejected' || role == 'rejected') {
          finalJabatan = 'Rejected';
        } else if (status == 'pending' || role == 'candidate') {
          finalJabatan = 'Candidate';
        } else if (role == 'admin') {
          finalJabatan = 'Admin';
        } else {
          finalJabatan = 'Staff';
        }

        bool isMe = json['isMe'] == true || (json['email'] == myEmail);
        String name = json['username'] ?? json['namaKaryawan'] ?? '-';

        String matchedId = '';
        if (nameToIdMap.containsKey(name.toLowerCase().trim())) {
          matchedId = nameToIdMap[name.toLowerCase().trim()]!;
        }

        String finalIdKaryawan = json['uid']?.toString()
            ?? json['id']?.toString()
            ?? json['idKaryawan']?.toString()
            ?? json['userId']?.toString()
            ?? json['user_id']?.toString()
            ?? matchedId;

        final Map<String, dynamic> compatibleMap = {
          "namaKaryawan": name,
          "jabatan": finalJabatan,
          "alamatEmail": json['email'] ?? json['alamatEmail'] ?? '-',
          "idkaryawan": finalIdKaryawan,
          "id": generateIntId(json['uid'] ?? json['id']),
          "status": status,
          "foto": json['photoURL'],
          "isMe": isMe,
          "noTelp": json['noTelp']?.toString() ?? "",
          "noWA": json['noWA']?.toString() ?? "",
          "noHp": json['noTelp']?.toString() ?? "",
          "totalLike": 0,
          "likes": 0,
          "latitude": 0.0,
          "longitude": 0.0,
          "lat": 0.0,
          "lng": 0.0,
        };

        return Staff.fromJson(compatibleMap);
      }).toList();

      return Right(staffList);

    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> verifyEmployee(String email, bool approved) async {
    try {
      final res = await profileApi.verifyEmployee(body: {
        'targetEmail': email,
        'approved': approved
      });
      if (res.response.statusCode == 200 || res.response.statusCode == 201) {
        return Right(res.response.data);
      } else {
        return Left(AppException(message: ErrorResponseFormater.extractErrorsDynamic(res.response.data), code: res.response.statusCode));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> updateRole(String email, String action) async {
    try {
      final res = await profileApi.updateRole(body: {
        'targetEmail': email,
        'action': action
      });
      if (res.response.statusCode == 200 || res.response.statusCode == 201) {
        return Right(res.response.data);
      } else {
        return Left(AppException(message: ErrorResponseFormater.extractErrorsDynamic(res.response.data), code: res.response.statusCode));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> fireEmployee(String email, String reason) async {
    try {
      final res = await profileApi.fireEmployee(body: {
        'targetEmail': email,
        'reason': reason
      });
      if (res.response.statusCode == 200 || res.response.statusCode == 201) {
        return Right(res.response.data);
      } else {
        return Left(AppException(message: ErrorResponseFormater.extractErrorsDynamic(res.response.data), code: res.response.statusCode));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  // --- PERBAIKAN: MENGUBAH URL MENJADI DEEP LINK APLIKASI ---
  @override
  Future<Either<AppException, String>> getPublicInviteLink() async {
    try {
      final companyId = await appPreference.read<String>(AppPreferenceKey.idperusahaan);

      if (companyId != null && companyId.isNotEmpty) {
        // Generate Deep Link kustom ke web Vorce
        // (Sistem Android/iOS akan mendeteksi path /invite dan membuka aplikasi otomatis)
        final customLink = "https://www.vorce.id/invite?id=$companyId";
        return Right(customLink);
      } else {
        return Left(AppException(message: "ID Perusahaan tidak ditemukan"));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, String>> sendInviteByEmail(String email) async {
    try {
      final res = await profileApi.sendInviteByEmail(body: {
        'targetEmail': email
      });

      if (res.response.statusCode == 200 || res.response.statusCode == 201) {
        final data = res.response.data;
        String message = "Undangan berhasil dikirim";
        if (data is Map<String, dynamic> && data['message'] != null) {
          message = data['message'].toString();
        }
        return Right(message);
      } else {
        return Left(AppException(
          message: ErrorResponseFormater.extractErrorsDynamic(res.response.data),
          code: res.response.statusCode,
        ));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> updateCompanyProfile({
    required String namaPerusahaan,
    required String alamatLoc,
    required String noTelp,
    required String noWA,
  }) async {
    try {
      final res = await profileApi.updateCompanyProfile(body: {
        "namaPerusahaan": namaPerusahaan,
        "alamatLoc": alamatLoc,
        "noTelp": noTelp,
        "noWA": noWA,
      });

      if (res.response.statusCode == 200) {
        return Right(res.response.data);
      } else {
        return Left(AppException(
          message: ErrorResponseFormater.extractErrorsDynamic(res.response.data),
          code: res.response.statusCode,
        ));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> updateCompanyLogo({
    required File file,
    String? desc,
  }) async {
    try {
      final res = await profileApi.updateCompanyLogo(
        file: file,
        desc: desc,
      );

      if (res.response.statusCode == 200) {
        return Right(res.response.data);
      } else {
        return Left(AppException(
          message: ErrorResponseFormater.extractErrorsDynamic(res.response.data),
          code: res.response.statusCode,
        ));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> updateUserPhoto({
    required File file,
    String? desc,
  }) async {
    try {
      final res = await profileApi.updateUserPhoto(
        file: file,
        desc: desc,
      );

      if (res.response.statusCode == 200) {
        return Right(res.response.data);
      } else {
        return Left(AppException(
          message: ErrorResponseFormater.extractErrorsDynamic(res.response.data),
          code: res.response.statusCode,
        ));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> updateUserProfile({
    required String username,
    required String noTelp,
    required String noWA,
    required String alamatLoc,
  }) async {
    try {
      final res = await profileApi.updateUserProfile(body: {
        "username": username,
        "noTelp": noTelp,
        "noWA": noWA,
        "alamatLoc": alamatLoc,
      });

      if (res.response.statusCode == 200) {
        return Right(res.response.data);
      } else {
        return Left(AppException(
          message: ErrorResponseFormater.extractErrorsDynamic(res.response.data),
          code: res.response.statusCode,
        ));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> saveFCMToken({
    required String idKaryawan,
    required FcmToken fcmToken,
    String contentType = "application/json",
  }) async {
    try {
      final idkaryawan = await appPreference.read<String>(AppPreferenceKey.idkaryawan).then((value) => value);
      final token = await appPreference.read<String>(AppPreferenceKey.fcmToken).then((value) => value);
      if (idkaryawan == null || token == null) {
        return Left(AppException(message: 'ID Karyawan or FCM Token is null'));
      }
      final fcmToken = FcmToken(token: token);
      final response = await profileApi.saveFCMToken(
        idKaryawan: idkaryawan,
        fcmToken: fcmToken,
      );
      if (response.response.statusCode == 200) {
        return Right(response.response.data);
      } else {
        return Left(AppException(
          message: ErrorResponseFormater.extractErrorsDynamic(response.response.data),
          code: response.response.statusCode,
        ));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> updateProfile({
    required String namaKaryawan,
    required String? alamat,
    required String? gender,
    required String alamatEmail,
    required File? foto,
  }) async {
    try {
      final idkaryawan = await appPreference.read<String>(AppPreferenceKey.idkaryawan).then((value) => value);
      final idperusahaan = await appPreference.read<String>(AppPreferenceKey.idperusahaan).then((value) => value);
      final email = await appPreference.read<String>(AppPreferenceKey.email).then((value) => value);
      final namaPerusahaan = await appPreference.read<String>(AppPreferenceKey.namaPerusahaan).then((value) => value);
      return profileApi
          .updateProfile(
          email: email!,
          idKaryawan: idkaryawan!,
          namaKaryawan: namaKaryawan,
          idPerusahaan: idperusahaan!,
          namaPerusahaan: namaPerusahaan!,
          alamat: alamat,
          alamatEmail: alamatEmail,
          foto: foto)
          .then((response) {
        if (response.response.statusCode == 200) {
          return Right(response.response.data);
        } else {
          return Left(AppException(
            message: ErrorResponseFormater.extractErrorsDynamic(response.response.data),
            code: response.response.statusCode,
          ));
        }
      });
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> inviteStaff(String email) async {
    try {
      Invitation invitation = Invitation(
        receiver: email,
        sender: await appPreference.read<String>(AppPreferenceKey.email) ?? '',
        idPerusahaan: await appPreference.read<String>(AppPreferenceKey.idperusahaan) ?? '',
        namaPerusahaan: await appPreference.read<String>(AppPreferenceKey.namaPerusahaan) ?? '',
      );
      return profileApi.companyInviteStaff(request: invitation).then((response) {
        if (response.response.statusCode == 200) {
          return Right(response.response.data);
        } else {
          return Left(AppException(
            message: ErrorResponseFormater.extractErrorsDynamic(response.response.data),
            code: response.response.statusCode,
          ));
        }
      });
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> deleteStaff(String email) async {
    try {
      return await profileApi.stopWorking(email: email).then((response) {
        if (response.response.statusCode == 200) {
          return Right(response.response.data);
        } else {
          return Left(AppException(
            message: ErrorResponseFormater.extractErrorsDynamic(response.response.data),
            code: response.response.statusCode,
          ));
        }
      });
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> getArchiveStatLaporan(String tglstart, String tglend) async {
    try {
      final String idperusahaan = await appPreference.read<String>(AppPreferenceKey.idperusahaan).then((value) => value!);
      final String email = await appPreference.read<String>(AppPreferenceKey.email).then((value) => value!);

      final res = await profileApi.getArchiveStatLaporan(
        idPerusahan: idperusahaan,
        emailrep: email,
        tglstart: tglstart,
        tglend: tglend,
      );
      if (res.response.statusCode == 200) {
        return Right(res.data);
      } else {
        return Left(AppException(
          message: ErrorResponseFormater.extractErrorsDynamic(res.response.data),
          code: res.response.statusCode,
        ));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> getArchiveStatKehadiran(String tglstart, String tglend) async {
    try {
      final String idperusahaan = await appPreference.read<String>(AppPreferenceKey.idperusahaan).then((value) => value!);
      final String email = await appPreference.read<String>(AppPreferenceKey.email).then((value) => value!);

      final res = await profileApi.getArchiveStatKehadiran(
        idPerusahan: idperusahaan,
        emailrep: email,
        tglstart: tglstart,
        tglend: tglend,
      );
      if (res.response.statusCode == 200) {
        return Right(res.data);
      } else {
        return Left(AppException(
          message: ErrorResponseFormater.extractErrorsDynamic(res.response.data),
          code: res.response.statusCode,
        ));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> getArchiveStatReimburse(String tglstart, String tglend) async {
    try {
      final String idperusahaan = await appPreference.read<String>(AppPreferenceKey.idperusahaan).then((value) => value!);
      final String email = await appPreference.read<String>(AppPreferenceKey.email).then((value) => value!);

      final res = await profileApi.getArchiveStatReimburse(
        idPerusahan: idperusahaan,
        emailrep: email,
        tglstart: tglstart,
        tglend: tglend,
      );
      if (res.response.statusCode == 200) {
        return Right(res.data);
      } else {
        return Left(AppException(
          message: ErrorResponseFormater.extractErrorsDynamic(res.response.data),
          code: res.response.statusCode,
        ));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> getArchiveStatTugas(String tglstart, String tglend) async {
    try {
      final String idperusahaan = await appPreference.read<String>(AppPreferenceKey.idperusahaan).then((value) => value!);
      final String email = await appPreference.read<String>(AppPreferenceKey.email).then((value) => value!);

      final res = await profileApi.getArchiveStatTugas(
        idPerusahan: idperusahaan,
        emailrep: email,
        tglstart: tglstart,
        tglend: tglend,
      );
      if (res.response.statusCode == 200) {
        return Right(res.data);
      } else {
        return Left(AppException(
          message: ErrorResponseFormater.extractErrorsDynamic(res.response.data),
          code: res.response.statusCode,
        ));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> editCompany({
    required String namaPerusahaan,
    required String keterangan,
    required String alamatLatitude,
    required String alamatLoc,
    required String alamatLongtitude,
    required int noWA,
    required int noTelp,
    File? foto,
  }) async {
    try {
      final String idperusahaan = await appPreference.read<String>(AppPreferenceKey.idperusahaan).then((value) => value!);

      final res = await profileApi.editCompany(
        idPerusahaan: idperusahaan,
        namaPerusahaan: namaPerusahaan,
        keterangan: keterangan,
        alamatLatitude: alamatLatitude,
        alamatLoc: alamatLoc,
        alamatLongtitude: alamatLongtitude,
        foto: foto,
        noTelp: noTelp,
        noWA: noWA,
      );

      if (res.response.statusCode == 200) {
        return Right(res.response.data);
      } else {
        return Left(AppException(
          message: ErrorResponseFormater.extractErrorsDynamic(res.response.data),
          code: res.response.statusCode,
        ));
      }
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }
}