import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_svg/svg.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';

import 'package:apppro/api/core/exception/app_exception.dart';
import 'package:apppro/api/core/state/app_state.dart';
import 'package:apppro/core/service/foreground_task/foreground_task.dart';
import 'package:apppro/core/utils/helper/helper.dart';
import 'package:apppro/core/utils/theme/color.dart';
import 'package:apppro/core/widgets/app_widgets.dart';
import 'package:apppro/core/utils/theme/theme.dart';
import 'package:apppro/feature/profile/domain/repositories/profile_provider.dart';
import 'package:apppro/gen/assets.gen.dart';
import 'package:apppro/routes.dart';

// Import Providers untuk refresh data
import 'package:apppro/feature/contact/domain/repository/contact_provider.dart';
import 'package:apppro/feature/files/domain/repository/file_collection_provider.dart';

// Import Permission
import 'package:apppro/shared/models/permission_enum.dart';

// Import Views untuk disatukan
import 'package:apppro/feature/contact/presentation/views/contact.dart';
import 'package:apppro/feature/files/presentation/views/files_collection.dart';

// Import Preference Key untuk cek Admin
import 'package:apppro/core/service/pref/app_preference_key.dart';

// --- ADDED: Import AppPreference Provider ---
import 'package:apppro/core/service/pref/app_preference_provider.dart';

import 'package:file_picker/file_picker.dart';
import 'package:apppro/feature/files/domain/entities/file_collection.dart';

part 'archive_view.dart';