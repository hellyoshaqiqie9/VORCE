import 'dart:io';

import 'package:dartz/dartz.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:apppro/api/core/exception/app_exception.dart';
import 'package:apppro/api/token/fcm_token.dart';
import 'package:apppro/core/service/pref/app_preference.dart';
import 'package:apppro/core/service/pref/app_preference_key.dart';
import 'package:apppro/feature/profile/domain/repositories/profile_datasource.dart';

abstract class ProfileRepository {
  Future<Either<AppException, dynamic>> getCompanyProfileByToken();
  Future<Either<AppException, dynamic>> getProfile();

  // ADDED: Stream untuk Realtime Profile
  Stream<Either<AppException, dynamic>> getProfileStream();

  // ADDED: Method untuk mengambil Cache Lokal
  Future<Either<AppException, dynamic>> getLocalProfileCache();

  Future<Either<AppException, dynamic>> getCompany();

  Future<Either<AppException, dynamic>> updateProfile({
    required String namaKaryawan,
    required String? alamat,
    required String? gender,
    required String alamatEmail,
    required File? foto,
  });

  Future<Either<AppException, dynamic>> deleteAccount();

  // --- NEW: Method hapus perusahaan ---
  Future<Either<AppException, dynamic>> deleteCompany(String email, String reason);

  // ADDED
  Future<Either<AppException, dynamic>> signOut();

  Future<Either<AppException, dynamic>> saveFCMToken();

  Future<Either<AppException, dynamic>> getStaff();
  Future<Either<AppException, dynamic>> inviteStaff(String email);
  Future<Either<AppException, dynamic>> deleteStaff(String email);

  Future<Either<AppException, dynamic>> verifyEmployee(String email, bool approved);
  Future<Either<AppException, dynamic>> updateRole(String email, String action);
  Future<Either<AppException, dynamic>> fireEmployee(String email, String reason);
  Future<Either<AppException, String>> getPublicInviteLink();
  Future<Either<AppException, String>> sendInviteByEmail(String email);

  Future<Either<AppException, dynamic>> updateCompanyProfile({
    required String namaPerusahaan,
    required String alamatLoc,
    required String noTelp,
    required String noWA,
  });

  Future<Either<AppException, dynamic>> updateCompanyLogo({
    required File file,
    String? desc,
  });

  Future<Either<AppException, dynamic>> updateUserPhoto({
    required File file,
    String? desc,
  });

  Future<Either<AppException, dynamic>> updateUserProfile({
    required String username,
    required String noTelp,
    required String noWA,
    required String alamatLoc,
  });

  Future<Either<AppException, dynamic>> getArchiveStatLaporan(String tglstart, String tglend);
  Future<Either<AppException, dynamic>> getArchiveStatKehadiran(String tglstart, String tglend);
  Future<Either<AppException, dynamic>> getArchiveStatReimburse(String tglstart, String tglend);
  // --- NEW: Abstract Method for Tugas ---
  Future<Either<AppException, dynamic>> getArchiveStatTugas(String tglstart, String tglend);
  // ----------------------------------------

  Future<Either<AppException, dynamic>> editCompany({
    required String namaPerusahaan,
    required String keterangan,
    required String alamatLatitude,
    required String alamatLoc,
    required String alamatLongtitude,
    required int noWA,
    required int noTelp,
    File? foto,
  });
}

class ProfileRepositoryImpl implements ProfileRepository {
  final ProfileDatasource profileDatasource;
  final AppPreference appPreference;

  ProfileRepositoryImpl({
    required this.profileDatasource,
    required this.appPreference,
  });

