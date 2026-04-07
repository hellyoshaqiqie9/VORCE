import 'package:flutter_riverpod/legacy.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:apppro/api/core/api_core.dart';
import 'package:apppro/api/core/provider/core_provider.dart';
import 'package:apppro/api/core/state/app_state.dart';
import 'package:apppro/core/service/notification/push_notification_provider.dart';
import 'package:apppro/feature/dashboard/data/dashboard_api.dart';
import 'package:apppro/core/service/pref/app_preference_provider.dart';
import 'package:apppro/feature/dashboard/domain/repositories/dashboard_datasource.dart';
import 'package:apppro/feature/dashboard/domain/repositories/dashboard_notifier.dart';
import 'package:apppro/feature/dashboard/domain/repositories/dashboard_repositorie.dart';
import 'package:apppro/feature/presence/presentation/views/camera.dart';

final checkInProvider = StateProvider<OnCaptureData?>((ref) => null);
final restStartProvider = StateProvider<OnCaptureData?>((ref) => null);
final restEndProvider = StateProvider<OnCaptureData?>((ref) => null);
final checkOutProvider = StateProvider<OnCaptureData?>((ref) => null);

final checkInDateProvider = StateProvider<String?>((ref) => null);
final restStartDateProvider = StateProvider<String?>((ref) => null);
final restEndDateProvider = StateProvider<String?>((ref) => null);
final checkOutDateProvider = StateProvider<String?>((ref) => null);

final currentIdAbsenceProvider = StateProvider<String?>((ref) => null);
final refreshAbsenceProvider = StateProvider<String>((ref) => DateTime.now().toIso8601String());

// Provider for tracking selected date for presence data
final selectedPresenceDateProvider = StateProvider<DateTime>((ref) => DateTime.now());

final dashboardApiProvider = Provider<DashboardApi>((ref) {
  final dio = ref.watch(dioProvided);
  return DashboardApi(dio, baseUrl: ApiCore.baseUrl, errorLogger: ref.watch(dioErrorLogger));
});

final dashboardDatasourceProvider = Provider<DashboardDatasource>((ref) {
  final dashboarApi = ref.watch(dashboardApiProvider);
  final appPreference = ref.watch(appPreferenceProvider);
  final localNotification = ref.watch(localNotificationServiceProvider);
  return DashboardDatasource(dashboardApi: dashboarApi, appPreference: appPreference, localNotificationService: localNotification);
});

final dashboardRepositorieProvider = Provider<DashboardRepositorie>((ref) {
  final dashboardDatasource = ref.watch(dashboardDatasourceProvider);
  return DashboardRepositorieImp(dashboardDatasource: dashboardDatasource);
});

final attendanceStateNotifierProvider = StateNotifierProvider<DashboardNotifier, AppState>((ref) {
  final appPreference = ref.watch(appPreferenceProvider);
  final dashboardRepositorie = ref.watch(dashboardRepositorieProvider);
  return DashboardNotifier(dashboardRepositorie: dashboardRepositorie, appPreference: appPreference);
});

// Provider for date-specific attendance data
final dateSpecificAttendanceStateNotifierProvider = StateNotifierProvider<DashboardNotifier, AppState>((ref) {
  final appPreference = ref.watch(appPreferenceProvider);
  final dashboardRepositorie = ref.watch(dashboardRepositorieProvider);
  return DashboardNotifier(dashboardRepositorie: dashboardRepositorie, appPreference: appPreference);
});

final bannersStateNotifierProvider = StateNotifierProvider<DashboardNotifier, AppState>((ref) {
  final appPreference = ref.watch(appPreferenceProvider);
  final dashboardRepositorie = ref.watch(dashboardRepositorieProvider);
  return DashboardNotifier(dashboardRepositorie: dashboardRepositorie, appPreference: appPreference);
});
final logActifityStateNotifierProvider = StateNotifierProvider<DashboardNotifier, AppState>((ref) {
  final appPreference = ref.watch(appPreferenceProvider);
  final dashboardRepositorie = ref.watch(dashboardRepositorieProvider);
  return DashboardNotifier(dashboardRepositorie: dashboardRepositorie, appPreference: appPreference);
});

final attendanceListStateNotifierProvider = StateNotifierProvider<DashboardNotifier, AppState>((ref) {
  final appPreference = ref.watch(appPreferenceProvider);
  final dashboardRepositorie = ref.watch(dashboardRepositorieProvider);
  return DashboardNotifier(dashboardRepositorie: dashboardRepositorie, appPreference: appPreference);
});

// --- ADDED: Provider Khusus untuk History Absensi di Profil ---
final profileAttendanceStateNotifierProvider = StateNotifierProvider<DashboardNotifier, AppState>((ref) {
  final appPreference = ref.watch(appPreferenceProvider);
  final dashboardRepositorie = ref.watch(dashboardRepositorieProvider);
  return DashboardNotifier(dashboardRepositorie: dashboardRepositorie, appPreference: appPreference);
});

// NEW PROVIDER: Company List
final companyListStateNotifierProvider = StateNotifierProvider<DashboardNotifier, AppState>((ref) {
  final appPreference = ref.watch(appPreferenceProvider);
  final dashboardRepositorie = ref.watch(dashboardRepositorieProvider);
  return DashboardNotifier(dashboardRepositorie: dashboardRepositorie, appPreference: appPreference);
});

// --- ADDED: Reimburse List Provider ---
final reimburseListStateNotifierProvider = StateNotifierProvider<DashboardNotifier, AppState>((ref) {
  final appPreference = ref.watch(appPreferenceProvider);
  final dashboardRepositorie = ref.watch(dashboardRepositorieProvider);
  return DashboardNotifier(dashboardRepositorie: dashboardRepositorie, appPreference: appPreference);
});