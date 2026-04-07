import 'dart:convert';
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart'; // ADDED: Import untuk Firestore Timestamp dan instance
import 'package:dartz/dartz.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:apppro/api/core/exception/app_exception.dart';
import 'package:apppro/core/service/notification/local_notification_service.dart';
import 'package:apppro/core/service/pref/app_preference.dart';
import 'package:apppro/core/service/pref/app_preference_key.dart';
import 'package:apppro/feature/dashboard/data/dashboard_api.dart';
import 'package:apppro/core/utils/helper/formatter/error_response_formater.dart';
import 'package:apppro/feature/dashboard/domain/entities/absence.dart';
import 'package:apppro/feature/dashboard/domain/entities/banner_image.dart';
import 'package:apppro/feature/dashboard/domain/entities/log_activity.dart';
import 'package:apppro/feature/dashboard/domain/entities/company_member.dart';
import 'package:apppro/feature/dashboard/domain/repositories/dashboard_repositorie.dart';

class DashboardDatasource implements DashboardRepositorie {
  final DashboardApi dashboardApi;
  final AppPreference appPreference;
  final LocalNotificationService localNotificationService;

  // --- ADDED: Cache untuk menyimpan mapping UID ke Email agar tidak spam call ke Firebase ---
  final Map<String, String> _uidEmailCache = {};

  DashboardDatasource({required this.dashboardApi, required this.appPreference, required this.localNotificationService});

  // --- ADDED: Fungsi pembantu untuk mengambil email dari Firestore berdasarkan UID ---
  Future<String?> _getEmailFromFirestore(String? uid) async {
    if (uid == null || uid.isEmpty) return null;

    // Jika email untuk UID ini sudah pernah diambil, gunakan data dari cache
    if (_uidEmailCache.containsKey(uid)) return _uidEmailCache[uid];

    try {
      final snap = await FirebaseFirestore.instance
          .collection('users')
          .where('uid', isEqualTo: uid)
          .limit(1)
          .get();

      if (snap.docs.isNotEmpty) {
        final data = snap.docs.first.data();
        // Coba ambil dari alamatEmail, jika null coba field email, jika masih null gunakan Document ID (karena pathnya /users/email)
        final email = data['alamatEmail']?.toString() ?? data['email']?.toString() ?? snap.docs.first.id;

        // Simpan ke cache untuk penggunaan selanjutnya
        _uidEmailCache[uid] = email;
        return email;
      }
    } catch (e) {
      debugPrint("Error fetching email from Firestore for UID $uid: $e");
    }
    return null;
  }

  // --- HELPERS ---
  Future<String?> _getIdKaryawan() async {
    String? id = await appPreference.read<String>(AppPreferenceKey.idkaryawan);
    if (id != null && id.isNotEmpty) return id;
    final user = FirebaseAuth.instance.currentUser;
    return user?.uid;
  }

  Future<String?> _getNamaKaryawan() async {
    String? name = await appPreference.read<String>(AppPreferenceKey.name);
    if (name != null && name.isNotEmpty) return name;
    final user = FirebaseAuth.instance.currentUser;
    return user?.displayName ?? user?.email;
  }

  Future<String?> _getIdPerusahaan() async {
    String? id = await appPreference.read<String>(AppPreferenceKey.idperusahaan);
    if (id != null && id.isNotEmpty) return id;
    try {
      final token = await appPreference.read<String>(AppPreferenceKey.bearerToken);
      if (token != null && token.isNotEmpty) {
        final cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        final parts = cleanToken.split('.');
        if (parts.length == 3) {
          final payload = json.decode(utf8.decode(base64Url.decode(base64.normalize(parts[1]))));
          return payload['idCompany']?.toString();
        }
      }
    } catch (e) {
      debugPrint("Gagal decode token untuk ID Perusahaan: $e");
    }
    return null;
  }

  Future<String?> _getNamaPerusahaan() async {
    return await appPreference.read<String>(AppPreferenceKey.namaPerusahaan);
  }