  // ADDED
  @override
  Future<Either<AppException, dynamic>> signOut() async {
    try {
      return await profileDatasource.signOut();
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> getCompanyProfileByToken() async {
    try {
      return await profileDatasource.getCompanyProfileByToken();
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> deleteAccount() async {
    final res = await appPreference.read<String>(AppPreferenceKey.bearerToken).then((token) async {
      return await profileDatasource.deleteAccount();
    }).catchError((e) {
      return Left(AppException(message: e.toString()));
    });
    return res;
  }

  // --- NEW: Implementasi method hapus perusahaan ---
  @override
  Future<Either<AppException, dynamic>> deleteCompany(String email, String reason) async {
    try {
      return await profileDatasource.deleteCompany(email, reason);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> getStaff() async {
    try {
      return await profileDatasource.getStaff();
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> getProfile() async {
    try {
      return await profileDatasource.getProfile();
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  // --- ADDED: Realtime Stream Implementation ---
  @override
  Stream<Either<AppException, dynamic>> getProfileStream() {
    return profileDatasource.getProfileStream();
  }

  // --- ADDED: Local Cache Implementation ---
  @override
  Future<Either<AppException, dynamic>> getLocalProfileCache() {
    return profileDatasource.getLocalProfileCache();
  }
  // ----------------------------------------------

  @override
  Future<Either<AppException, dynamic>> saveFCMToken() async {
    try {
      final idkaryawan = await appPreference.read<String>(AppPreferenceKey.idkaryawan);
      final token = await appPreference.read<String>(AppPreferenceKey.fcmToken);

      if (idkaryawan == null || token == null) {
        return Left(AppException(message: 'ID Karyawan or FCM Token is missing in preferences'));
      }

      final fcmTokenObj = FcmToken(token: token);

      return await profileDatasource.saveFCMToken(
        idKaryawan: idkaryawan,
        fcmToken: fcmTokenObj,
      );
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
      return await profileDatasource.updateProfile(namaKaryawan: namaKaryawan, alamat: alamat, gender: gender, alamatEmail: alamatEmail, foto: foto);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> getCompany() async {
    try {
      return await profileDatasource.getCompany();
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> inviteStaff(String email) async {
    try {
      return await profileDatasource.inviteStaff(email);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> deleteStaff(String email) async {
    try {
      return await profileDatasource.deleteStaff(email);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> verifyEmployee(String email, bool approved) async {
    try {
      return await profileDatasource.verifyEmployee(email, approved);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> updateRole(String email, String action) async {
    try {
      return await profileDatasource.updateRole(email, action);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> fireEmployee(String email, String reason) async {
    try {
      return await profileDatasource.fireEmployee(email, reason);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, String>> getPublicInviteLink() async {
    try {
      return await profileDatasource.getPublicInviteLink();
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, String>> sendInviteByEmail(String email) async {
    try {
      return await profileDatasource.sendInviteByEmail(email);
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
      return await profileDatasource.updateCompanyProfile(
        namaPerusahaan: namaPerusahaan,
        alamatLoc: alamatLoc,
        noTelp: noTelp,
        noWA: noWA,
      );
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
      return await profileDatasource.updateCompanyLogo(file: file, desc: desc);
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
      return await profileDatasource.updateUserPhoto(file: file, desc: desc);
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
      return await profileDatasource.updateUserProfile(
        username: username,
        noTelp: noTelp,
        noWA: noWA,
        alamatLoc: alamatLoc,
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> getArchiveStatLaporan(String tglstart, String tglend) async {
    try {
      return await profileDatasource.getArchiveStatLaporan(tglstart, tglend);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> getArchiveStatKehadiran(String tglstart, String tglend) async {
    try {
      return await profileDatasource.getArchiveStatKehadiran(tglstart, tglend);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> getArchiveStatReimburse(String tglstart, String tglend) async {
    try {
      return await profileDatasource.getArchiveStatReimburse(tglstart, tglend);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  // --- NEW: Implementation for Tugas ---
  @override
  Future<Either<AppException, dynamic>> getArchiveStatTugas(String tglstart, String tglend) async {
    try {
      return await profileDatasource.getArchiveStatTugas(tglstart, tglend);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }
  // ----------------------------------------

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
      debugPrint('name Perusahaan : repo');
      return await profileDatasource.editCompany(
        namaPerusahaan: namaPerusahaan,
        keterangan: keterangan,
        alamatLatitude: alamatLatitude,
        alamatLoc: alamatLoc,
        alamatLongtitude: alamatLongtitude,
        foto: foto,
        noWA: noWA,
        noTelp: noTelp,
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }
}