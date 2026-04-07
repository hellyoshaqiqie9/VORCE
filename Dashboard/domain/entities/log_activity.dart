import 'package:freezed_annotation/freezed_annotation.dart';

part 'log_activity.freezed.dart';
part 'log_activity.g.dart';

@freezed
abstract class LogActivity with _$LogActivity {
    const factory LogActivity({
        @JsonKey(name: "id") required String id,
        @JsonKey(name: "actorName") required String actorName,
        @JsonKey(name: "actorEmail") required String actorEmail,
        @JsonKey(name: "action") required String action,
        @JsonKey(name: "description") required String description,
        @JsonKey(name: "target") required String target,
        @JsonKey(name: "createdAt") required String createdAt,
    }) = _LogActivity;

    factory LogActivity.fromJson(Map<String, dynamic> json) => _$LogActivityFromJson(json);
}