  // --- FIX PARSING TANGGAL (_seconds) ---
  dynamic _convertFirestoreTimestamp(dynamic value) {
    if (value is Map && value.containsKey('_seconds')) {
      final int seconds = value['_seconds'] ?? 0;
      final int nanoseconds = value['_nanoseconds'] ?? 0;
      final date = DateTime.fromMillisecondsSinceEpoch(seconds * 1000 + (nanoseconds / 1000000).round());
      return date.toIso8601String();
    }
    return value;
  }

  // --- FIX NORMALISASI KEY ---
  Map<String, dynamic> _sanitizeJson(dynamic originalJson) {
    if (originalJson == null || originalJson is! Map) return {};

    final Map<String, dynamic> rawJson = Map<String, dynamic>.from(originalJson);
    final Map<String, dynamic> json = {};

    rawJson.forEach((key, value) {
      String newKey = key;
      String lowerKey = key.toLowerCase();

      // 1. Identitas
      if (lowerKey == 'id') newKey = 'id';
      else if (lowerKey == 'idkaryawan') newKey = 'idKaryawan';
      else if (lowerKey == 'namakaryawan') newKey = 'namaKaryawan';
      else if (lowerKey == 'idperusahaan') newKey = 'idPerusahaan';
      else if (lowerKey == 'namaperusahaan') newKey = 'namaperusahaan';

      // 2. Foto
      else if (key == 'Foto' || key == 'fotoCheckIn') newKey = 'fotoKaryawan';
      else if (key == 'FotoCheckOut' || key == 'fotoCheckOut') newKey = 'fotoPulang';
      else if (key == 'FotoIstirahatIn' || key == 'fotoIstirahatIn') newKey = 'fotoIsitrahatIn';

      // 3. Lokasi
      else if (lowerKey == 'alamatloc') newKey = 'alamatLoc';
      else if (lowerKey == 'alamatlatitude') newKey = 'alamatLatitude';
      else if (lowerKey == 'alamatlongtitude' || lowerKey == 'alamatlongitude') newKey = 'alamatLongtitude';

      // 4. Status, Waktu, dan SHIFT
      else if (lowerKey == 'status') newKey = 'status';
      // Pastikan 'Shift', 'SHIFT', dll menjadi 'shift' agar konsisten
      else if (lowerKey == 'shift') newKey = 'shift';

      // 5. Fallback: Ubah PascalCase jadi camelCase
      else if (key.isNotEmpty && key[0].toUpperCase() == key[0]) {
        newKey = key[0].toLowerCase() + key.substring(1);
      }

      json[newKey] = value;
    });

    // 6. Fix ID Type
    if (json.containsKey('id') && json['id'] is num) {
      json['id'] = json['id'].toString();
    }

    // 7. Konversi Timestamp Firestore
    const timeFields = ['waktuCheckIn', 'waktuCheckOut', 'istirahatIn', 'istirahatOut', 'tanggal', 'tanggalAbsensi'];
    for (var field in timeFields) {
      if (json.containsKey(field)) {
        json[field] = _convertFirestoreTimestamp(json[field]);
      }
    }

    return json;
  }

  // --- IMPLEMENTASI ---

  @override
  Future<Either<AppException, dynamic>> getCompanyList() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      final token = await user?.getIdToken(true);
      if (token == null) return Left(AppException(message: "Sesi autentikasi kadaluarsa."));

