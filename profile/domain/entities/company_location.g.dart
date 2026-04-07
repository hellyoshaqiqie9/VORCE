// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'company_location.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_CompanyLocation _$CompanyLocationFromJson(Map<String, dynamic> json) =>
    _CompanyLocation(
      namaPerusahaan: json['NamaPerusahaan'] as String,
      latitude: json['AlamatLatitude'] as String,
      longitude: json['AlamatLongtitude'] as String,
      address: json['AlamatLoc'] as String,
    );

Map<String, dynamic> _$CompanyLocationToJson(_CompanyLocation instance) =>
    <String, dynamic>{
      'NamaPerusahaan': instance.namaPerusahaan,
      'AlamatLatitude': instance.latitude,
      'AlamatLongtitude': instance.longitude,
      'AlamatLoc': instance.address,
    };
