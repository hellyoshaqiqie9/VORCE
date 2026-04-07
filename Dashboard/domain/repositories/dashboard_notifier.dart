import 'dart:async'; // ADDED: untuk StreamSubscription
import 'dart:io';

import 'package:dartz/dartz.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:apppro/api/core/exception/app_exception.dart';
import 'package:apppro/api/core/state/app_state.dart';
import 'package:apppro/core/service/pref/app_preference.dart';
import 'package:apppro/feature/dashboard/domain/repositories/dashboard_repositorie.dart';

class DashboardNotifier extends StateNotifier<AppState> {
  final DashboardRepositorie dashboardRepositorie;
  final AppPreference appPreference;
  StreamSubscription? _activitySubscription; // NEW: Listener untuk stream Firestore

  DashboardNotifier({required this.dashboardRepositorie, required this.appPreference}) : super(const AppState.initial());

  @override
  void dispose() {
    _activitySubscription?.cancel(); // Bersihkan listener memori
    super.dispose();
  }

  Future<Either<AppException, dynamic>> getAttendance({
    required String start,
    required String end,
  }) async {
    try {
      state = const AppState.loading();
      return await dashboardRepositorie.getAttendance(start: start, end: end).then((value) => value.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (result) {
          state = AppState.success(result);
          return Right(result);
        },
      ));
    } catch (e) {
      state = AppState.failed(AppException(message: e.toString()));
      return Left(AppException(message: e.toString()));
    }
  }

  // --- ADDED: Method History dengan parameter userId ---
  Future<Either<AppException, dynamic>> getAttendanceHistory({
    required String start,
    required String end,
    String? userId, // ADDED: Parameter opsional untuk melihat history orang lain
  }) async {
    try {
      state = const AppState.loading();
      // Pass userId ke repository
      return await dashboardRepositorie.getAttendanceHistory(start: start, end: end, userId: userId).then((value) => value.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (result) {
          state = AppState.success(result);
          return Right(result);
        },
      ));
    } catch (e) {
      state = AppState.failed(AppException(message: e.toString()));
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> getAttendanceList({
    required String start,
    required String end,
  }) async {
    try {
      state = const AppState.loading();
      return await dashboardRepositorie.getAttendanceList(start: start, end: end).then((value) => value.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (result) {
          state = AppState.success(result);
          return Right(result);
        },
      ));
    } catch (e) {
      state = AppState.failed(AppException(message: e.toString()));
      return Left(AppException(message: e.toString()));
    }
  }

  // NEW METHOD: Get Company List
  Future<Either<AppException, dynamic>> getCompanyList() async {
    try {
      state = const AppState.loading();
      return await dashboardRepositorie.getCompanyList().then((value) => value.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (result) {
          state = AppState.success(result);
          return Right(result);
        },
      ));
    } catch (e) {
      state = AppState.failed(AppException(message: e.toString()));
      return Left(AppException(message: e.toString()));
    }
  }

  // --- ADDED: Get Reimburse List ---
  Future<Either<AppException, dynamic>> getReimburseList() async {
    try {
      state = const AppState.loading();
      return await dashboardRepositorie.getReimburseList().then((value) => value.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (result) {
          state = AppState.success(result);
          return Right(result);
        },
      ));
    } catch (e) {
      state = AppState.failed(AppException(message: e.toString()));
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> checkIn({required String timezone, required File photo}) async {
    try {
      state = const AppState.loading();
      return await dashboardRepositorie.checkIn(timezone: timezone, photo: photo).then((value) => value.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (result) {
          state = AppState.success(result);
          return Right(result);
        },
      ));
    } catch (e) {
      state = AppState.failed(AppException(message: e.toString()));
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> checkOut({
    required String id,
    required String date,
    required String timezone,
    required File photo,
    String? address, // ADDED: Param address
  }) async {
    try {
      state = const AppState.loading();
      return await dashboardRepositorie.checkOut(
          id: id,
          date: date,
          timezone: timezone,
          photo: photo,
          address: address // Pass to repo
      ).then((value) => value.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (result) {
          state = AppState.success(result);
          return Right(result);
        },
      ));
    } catch (e) {
      state = AppState.failed(AppException(message: e.toString()));
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> restIn({required String id, required String timezone, required File photo}) async {
    try {
      state = const AppState.loading();
      return await dashboardRepositorie.restIn(id: id, timezone: timezone, photo: photo).then((value) => value.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (result) {
          state = AppState.success(result);
          return Right(result);
        },
      ));
    } catch (e) {
      state = AppState.failed(AppException(message: e.toString()));
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> restOut({required String id, required String timezone, required File photo}) async {
    try {
      state = const AppState.loading();
      return await dashboardRepositorie.restOut(id: id, timezone: timezone, photo: photo).then((value) => value.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (result) {
          state = AppState.success(result);
          return Right(result);
        },
      ));
    } catch (e) {
      state = AppState.failed(AppException(message: e.toString()));
      return Left(AppException(message: e.toString()));
    }
  }

  // UPDATED: Activity Feed menggunakan stream realtime Firestore tanpa merusak struktur existing UI
  Future<Either<AppException, dynamic>> activityFeed() async {
    try {
      state = const AppState.loading();
      _activitySubscription?.cancel(); // Batalkan subscription lama jika di panggil ulang (misal: pull to refresh)

      final result = await dashboardRepositorie.streamActivityFeed();
      return result.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (stream) {
          // Mendengarkan data realtime dan update AppState UI secara dinamis
          _activitySubscription = stream.listen(
                (data) {
              state = AppState.success(data);
            },
            onError: (error) {
              state = AppState.failed(AppException(message: error.toString()));
            },
          );

          return Right(stream); // Mengembalikan stream (walaupun UI cukup melihat perubahan 'state')
        },
      );
    } catch (e) {
      state = AppState.failed(AppException(message: e.toString()));
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> bannerHome() async {
    try {
      state = const AppState.loading();
      return await dashboardRepositorie.bannerHome().then((value) => value.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (result) {
          state = AppState.success(result);
          return Right(result);
        },
      ));
    } catch (e) {
      state = AppState.failed(AppException(message: e.toString()));
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> approveAbsence({
    required String id,
    required String namaKaryawan,
    required String idKaryawan,
    required String status,
  }) async {
    try {
      state = const AppState.loading();
      return await dashboardRepositorie
          .approveAbsence(
        id: id,
        namaKaryawan: namaKaryawan,
        idKaryawan: idKaryawan,
        status: status,
      )
          .then((value) => value.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (result) {
          state = AppState.success(result);
          return Right(result);
        },
      ));
    } catch (e) {
      state = AppState.failed(AppException(message: e.toString()));
      return Left(AppException(message: e.toString()));
    }
  }
}