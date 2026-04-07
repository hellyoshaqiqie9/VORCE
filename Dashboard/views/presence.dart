import 'dart:async'; // PERUBAHAN: Ditambahkan agar Timer bisa digunakan di file part
import 'dart:io';
import 'dart:convert';

import 'package:camera/camera.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:firebase_auth/firebase_auth.dart'; // REQUIRED FOR MAP
import 'package:flutter/material.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:local_auth/error_codes.dart' as auth_error;
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_map/flutter_map.dart'; // REQUIRED FOR MAP
import 'package:flutter_svg/svg.dart';
import 'package:geolocator/geolocator.dart'; // REQUIRED FOR MAP
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:latlong2/latlong.dart'; // REQUIRED FOR MAP
import 'package:collection/collection.dart'; // REQUIRED FOR MAP LOGIC
import 'package:url_launcher/url_launcher.dart'; // REQUIRED FOR MAP ATTRIBUTION
import 'package:flutter/foundation.dart';
import 'package:apppro/api/core/state/app_state.dart';
import 'package:apppro/core/service/firebase/firebase_firestore_service_provider.dart'; // REQUIRED FOR MAP
import 'package:apppro/core/service/location/location_service.dart';
import 'package:apppro/core/service/notification/push_notification_provider.dart';
import 'package:apppro/core/service/pref/app_preference_key.dart';
import 'package:apppro/core/service/pref/app_preference_provider.dart';
import 'package:apppro/core/utils/helper/helper.dart';
import 'package:apppro/core/utils/helper/position.dart';
import 'package:apppro/core/utils/theme/color.dart';
import 'package:apppro/core/utils/theme/theme.dart';
import 'package:apppro/core/widgets/app_widgets.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:apppro/feature/dashboard/domain/repositories/dashboard_notifier.dart';
import 'package:apppro/feature/dashboard/domain/repositories/dashboard_provider.dart';
import 'package:apppro/feature/files/domain/entities/mime_type.dart';
import 'package:apppro/feature/map/domain/repository/map_provider.dart'; // REQUIRED FOR MAP
import 'package:apppro/feature/presence/presentation/views/camera.dart';
import 'package:apppro/feature/profile/domain/entities/staff.dart'; // REQUIRED FOR MAP
import 'package:apppro/feature/profile/domain/repositories/profile_provider.dart'; // REQUIRED FOR MAP
import 'package:apppro/feature/leave_request/domain/repositories/leave_provider.dart'; // ADDED: Provider untuk Izin
import 'package:apppro/feature/leave_request/presentation/views/leave_request_detail.dart'; // ADDED: Import untuk Bottom Sheet Detail Izin
import 'package:apppro/feature/leave_request/domain/entities/leave_enum.dart'; // ADDED: Import untuk ENUM Form Izin
import 'package:apppro/gen/assets.gen.dart';
import 'package:apppro/routes.dart';
import 'package:apppro/shared/models/employee_location.dart'; // REQUIRED FOR MAP
import 'package:path/path.dart' as path;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:path_provider/path_provider.dart';
import 'package:stop_watch_timer/stop_watch_timer.dart';

part 'presence_view.dart';
part 'presence_detail_view.dart';
part 'setting_view_presence.dart';
part '../widgets/presence_header.dart';
part '../widgets/presence_time_chips.dart';
part '../widgets/presence_stopwatch.dart';
part '../widgets/presence_event.dart';
part '../widgets/presence_bottom_sheet.dart';
part '../widgets/presence_search_bar.dart';
part '../widgets/presence_employee_list.dart';

// --- GLOBAL PROVIDERS FOR SETTINGS ---
final showShiftFilterProvider = StateProvider<bool>((ref) => true); // Default True (Aktif)
final settingsTimezoneProvider = StateProvider<String>((ref) => "UTC+7");
final settingsLanguageProvider = StateProvider<String>((ref) => "id");