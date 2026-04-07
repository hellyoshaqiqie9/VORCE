import 'dart:convert';
import 'dart:io';
import 'dart:async'; // --- ADDED: Diperlukan untuk StreamSubscription ---

import 'package:firebase_storage/firebase_storage.dart';
import 'package:cloud_firestore/cloud_firestore.dart'; // --- ADDED: Diperlukan untuk DocumentSnapshot dan Firestore ---
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/services.dart';
import 'package:flutter_chat_ui/flutter_chat_ui.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:apppro/core/utils/theme/theme.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_svg_provider/flutter_svg_provider.dart' as svg_provider;
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:apppro/api/core/provider/core_provider.dart';
import 'package:apppro/api/core/state/app_state.dart';
import 'package:apppro/core/service/pref/app_preference_key.dart';
import 'package:apppro/core/service/pref/app_preference_provider.dart';
import 'package:apppro/core/utils/constant/enum.dart';
import 'package:apppro/core/utils/helper/helper.dart';
import 'package:apppro/core/utils/theme/color.dart';
import 'package:apppro/core/widgets/app_widgets.dart';
import 'package:apppro/feature/profile/domain/entities/company.dart';
import 'package:apppro/feature/profile/domain/entities/profile.dart';
import 'package:apppro/feature/profile/domain/repositories/profile_notifier.dart';
import 'package:apppro/feature/profile/domain/repositories/profile_provider.dart';
import 'package:apppro/feature/webview/data/models/webview_param.dart';
import 'package:apppro/gen/assets.gen.dart';
import 'package:apppro/routes.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:device_info_plus/device_info_plus.dart'; // --- ADDED: Untuk Info Device ---
import 'package:shared_preferences/shared_preferences.dart'; // --- ADDED: Untuk Setting Shift ---

// Task Imports
import 'package:apppro/feature/task/domain/entities/task_model.dart';
import 'package:apppro/feature/task/domain/repositories/task_provider.dart';
import 'package:apppro/feature/task/presentation/views/task.dart'; // --- ADDED: Akses ke TaskDetailSheet ---

// Leave Imports
import 'package:apppro/feature/leave_request/domain/repositories/leave_provider.dart';
import 'package:apppro/feature/leave_request/presentation/views/leave_request_detail.dart'; // --- ADDED: Akses ke LeaveRequestDetailView ---

// Dashboard/Absence Imports
import 'package:apppro/feature/dashboard/domain/repositories/dashboard_provider.dart';
import 'package:apppro/feature/dashboard/domain/entities/absence.dart';

// --- PERBAIKAN IMPORT ---
// Menggunakan path feature/dashboard sesuai routes.dart agar PresenceDetailView terbaca
import 'package:apppro/feature/dashboard/presentation/views/presence.dart';

// --- ADDED: Face Verification Import ---
import 'package:apppro/feature/auth/presentation/views/face_verification.dart';
import 'package:apppro/feature/profile/presentation/views/face_registration_camera.dart';
import 'package:apppro/feature/auth/domain/repositories/auth_provider.dart';

// --- ADDED: Reimbursement Imports ---
import 'package:apppro/feature/reimbursement/domain/repositories/reimbursement_provider.dart';
import 'package:apppro/feature/reimbursement/domain/entities/models/reimbursement_model.dart';
import 'package:apppro/feature/reimbursement/presentation/views/reimbursement.dart'; // Akses ke ReimbursementDetailSheet

part 'profile_view.dart';
part 'setting_view_profile.dart';
part 'storage_view.dart';
part '../widgets/company_content.dart';
part '../widgets/user_content.dart';
part '../widgets/company_menu.dart';
part '../widgets/about_menu.dart';
part '../widgets/user_task_list.dart';
part '../widgets/user_leave_list.dart';
part '../widgets/user_absence_list.dart';
part '../widgets/delete_account_view.dart';
part '../widgets/user_reimburse_list.dart';
part '../widgets/delete_company_view.dart';