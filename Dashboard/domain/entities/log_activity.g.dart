// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'log_activity.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_LogActivity _$LogActivityFromJson(Map<String, dynamic> json) => _LogActivity(
  id: json['id'] as String,
  actorName: json['actorName'] as String,
  actorEmail: json['actorEmail'] as String,
  action: json['action'] as String,
  description: json['description'] as String,
  target: json['target'] as String,
  createdAt: json['createdAt'] as String,
);

Map<String, dynamic> _$LogActivityToJson(_LogActivity instance) =>
    <String, dynamic>{
      'id': instance.id,
      'actorName': instance.actorName,
      'actorEmail': instance.actorEmail,
      'action': instance.action,
      'description': instance.description,
      'target': instance.target,
      'createdAt': instance.createdAt,
    };
