// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'company.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Company _$CompanyFromJson(Map<String, dynamic> json) => _Company(
  id: json['idperusahaan'] as String? ?? 'HORA-001',
  name: json['namaPerusahaan'] as String? ?? 'PT HORA',
  logo: json['logoPerusahaan'] as String?,
  alamat:
      json['alamatLoc'] as String? ?? 'Jl. Budiluhur No.47 Medan, Indonesia',
  keterangan: json['keterangan'] as String?,
  longitude: json['alamatLongtitude'] as String? ?? '98.6388869',
  latitude: json['alamatLatitude'] as String? ?? '3.5955809',
  like: (json['totalLike'] as num?)?.toInt() ?? 0,
  totalEmployee: (json['total'] as num?)?.toInt() ?? 0,
  totalStorage: (json['totalStorage'] as num?)?.toDouble() ?? 0.0,
  status: json['status'] as String?,
  noTelp: json['noTelp'] as String?,
  noWA: json['noWA'] as String?,
);

Map<String, dynamic> _$CompanyToJson(_Company instance) => <String, dynamic>{
  'idperusahaan': instance.id,
  'namaPerusahaan': instance.name,
  'logoPerusahaan': instance.logo,
  'alamatLoc': instance.alamat,
  'keterangan': instance.keterangan,
  'alamatLongtitude': instance.longitude,
  'alamatLatitude': instance.latitude,
  'totalLike': instance.like,
  'total': instance.totalEmployee,
  'totalStorage': instance.totalStorage,
  'status': instance.status,
  'noTelp': instance.noTelp,
  'noWA': instance.noWA,
};
