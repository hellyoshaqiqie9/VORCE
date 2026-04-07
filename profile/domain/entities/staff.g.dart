// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'staff.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Staff _$StaffFromJson(Map<String, dynamic> json) => _Staff(
  namaKaryawan: json['namaKaryawan'] as String?,
  liked: json['liked'] as String?,
  alamatEmail: json['alamatEmail'] as String?,
  noHp: json['noHp'] as String?,
  namaPerusahaan: json['namaPerusahaan'] as String?,
  idperusahaan: json['idperusahaan'] as String?,
  alamatLongtitude: json['alamatLongtitude'] as String?,
  alamatLatitude: json['alamatLatitude'] as String?,
  alamatLoc: json['alamatLoc'] as String?,
  foto: json['foto'] as String?,
  joinDate: _dateTimeFromIsoString(json['joinDate'] as String?),
  status: json['status'] as String?,
  fcmToken: json['fcmToken'] as String?,
  id: (json['id'] as num).toInt(),
  idkaryawan: json['idkaryawan'] as String?,
  gender: json['gender'] as String?,
  jabatan: json['jabatan'] as String?,
);

Map<String, dynamic> _$StaffToJson(_Staff instance) => <String, dynamic>{
  'namaKaryawan': instance.namaKaryawan,
  'liked': instance.liked,
  'alamatEmail': instance.alamatEmail,
  'noHp': instance.noHp,
  'namaPerusahaan': instance.namaPerusahaan,
  'idperusahaan': instance.idperusahaan,
  'alamatLongtitude': instance.alamatLongtitude,
  'alamatLatitude': instance.alamatLatitude,
  'alamatLoc': instance.alamatLoc,
  'foto': instance.foto,
  'joinDate': _dateTimeToIsoString(instance.joinDate),
  'status': instance.status,
  'fcmToken': instance.fcmToken,
  'id': instance.id,
  'idkaryawan': instance.idkaryawan,
  'gender': instance.gender,
  'jabatan': instance.jabatan,
};
