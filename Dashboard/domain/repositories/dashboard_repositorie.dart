import 'dart:io';

import 'package:dartz/dartz.dart';
import 'package:apppro/api/core/exception/app_exception.dart';
import 'package:apppro/feature/dashboard/domain/repositories/dashboard_datasource.dart';

abstract class DashboardRepositorie {
  Future<Either<AppException, dynamic>> getAttendance({
    required String start,
    required String end,
  });

  // --- ADDED: Method khusus untuk riwayat profil (List) ---
  // Menambahkan parameter userId opsional
  Future<Either<AppException, dynamic>> getAttendanceHistory({
    required String start,
    required String end,
    String? userId, // ADDED
  });

  Future<Either<AppException, dynamic>> getAttendanceList({
    required String start,
    required String end,
  });

  Future<Either<AppException, dynamic>> checkIn({
    required String timezone,
    required File photo,
  });

  Future<Either<AppException, dynamic>> checkOut({
    required String id,
    required String date,
    required String timezone,
    required File photo,
    String? address, // ADDED: Parameter Address agar bisa diteruskan dari UI
  });

  Future<Either<AppException, dynamic>> restIn({
    required String id,
    required String timezone,
    required File photo,
  });

  Future<Either<AppException, dynamic>> restOut({
    required String id,
    required String timezone,
    required File photo,
  });

  // Fungsi API Lama tetap dipertahankan
  Future<Either<AppException, dynamic>> activityFeed();

  // NEW: Fungsi Stream Realtime Firestore untuk Log
  Future<Either<AppException, Stream<List<dynamic>>>> streamActivityFeed();

  // NEW METHOD
  Future<Either<AppException, dynamic>> getCompanyList();

  // --- ADDED: Reimburse ---
  Future<Either<AppException, dynamic>> getReimburseList();

  Future<Either<AppException, dynamic>> bannerHome();

  Future<Either<AppException, dynamic>> approveAbsence({
    required String id,
    required String namaKaryawan,
    required String idKaryawan,
    required String status,
  });
}

class DashboardRepositorieImp implements DashboardRepositorie {
  final DashboardDatasource dashboardDatasource;

  DashboardRepositorieImp({required this.dashboardDatasource});

  @override
  Future<Either<AppException, dynamic>> checkIn({required String timezone, required File photo}) async {
    try {
      return await dashboardDatasource.checkIn(timezone: timezone, photo: photo);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> checkOut({
    required String id,
    required String date,
    required String timezone,
    required File photo,
    String? address, // ADDED
  }) async {
    try {
      return await dashboardDatasource.checkOut(
          id: id,
          date: date,
          timezone: timezone,
          photo: photo,
          address: address // Pass to datasource
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> getAttendance({required String start, required String end}) async {
    try {
      return await dashboardDatasource.getAttendance(start: start, end: end);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  // --- ADDED: Implementation ---
  @override
  Future<Either<AppException, dynamic>> getAttendanceHistory({
    required String start,
    required String end,
    String? userId, // ADDED
  }) async {
    try {
      // Pass userId ke datasource
      return await dashboardDatasource.getAttendanceHistory(start: start, end: end, userId: userId);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> getAttendanceList({required String start, required String end}) async {
    try {
      return await dashboardDatasource.getAttendanceList(start: start, end: end);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> restIn({required String id, required String timezone, required File photo}) async {
    try {
      return await dashboardDatasource.restIn(id: id, timezone: timezone, photo: photo);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> restOut({required String id, required String timezone, required File photo}) async {
    try {
      return await dashboardDatasource.restOut(id: id, timezone: timezone, photo: photo);
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  // Implementation API LAMA
  @override
  Future<Either<AppException, dynamic>> activityFeed() async {
    try {
      return await dashboardDatasource.activityFeed();
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  // NEW Implementation: Stream Realtime
  @override
  Future<Either<AppException, Stream<List<dynamic>>>> streamActivityFeed() async {
    try {
      return await dashboardDatasource.streamActivityFeed();
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  // NEW IMPLEMENTATION
  @override
  Future<Either<AppException, dynamic>> getCompanyList() async {
    try {
      return await dashboardDatasource.getCompanyList();
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  // --- ADDED: Reimburse List Implementation ---
  @override
  Future<Either<AppException, dynamic>> getReimburseList() async {
    try {
      return await dashboardDatasource.getReimburseList();
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> bannerHome() async {
    try {
      return await dashboardDatasource.bannerHome();
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  @override
  Future<Either<AppException, dynamic>> approveAbsence({
    required String id,
    required String namaKaryawan,
    required String idKaryawan,
    required String status,
  }) async {
    try {
      return await dashboardDatasource.approveAbsence(
        id: id,
        namaKaryawan: namaKaryawan,
        idKaryawan: idKaryawan,
        status: status,
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }
}