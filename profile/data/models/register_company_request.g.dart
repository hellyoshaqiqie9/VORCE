// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'register_company_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

RegisterCompanyRequest _$RegisterCompanyRequestFromJson(
  Map<String, dynamic> json,
) => RegisterCompanyRequest(
  namaPerusahaan: json['namaPerusahaan'] as String,
  noTelp: json['noTelp'] as String,
  noWA: json['noWA'] as String,
  alamatEmail: json['alamatEmail'] as String,
  staff: (json['staff'] as num).toInt(),
  alamatLoc: json['alamatLoc'] as String,
  alamatLongtitude: json['alamatLongtitude'] as String,
  alamatLatitude: json['alamatLatitude'] as String,
  totalLike: (json['totalLike'] as num).toInt(),
  keterangan: json['keterangan'] as String,
);

Map<String, dynamic> _$RegisterCompanyRequestToJson(
  RegisterCompanyRequest instance,
) => <String, dynamic>{
  'namaPerusahaan': instance.namaPerusahaan,
  'noTelp': instance.noTelp,
  'noWA': instance.noWA,
  'alamatEmail': instance.alamatEmail,
  'staff': instance.staff,
  'alamatLoc': instance.alamatLoc,
  'alamatLongtitude': instance.alamatLongtitude,
  'alamatLatitude': instance.alamatLatitude,
  'totalLike': instance.totalLike,
  'keterangan': instance.keterangan,
};
