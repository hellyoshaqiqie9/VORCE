import 'dart:async';
import 'dart:io';

import 'package:dartz/dartz.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:apppro/api/core/exception/app_exception.dart';
import 'package:apppro/api/core/state/app_state.dart';
import 'package:apppro/api/token/fcm_token.dart';
import 'package:apppro/core/service/pref/app_preference.dart';
import 'package:apppro/core/utils/helper/helper.dart';
import 'package:apppro/feature/profile/domain/entities/company.dart';
import 'package:apppro/feature/profile/domain/entities/profile.dart';
import 'package:apppro/feature/profile/domain/repositories/profile_repository.dart';

class ProfileNotifier extends StateNotifier<AppState> {
  final ProfileRepository profileRepository;
  final AppPreference appPreference;

  // Stream Subscription handle
  StreamSubscription? _profileSubscription;

  ProfileNotifier(
      this.profileRepository,
      this.appPreference,
      ) : super(const AppState.initial());

  @override
  void dispose() {
    _profileSubscription?.cancel();
    super.dispose();
  }

  // ADDED: Sign Out Method
  Future<Either<AppException, dynamic>> signOut() async {
    try {
      state = const AppState.loading();
      // Cancel stream if exists
      await _profileSubscription?.cancel();

      final result = await profileRepository.signOut();
      return result.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (data) {
          state = AppState.success(data);
          return Right(data);
        },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  // --- CHANGED: LISTEN TO PROFILE (WITH LOCAL CACHE) ---
  void listenToProfile() async {
    // Avoid multiple subscriptions
    await _profileSubscription?.cancel();

    // 1. LOAD LOCAL CACHE FIRST
    final localResult = await profileRepository.getLocalProfileCache();

    localResult.fold(
            (failed) {
          final bool isAlreadySuccess = state.maybeMap(
            success: (_) => true,
            orElse: () => false,
          );
          if (!isAlreadySuccess) {
            state = const AppState.loading();
          }
        },
            (data) {
          if (data is Map<String, dynamic>) {
            try {
              final profile = Profile.fromJson(data);
              state = AppState.success(profile);
            } catch (e) {
              debugPrint("Error parsing cached profile: $e");
            }
          }
        }
    );

    // 2. START REALTIME STREAM
    _profileSubscription = profileRepository.getProfileStream().listen(
          (result) {
        result.fold(
              (failed) {
            final bool isAlreadySuccess = state.maybeMap(
              success: (_) => true,
              orElse: () => false,
            );

            if (!isAlreadySuccess) {
              state = AppState.failed(failed);
            }
          },
              (data) {
            // Mapping to Profile Entity
            if (data is Map<String, dynamic>) {
              try {
                final profile = Profile.fromJson(data);
                state = AppState.success(profile);
              } catch (e) {
                debugPrint("Error parsing profile in notifier: $e");
                // FIX: JANGAN masukkan raw data ke state jika parsing gagal
                // state = AppState.success(data); <--- PENYEBAB CRASH DIHAPUS

                // Opsional: Tetap biarkan state lama atau set error
                // state = AppState.failed(AppException(message: "Data format error"));
              }
            } else {
              // Jika data sudah berupa object Profile (tergantung implementasi repo)
              state = AppState.success(data);
            }
          },
        );
      },
      onError: (error) {
        state = AppState.failed(AppException(message: error.toString()));
      },
    );
  }
  // ------------------------------------------------

  Future<Either<AppException, dynamic>> getCompanyProfileByToken() async {
    try {
      state = const AppState.loading();
      final result = await profileRepository.getCompanyProfileByToken();
      return result.fold(
            (failed) { state = AppState.failed(failed); return Left(failed); },
            (data) {
          if (data is Map<String, dynamic>) {
            final profile = Profile.fromJson(data);
            state = AppState.success(profile);
            return Right(data);
          } else {
            state = AppState.success(data);
            return Right(data);
          }
        },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> getProfile() async {
    try {
      state = const AppState.loading();
      final result = await profileRepository.getProfile();
      return result.fold(
            (failed) { state = AppState.failed(failed); return Left(failed); },
            (data) {
          if (data is Map<String, dynamic>) {
            final profile = Profile.fromJson(data);
            state = AppState.success(profile);
            return Right(data);
          } else {
            final error = AppException(message: "Unexpected response type");
            state = AppState.failed(error);
            return Left(error);
          }
        },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> updateProfile({required String namaKaryawan, required String? alamat, required String? gender, required String alamatEmail, required File? foto}) async {
    try {
      // FIX: Jangan set loading state global jika menggunakan stream, agar UI tidak flicker/reset
      final result = await profileRepository.updateProfile(namaKaryawan: namaKaryawan, alamat: alamat, gender: gender, alamatEmail: alamatEmail, foto: foto);
      return result.fold(
            (failed) => Left(failed),
            (data) => Right(data), // FIX: Jangan update state disini, biarkan stream yang update
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> deleteAccount() async {
    try {
      return await profileRepository.deleteAccount();
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  // --- NEW: Menambahkan Fungsi Hapus Perusahaan ---
  Future<Either<AppException, dynamic>> deleteCompany({required String email, required String reason}) async {
    try {
      // FIX: Dihapus pembaruan state (seperti state = AppState.success)
      // karena API mengembalikan JSON (Map) sedangkan provider ini digunakan
      // oleh UI Profile yang mengharapkan object Profile. Jika state diubah,
      // akan terjadi TypeError yang menyebabkan crash UI dan navigasi gagal.
      final result = await profileRepository.deleteCompany(email, reason);
      return result.fold(
            (failed) => Left(failed),
            (data) => Right(data),
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }
  // ------------------------------------------------

  Future<Either<AppException, dynamic>> saveFCMToken(String idKaryawan, FcmToken fcmToken) async {
    try {
      return await profileRepository.saveFCMToken();
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> getCompany() async {
    try {
      state = const AppState.loading();
      final result = await profileRepository.getCompany();
      return result.fold(
            (failed) { state = AppState.failed(failed); return Left(failed); },
            (data) {
          if (data is Company) {
            state = AppState.success(data);
            return Right(data);
          } else {
            final error = AppException(message: "Unexpected response type ${data.runtimeType}");
            state = AppState.failed(error);
            return Left(error);
          }
        },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> getStaff() async {
    try {
      state = const AppState.loading();
      final result = await profileRepository.getStaff();
      return result.fold(
            (failed) { state = AppState.failed(failed); return Left(failed); },
            (data) {
          if (data is List<dynamic>) {
            state = AppState.success(data);
            return Right(data);
          } else {
            final error = AppException(message: "Unexpected response type ${data.runtimeType}");
            state = AppState.failed(error);
            return Left(error);
          }
        },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> inviteStaff({required String email}) async {
    try {
      state = const AppState.loading();
      final result = await profileRepository.inviteStaff(email);
      return result.fold(
            (failed) { state = AppState.failed(failed); return Left(failed); },
            (data) {
          if (data is String) {
            state = AppState.success(data);
            return Right(data);
          } else {
            final error = AppException(message: "Unexpected response type ${data.runtimeType}");
            state = AppState.failed(error);
            return Left(error);
          }
        },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> deleteStaff({required String email}) async {
    try {
      state = const AppState.loading();
      final result = await profileRepository.deleteStaff(email);
      return result.fold(
            (failed) { state = AppState.failed(failed); return Left(failed); },
            (data) {
          if (data is List<dynamic>) {
            state = AppState.success(data);
            return Right(data);
          } else {
            final error = AppException(message: "Unexpected response type ${data.runtimeType}");
            state = AppState.failed(error);
            return Left(error);
          }
        },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> verifyEmployee({required String email, required bool approved}) async {
    try {
      state = const AppState.loading();
      final result = await profileRepository.verifyEmployee(email, approved);
      return result.fold(
            (failed) { state = AppState.failed(failed); return Left(failed); },
            (data) { state = AppState.success(data); return Right(data); },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> updateRole({required String email, required String action}) async {
    try {
      state = const AppState.loading();
      final result = await profileRepository.updateRole(email, action);
      return result.fold(
            (failed) { state = AppState.failed(failed); return Left(failed); },
            (data) { state = AppState.success(data); return Right(data); },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> fireEmployee({required String email, required String reason}) async {
    try {
      state = const AppState.loading();
      final result = await profileRepository.fireEmployee(email, reason);
      return result.fold(
            (failed) { state = AppState.failed(failed); return Left(failed); },
            (data) { state = AppState.success(data); return Right(data); },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, String>> getPublicInviteLink() async {
    try {
      state = const AppState.loading();
      final result = await profileRepository.getPublicInviteLink();
      return result.fold(
            (failed) { state = AppState.failed(failed); return Left(failed); },
            (data) { state = AppState.success(data); return Right(data); },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, String>> sendInviteByEmail(String email) async {
    try {
      state = const AppState.loading();
      final result = await profileRepository.sendInviteByEmail(email);
      return result.fold(
            (failed) { state = AppState.failed(failed); return Left(failed); },
            (data) { state = AppState.success(data); return Right(data); },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  // --- FIX: REMOVE STATE UPDATE ON ACTIONS ---
  Future<Either<AppException, dynamic>> updateCompanyProfile({required String namaPerusahaan, required String alamatLoc, required String noTelp, required String noWA}) async {
    try {
      // Tidak perlu set loading global karena UI bisa handle loading lokal
      final result = await profileRepository.updateCompanyProfile(namaPerusahaan: namaPerusahaan, alamatLoc: alamatLoc, noTelp: noTelp, noWA: noWA);
      return result.fold(
            (failed) => Left(failed),
            (data) => Right(data), // Stream akan update data, jangan set state manual
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> updateCompanyLogo({required File file, String? desc}) async {
    try {
      final result = await profileRepository.updateCompanyLogo(file: file, desc: desc);
      return result.fold(
            (failed) => Left(failed),
            (data) => Right(data), // Stream akan update data
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> updateUserPhoto({required File file, String? desc}) async {
    try {
      final result = await profileRepository.updateUserPhoto(file: file, desc: desc);
      return result.fold(
            (failed) => Left(failed),
            (data) => Right(data), // Stream akan update data
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> updateUserProfile({required String username, required String noTelp, required String noWA, required String alamatLoc}) async {
    try {
      // Hapus state = const AppState.loading(); agar UI tidak berkedip
      final result = await profileRepository.updateUserProfile(username: username, noTelp: noTelp, noWA: noWA, alamatLoc: alamatLoc);
      return result.fold(
            (failed) => Left(failed),
            (data) {
          // FIX: JANGAN update state disini. Data dari API update biasanya cuma status "Success".
          // Jika ini dimasukkan ke state, UI Profile yang mengharapkan Object Profile akan crash.
          // Biarkan listenToProfile() yang menerima update dari Firestore.
          return Right(data);
        },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }
  // -------------------------------------------

  Future<Either<AppException, dynamic>> getArchiveStatLaporan({required String tglstart, required String tglend}) async {
    try {
      state = const AppState.loading();
      final result = await profileRepository.getArchiveStatLaporan(tglstart, tglend);

      return result.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (data) {
          if (data is String) {
            state = AppState.success(data);
            return Right(data);
          } else {
            state = AppState.success(data);
            return Right(data);
          }
        },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  Future<Either<AppException, dynamic>> getArchiveStatKehadiran({required String tglstart, required String tglend}) async {
    try {
      state = const AppState.loading();
      final result = await profileRepository.getArchiveStatKehadiran(tglstart, tglend);

      return result.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (data) {
          if (data is String) {
            state = AppState.success(data);
            return Right(data);
          } else {
            state = AppState.success(data);
            return Right(data);
          }
        },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  // --- Method for Reimburse ---
  Future<Either<AppException, dynamic>> getArchiveStatReimburse({required String tglstart, required String tglend}) async {
    try {
      state = const AppState.loading();
      final result = await profileRepository.getArchiveStatReimburse(tglstart, tglend);

      return result.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (data) {
          if (data is String) {
            state = AppState.success(data);
            return Right(data);
          } else {
            state = AppState.success(data);
            return Right(data);
          }
        },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }

  // --- NEW: Method for Tugas ---
  Future<Either<AppException, dynamic>> getArchiveStatTugas({required String tglstart, required String tglend}) async {
    try {
      state = const AppState.loading();
      final result = await profileRepository.getArchiveStatTugas(tglstart, tglend);

      return result.fold(
            (failed) {
          state = AppState.failed(failed);
          return Left(failed);
        },
            (data) {
          if (data is String) {
            state = AppState.success(data);
            return Right(data);
          } else {
            state = AppState.success(data);
            return Right(data);
          }
        },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }
  // --------------------------------

  Future<Either<AppException, dynamic>> editCompany({required String namaPerusahaan, required String keterangan, required String alamatLatitude, required String alamatLoc, required String alamatLongtitude, required int noWA, required int noTelp, File? foto}) async {
    try {
      state = const AppState.loading();
      final result = await profileRepository.editCompany(
        namaPerusahaan: namaPerusahaan,
        keterangan: keterangan,
        alamatLatitude: alamatLatitude,
        alamatLoc: alamatLoc,
        alamatLongtitude: alamatLongtitude,
        foto: foto,
        noWA: noWA,
        noTelp: noTelp,
      );
      return result.fold(
            (failed) { state = AppState.failed(failed); return Left(failed); },
            (data) { return Right(data is String ? data : data.toString()); },
      );
    } catch (e) {
      return Left(AppException(message: e.toString()));
    }
  }
}