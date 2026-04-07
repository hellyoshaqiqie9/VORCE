import 'dart:async'; // Tambahan untuk StreamSubscription
import 'package:cloud_firestore/cloud_firestore.dart'; // Tambahan untuk akses Firestore
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:apppro/core/service/pref/app_preference_key.dart'; // Tambahan untuk akses key pref
import 'package:apppro/core/service/pref/app_preference_provider.dart'; // Tambahan untuk akses local pref
import 'package:apppro/core/utils/helper/helper.dart';
import 'package:apppro/core/utils/theme/color.dart';
import 'package:apppro/core/widgets/app_widgets.dart';
import 'package:apppro/feature/profile/domain/entities/company.dart';
import 'package:apppro/feature/profile/domain/repositories/profile_provider.dart';
import 'package:apppro/gen/assets.gen.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:apppro/core/utils/theme/theme.dart';

part 'info_view.dart';