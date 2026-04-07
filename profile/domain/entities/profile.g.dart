// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'profile.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Profile _$ProfileFromJson(Map<String, dynamic> json) => _Profile(
  id: (json['id'] as num?)?.toInt(),
  name: json['namaKaryawan'] as String,
  liked: json['liked'] as String? ?? 'no',
  email: json['alamatEmail'] as String,
  phone: json['noHP'] as String?,
  perusahaan: json['namaPerusahaan'] as String?,
  perusahaanId: json['idperusahaan'] as String?,
  longitude: json['alamatLongtitude'] as String?,
  latitude: json['alamatLatitude'] as String?,
  address: json['alamatLoc'] as String?,
  photo:
      json['foto'] as String? ??
      'https://api.horaapp.id/images/companylogo/horawatermark.png',
  joinDate: json['joinDate'] as String?,
  status: json['status'] as String?,
  fcmToken: json['fcmToken'] as String?,
  idkaryawan: json['idkaryawan'] as String?,
  gender: json['gender'] as String?,
  jabatan: json['jabatan'] as String?,
);

Map<String, dynamic> _$ProfileToJson(_Profile instance) => <String, dynamic>{
  'id': instance.id,
  'namaKaryawan': instance.name,
  'liked': instance.liked,
  'alamatEmail': instance.email,
  'noHP': instance.phone,
  'namaPerusahaan': instance.perusahaan,
  'idperusahaan': instance.perusahaanId,
  'alamatLongtitude': instance.longitude,
  'alamatLatitude': instance.latitude,
  'alamatLoc': instance.address,
  'foto': instance.photo,
  'joinDate': instance.joinDate,
  'status': instance.status,
  'fcmToken': instance.fcmToken,
  'idkaryawan': instance.idkaryawan,
  'gender': instance.gender,
  'jabatan': instance.jabatan,
};