      return await dashboardApi.getCompanyList(token: "Bearer $token").then((response) async {
        if (response.response.statusCode == 200) {
          final data = response.data;
          if (data is Map<String, dynamic> && data.containsKey('data')) {
            final jsonList = data['data'] as List;
            final List<CompanyMember> memberList = jsonList.map((json) => CompanyMember.fromJson(json)).toList();
            return Right(memberList);
          } else {
            return const Right([]);
          }
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

  // --- ADDED: Get Reimburse List ---
  @override
  Future<Either<AppException, dynamic>> getReimburseList() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      final token = await user?.getIdToken(true);
      if (token == null) return Left(AppException(message: "Sesi autentikasi kadaluarsa."));

      return await dashboardApi.getReimburseList(token: "Bearer $token").then((response) async {
        if (response.response.statusCode == 200) {
          final data = response.data;
          // Mengembalikan raw List<dynamic> (Map)
          if (data is Map<String, dynamic> && data.containsKey('data')) {
            return Right(data['data']);
          } else if (data is List) {
            return Right(data);
          }
          return const Right([]);
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
  Future<Either<AppException, dynamic>> getAttendanceList({required String start, required String end}) async {
    try {
      final idperusahaan = await _getIdPerusahaan();
      if (idperusahaan == null) return Left(AppException(message: "ID Perusahaan tidak ditemukan."));

      return await dashboardApi
          .getAttendanceList(
        idperusahaan: idperusahaan,
        start: start,
        end: end,
      )
          .then((response) async {
        if (response.response.statusCode == 200) {
          final List<dynamic> jsonList = (response.data as List).toList();
          final List<dynamic> absenceList = [];

          for (var item in jsonList) {
            try {
              final sanitizedItem = _sanitizeJson(item);

              // --- ADDED: Injeksi Email dari Firestore ke dalam data Absensi ---
              final uid = sanitizedItem['idKaryawan']?.toString();
              final email = await _getEmailFromFirestore(uid);
              if (email != null) {
                sanitizedItem['email'] = email;
                sanitizedItem['alamatEmail'] = email; // Disimpan dengan 2 key untuk berjaga-jaga
              }
              // ------------------------------------------------------------------

              absenceList.add(Absence.fromJson(sanitizedItem));
            } catch (e) {
              debugPrint("ERROR PARSING ITEM di getAttendanceList: $e");
            }
          }

          return Right(absenceList);
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
  Future<Either<AppException, dynamic>> checkIn({required String timezone, required File photo}) async {
    try {
      final staffId = await _getIdKaryawan();
      final staffName = await _getNamaKaryawan();
      final companyId = await _getIdPerusahaan();
      final companyName = await _getNamaPerusahaan();
      final latitude = await appPreference.read<String>(AppPreferenceKey.posLat);
      final longitude = await appPreference.read<String>(AppPreferenceKey.posLng);
      final address = await appPreference.read<String>(AppPreferenceKey.posName);

      if (staffId == null) return Left(AppException(message: "Gagal identifikasi karyawan."));
      if (companyId == null) return Left(AppException(message: "ID Perusahaan tidak ditemukan."));

      final user = FirebaseAuth.instance.currentUser;
      final token = await user?.getIdToken();
      if (token == null) return Left(AppException(message: "Gagal mendapatkan token autentikasi."));

      // STEP 1: UPLOAD FOTO
      debugPrint("--- START UPLOAD PHOTO CHECKIN ---");
      // PERUBAHAN: Menambahkan parameter category: "checkin"
      final uploadResponse = await dashboardApi.uploadFile(
        token: "Bearer $token",
        file: photo,
        category: "checkin",
      );

      if (uploadResponse.response.statusCode != 200 && uploadResponse.response.statusCode != 201) {
        return Left(AppException(
            message: "Gagal upload foto: ${ErrorResponseFormater.extractErrorsDynamic(uploadResponse.response.data)}",
            code: uploadResponse.response.statusCode
        ));
      }

      final uploadData = uploadResponse.data;
      String? idBerkasFoto;

      if (uploadData is Map && uploadData.containsKey('data')) {
        final innerData = uploadData['data'];
        if (innerData is Map) {
          idBerkasFoto = innerData['id']?.toString();
        }
      }

      if (idBerkasFoto == null || idBerkasFoto.isEmpty) {
        return Left(AppException(message: "Gagal mendapatkan ID foto dari server."));
      }
      debugPrint("--- UPLOAD SUCCESS. File ID: $idBerkasFoto ---");

      // STEP 2: KIRIM DATA CHECK-IN (JSON)
      final Map<String, dynamic> checkInBody = {
        "IDKaryawan": staffId,
        "NamaKaryawan": staffName ?? 'Karyawan',
        "AlamatLongtitude": longitude ?? '0.0',
        "AlamatLatitude": latitude ?? '0.0',
        "AlamatLoc": address ?? '',
        "IDPerusahaan": companyId,
        "NamaPerusahaan": companyName ?? 'Kantor',
        "idBerkasFoto": idBerkasFoto,
        "zone": timezone
      };

      return await dashboardApi.checkIn(body: checkInBody).then((response) async {
        if (response.response.statusCode == 200 || response.response.statusCode == 201) {
          final data = _sanitizeJson(response.data);
          if (data['id'] != null) {
            await appPreference.write<String>(AppPreferenceKey.currentAbsenceId, data['id'].toString());
          }
          final checkInId = DateTime.now().millisecondsSinceEpoch.toString();
          await appPreference.write<String>("${AppPreferenceKey.posName}_${DateUtils.dateOnly(DateTime.now()).toIso8601String()}", checkInId);
          localNotificationService
            ..showNotificationAbsen(DateTime.now(), staffId)
            ..showNotificationAfter12Hours(DateTime.now());

          try {
            return Right(Absence.fromJson(data));
          } catch(e) {
            return Right(data);
          }
        } else {
          return Left(AppException(message: ErrorResponseFormater.extractErrorsDynamic(response.response.data), code: response.response.statusCode));
        }
      });
    } catch (e) {
      debugPrint("CheckIn Error: $e");
      return Left(AppException(message: e.toString()));
    }
  }

  // --- UPDATED: CHECKOUT DENGAN VALIDASI ALAMAT ---
  @override
  Future<Either<AppException, dynamic>> checkOut({
    required String id,
    required String date,
    required String timezone,
    required File photo,
    String? address, // Added Parameter address dari UI
  }) async {
    try {
      final staffId = await _getIdKaryawan();
      final companyId = await _getIdPerusahaan();
      final latitude = await appPreference.read<String>(AppPreferenceKey.posLat);
      final longitude = await appPreference.read<String>(AppPreferenceKey.posLng);

      // 1. Prioritaskan alamat dari Parameter (dari UI Capture), kalau null ambil dari Prefs
      String? finalAddress = address ?? await appPreference.read<String>(AppPreferenceKey.posName);

      // 2. Jika masih kosong juga, isi dengan Default "-" atau "Lokasi tidak terdeteksi"
      // API mewajibkan string tidak kosong
      if (finalAddress == null || finalAddress.trim().isEmpty) {
        finalAddress = "-";
      }

      if (id.isEmpty) return Left(AppException(message: "ID Absensi tidak ditemukan."));
      if (companyId == null) return Left(AppException(message: "ID Perusahaan tidak ditemukan."));

      final user = FirebaseAuth.instance.currentUser;
      final token = await user?.getIdToken();
      if (token == null) return Left(AppException(message: "Gagal mendapatkan token autentikasi."));

      // STEP 1: UPLOAD FOTO (Category: checkout)
      debugPrint("--- START UPLOAD PHOTO CHECKOUT ---");
      final uploadResponse = await dashboardApi.uploadFile(
        token: "Bearer $token",
        file: photo,
        category: "checkout",
      );

      if (uploadResponse.response.statusCode != 200 && uploadResponse.response.statusCode != 201) {
        return Left(AppException(
            message: "Gagal upload foto: ${ErrorResponseFormater.extractErrorsDynamic(uploadResponse.response.data)}",
            code: uploadResponse.response.statusCode
        ));
      }

      final uploadData = uploadResponse.data;
      String? idBerkasFoto;

      if (uploadData is Map && uploadData.containsKey('data')) {
        final innerData = uploadData['data'];
        if (innerData is Map) {
          idBerkasFoto = innerData['id']?.toString();
        }
      }

      if (idBerkasFoto == null || idBerkasFoto.isEmpty) {
        return Left(AppException(message: "Gagal mendapatkan ID foto dari server."));
      }
      debugPrint("--- UPLOAD SUCCESS. File ID: $idBerkasFoto ---");

      // STEP 2: KIRIM DATA CHECK-OUT (JSON Body)
      // Struktur body disesuaikan dengan permintaan user
      final Map<String, dynamic> checkOutBody = {
        "LatitudePulang": latitude ?? '0.0',
        "LongtitudePulang": longitude ?? '0.0',
        "AlamatPulang": finalAddress, // FIX: Menggunakan finalAddress yang dijamin tidak kosong
        "idBerkasFoto": idBerkasFoto,
        "IDPerusahaan": companyId,
        // "NamaKaryawan": staffName, // Jika diperlukan bisa ditambahkan
      };

      return await dashboardApi.checkOut(id: id, date: date, body: checkOutBody).then((response) {
        if (response.response.statusCode == 200) {
          if (staffId != null) localNotificationService.showNotificationAbsentDone(staffId);
          appPreference.write(AppPreferenceKey.currentAbsenceId, '');
          return Right(Absence.fromJson(_sanitizeJson(response.data)));
        } else {
          return Left(AppException(message: ErrorResponseFormater.extractErrorsDynamic(response.response.data), code: response.response.statusCode));
        }
      });
    } catch (e) { return Left(AppException(message: e.toString())); }
  }

  // --- UPDATED: Menggunakan userId opsional (Untuk Staff View) ---
  @override
  Future<Either<AppException, dynamic>> getAttendanceHistory({
    required String start,
    required String end,
    String? userId, // ADDED: Param userId
  }) async {
    try {
      // 1. Tentukan ID Karyawan (Dari param atau preferences)
      final staffId = userId ?? await _getIdKaryawan();
      // 2. Ambil ID Perusahaan
      final companyId = await _getIdPerusahaan();

      if (staffId == null) return Left(AppException(message: "Data Karyawan (UID) tidak ditemukan."));
      if (companyId == null) return Left(AppException(message: "ID Perusahaan tidak ditemukan."));

      return await dashboardApi.getAttendance(
          idperusahaan: companyId,
          idkaryawan: staffId,
          start: start,
          end: end
      ).then((response) async {
        if (response.response.statusCode == 200) {
          final List<dynamic> jsonList = (response.data as List).toList();
          final List<Absence> absenceList = [];

          for (var item in jsonList) {
            try {
              final sanitizedItem = _sanitizeJson(item);

              // --- ADDED: Injeksi Email dari Firestore ke dalam data Absensi ---
              final uid = sanitizedItem['idKaryawan']?.toString();
              final email = await _getEmailFromFirestore(uid);
              if (email != null) {
                sanitizedItem['email'] = email;
                sanitizedItem['alamatEmail'] = email;
              }
              // ------------------------------------------------------------------

              absenceList.add(Absence.fromJson(sanitizedItem));
            } catch (e) {
              debugPrint("ERROR PARSING ITEM (getAttendanceHistory): $e");
            }
          }

          absenceList.sort((a, b) {
            final aTime = a.waktuCheckIn ?? DateTime.fromMillisecondsSinceEpoch(0);
            final bTime = b.waktuCheckIn ?? DateTime.fromMillisecondsSinceEpoch(0);
            return bTime.compareTo(aTime);
          });

          return Right(absenceList);
        } else {
          return Left(AppException(message: ErrorResponseFormater.extractErrorsDynamic(response.response.data), code: response.response.statusCode));
        }
      });
    } catch (e) { return Left(AppException(message: e.toString())); }
  }

  // --- GET CURRENT ATTENDANCE (Selalu current user) ---
  @override
  Future<Either<AppException, dynamic>> getAttendance({required String start, required String end}) async {
    try {
      final staffId = await _getIdKaryawan();
      final companyId = await _getIdPerusahaan();

      if (staffId == null) return Left(AppException(message: "Data Karyawan (UID) tidak ditemukan."));
      if (companyId == null) return Left(AppException(message: "ID Perusahaan tidak ditemukan."));

      return await dashboardApi.getAttendance(
          idperusahaan: companyId,
          idkaryawan: staffId,
          start: start,
          end: end
      ).then((response) async {
        if (response.response.statusCode == 200) {
          final List<dynamic> jsonList = (response.data as List).toList();
          final List<Absence> absenceList = [];

          for (var item in jsonList) {
            try {
              final sanitizedItem = _sanitizeJson(item);

              // --- ADDED: Injeksi Email dari Firestore ke dalam data Absensi ---
              final uid = sanitizedItem['idKaryawan']?.toString();
              final email = await _getEmailFromFirestore(uid);
              if (email != null) {
                sanitizedItem['email'] = email;
                sanitizedItem['alamatEmail'] = email;
              }
              // ------------------------------------------------------------------

              absenceList.add(Absence.fromJson(sanitizedItem));
            } catch (e) {
              debugPrint("ERROR PARSING ITEM (getAttendance): $e");
            }
          }

          if (absenceList.isNotEmpty) {
            absenceList.sort((a, b) {
              final aTime = a.waktuCheckIn ?? DateTime.fromMillisecondsSinceEpoch(0);
              final bTime = b.waktuCheckIn ?? DateTime.fromMillisecondsSinceEpoch(0);
              return bTime.compareTo(aTime);
            });

            final activeAbsence = absenceList.firstWhere(
                  (element) => element.waktuCheckOut == null,
              orElse: () => absenceList.first,
            );

            if (activeAbsence.id != null) {
              if (activeAbsence.waktuCheckOut == null) {
                await appPreference.write<String>(AppPreferenceKey.currentAbsenceId, activeAbsence.id.toString());
              } else {
                await appPreference.write(AppPreferenceKey.currentAbsenceId, '');
              }
            }

            return Right(activeAbsence);
          } else {
            return const Right(null);
          }
        } else {
          return Left(AppException(message: ErrorResponseFormater.extractErrorsDynamic(response.response.data), code: response.response.statusCode));
        }
      });
    } catch (e) { return Left(AppException(message: e.toString())); }
  }

  @override
  Future<Either<AppException, dynamic>> restIn({required String id, required String timezone, required File photo}) async {
    return await dashboardApi.restIn(id: id, staffName: (await _getNamaKaryawan())!, address: (await appPreference.read(AppPreferenceKey.posName))??'', latitude: '0.0', longitude: '0.0', photo: photo)
        .then((res) => Right(Absence.fromJson(_sanitizeJson(res.data))));
  }

  @override
  Future<Either<AppException, dynamic>> restOut({required String id, required String timezone, required File photo}) async {
    return await dashboardApi.restOut(id: id, staffName: (await _getNamaKaryawan())!, address: (await appPreference.read(AppPreferenceKey.posName))??'', latitude: '0.0', longitude: '0.0', photo: photo)
        .then((res) => Right(Absence.fromJson(_sanitizeJson(res.data))));
  }

  // API LAMA TETAP DIPERTAHANKAN
  @override
  Future<Either<AppException, dynamic>> activityFeed() async {
    final user = FirebaseAuth.instance.currentUser;
    final token = await user?.getIdToken(true);
    return await dashboardApi.getActivityFeed(token: "Bearer $token").then((res) => Right((res.data['data'] as List).map((e) => LogActivity.fromJson(e)).toList()));
  }

  // NEW METHOD: Stream Firestore Realtime
  @override
  Future<Either<AppException, Stream<List<dynamic>>>> streamActivityFeed() async {
    try {
      final companyId = await _getIdPerusahaan();
      if (companyId == null) {
        return Left(AppException(message: "ID Perusahaan tidak ditemukan."));
      }

      final stream = FirebaseFirestore.instance
          .collection('companies')
          .doc(companyId)
          .collection('logs')
          .orderBy('createdAt', descending: true)
          .limit(50) // Batasi jumlah log yang di-fetch demi efisiensi
          .snapshots()
          .map((snapshot) {
        return snapshot.docs.map((doc) {
          final data = doc.data();
          data['id'] = doc.id;

          // Konversi tipe Timestamp firestore ke ISO8601 String
          // Agar sesuai dengan konversi entitas LogActivity JSON seperti bawaan API lama
          if (data['createdAt'] != null && data['createdAt'] is Timestamp) {
            data['createdAt'] = (data['createdAt'] as Timestamp).toDate().toIso8601String();
          }

          return LogActivity.fromJson(data);
        }).toList();
      });

      return Right(stream);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> bannerHome() async {
    return await dashboardApi.getBannerHome().then((res) => Right((res.data as List).map((e) => BannerImage.fromJson(e)).toList()));
  }

  @override
  Future<Either<AppException, dynamic>> approveAbsence({required String id, required String namaKaryawan, required String idKaryawan, required String status}) async {
    return await dashboardApi.approveAbsence(id: id, namaKaryawan: namaKaryawan, idKaryawan: idKaryawan, status: status).then((res) => Right(res.data));
  }
}