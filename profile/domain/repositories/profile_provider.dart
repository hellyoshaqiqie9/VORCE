import 'package:flutter_riverpod/legacy.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:apppro/api/core/api_core.dart';
import 'package:apppro/api/core/provider/core_provider.dart';
import 'package:apppro/api/core/state/app_state.dart';
import 'package:apppro/core/service/pref/app_preference_provider.dart';
import 'package:apppro/feature/profile/data/profile_api.dart';
import 'package:apppro/feature/profile/domain/repositories/profile_datasource.dart';
import 'package:apppro/feature/profile/domain/repositories/profile_notifier.dart';
import 'package:apppro/feature/profile/domain/repositories/profile_repository.dart';

// ADDED: Import Auth Provider untuk mendapatkan akses ke AuthApi
import 'package:apppro/feature/auth/domain/repositories/auth_provider.dart';

/// API Provider
final profileApiProvider = Provider<ProfileApi>((ref) {
  final dio = ref.watch(dioProvided);
  return ProfileApi(
    dio,
    baseUrl: ApiCore.baseUrl,
    errorLogger: ref.watch(dioErrorLogger),
  );
});

/// Datasource Provider
final profileDatasourceProvider = Provider<ProfileDatasource>((ref) {
  final profileApi = ref.watch(profileApiProvider);
  // ADDED: Inject AuthApi dari authApiProvider
  final authApi = ref.watch(authApiProvider);
  final appPreference = ref.watch(appPreferenceProvider);

  return ProfileDatasource(
    profileApi: profileApi,
    authApi: authApi, // Pass ke Datasource
    appPreference: appPreference,
    ref: ref,
  );
});

/// Repository Providers
final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  final profileDatasource = ref.watch(profileDatasourceProvider);
  final appPreference = ref.watch(appPreferenceProvider);
  return ProfileRepositoryImpl(
    profileDatasource: profileDatasource,
    appPreference: appPreference,
  );
});

final profileUpdateRepositoryProvider = Provider<ProfileRepository>((ref) {
  final profileDatasource = ref.watch(profileDatasourceProvider);
  final appPreference = ref.watch(appPreferenceProvider);
  return ProfileRepositoryImpl(
    profileDatasource: profileDatasource,
    appPreference: appPreference,
  );
});

/// State Notifier Providers
final profileStateNotifierProvider = StateNotifierProvider<ProfileNotifier, AppState>((ref) {
  final profileRepository = ref.watch(profileRepositoryProvider);
  final appPreference = ref.watch(appPreferenceProvider);
  return ProfileNotifier(profileRepository, appPreference);
});

final companyStateNotifierProvider = StateNotifierProvider<ProfileNotifier, AppState>((ref) {
  final profileRepository = ref.watch(profileRepositoryProvider);
  final appPreference = ref.watch(appPreferenceProvider);
  return ProfileNotifier(profileRepository, appPreference);
});

final staffStateNotifierProvider = StateNotifierProvider<ProfileNotifier, AppState>((ref) {
  final profileRepository = ref.watch(profileRepositoryProvider);
  final appPreference = ref.watch(appPreferenceProvider);
  return ProfileNotifier(profileRepository, appPreference);
});

final staffInvitationStateNotifierProvider = StateNotifierProvider<ProfileNotifier, AppState>((ref) {
  final profileRepository = ref.watch(profileRepositoryProvider);
  final appPreference = ref.watch(appPreferenceProvider);
  return ProfileNotifier(profileRepository, appPreference);
});

final publicInviteLinkStateNotifierProvider = StateNotifierProvider<ProfileNotifier, AppState>((ref) {
  final profileRepository = ref.watch(profileRepositoryProvider);
  final appPreference = ref.watch(appPreferenceProvider);
  return ProfileNotifier(profileRepository, appPreference);
});

/// State Providers
// FIX: Ubah default value dari URL yang error menjadi string kosong atau URL alternatif yang valid
final photoProfileProvider = StateProvider<String>((ref) => 'https://avatar.iran.liara.run/public');

final photoCompanyProvider = StateProvider<String>((ref) => 'https://avatar.iran.liara.run/public');

final archiveStatLaporanStateNotifierProvider = StateNotifierProvider<ProfileNotifier, AppState>((ref) {
  final profileRepository = ref.watch(profileRepositoryProvider);
  final appPreference = ref.watch(appPreferenceProvider);
  return ProfileNotifier(profileRepository, appPreference);
});

final archiveStatKehadiranStateNotifierProvider = StateNotifierProvider<ProfileNotifier, AppState>((ref) {
  final profileRepository = ref.watch(profileRepositoryProvider);
  final appPreference = ref.watch(appPreferenceProvider);
  return ProfileNotifier(profileRepository, appPreference);
});

// --- Provider for Reimburse Stats ---
final archiveStatReimburseStateNotifierProvider = StateNotifierProvider<ProfileNotifier, AppState>((ref) {
  final profileRepository = ref.watch(profileRepositoryProvider);
  final appPreference = ref.watch(appPreferenceProvider);
  return ProfileNotifier(profileRepository, appPreference);
});

// --- NEW: Provider for Tugas Stats ---
final archiveStatTugasStateNotifierProvider = StateNotifierProvider<ProfileNotifier, AppState>((ref) {
  final profileRepository = ref.watch(profileRepositoryProvider);
  final appPreference = ref.watch(appPreferenceProvider);
  return ProfileNotifier(profileRepository, appPreference);
});
// ----------------------------------------

final editCompanyStateNotifierProvider = StateNotifierProvider<ProfileNotifier, AppState>((ref) {
  final profileRepository = ref.watch(profileRepositoryProvider);
  final appPreference = ref.watch(appPreferenceProvider);
  return ProfileNotifier(profileRepository, appPreference);
});