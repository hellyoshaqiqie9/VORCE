// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'banner_image.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_BannerImage _$BannerImageFromJson(Map<String, dynamic> json) => _BannerImage(
  id: (json['id'] as num).toInt(),
  namaPerusahaan: json['namaPerusahaan'] as String,
  idperusahaan: json['idperusahaan'] as String,
  status: json['status'] as String,
  harga: (json['harga'] as num).toInt(),
  totalHarga: (json['totalHarga'] as num).toInt(),
  tanggalBayar: DateTime.parse(json['tanggalBayar'] as String),
  tanggalStart: DateTime.parse(json['tanggalStart'] as String),
  tanggalAkhir: DateTime.parse(json['tanggalAkhir'] as String),
  foto1: json['foto1'],
  foto2: json['foto2'],
  foto3: json['foto3'],
  gambar1: json['gambar1'] as String,
  gambar2: json['gambar2'] as String,
  gambar3: json['gambar3'] as String,
  buktiBayar: json['buktiBayar'] as String,
);

Map<String, dynamic> _$BannerImageToJson(_BannerImage instance) =>
    <String, dynamic>{
      'id': instance.id,
      'namaPerusahaan': instance.namaPerusahaan,
      'idperusahaan': instance.idperusahaan,
      'status': instance.status,
      'harga': instance.harga,
      'totalHarga': instance.totalHarga,
      'tanggalBayar': instance.tanggalBayar.toIso8601String(),
      'tanggalStart': instance.tanggalStart.toIso8601String(),
      'tanggalAkhir': instance.tanggalAkhir.toIso8601String(),
      'foto1': instance.foto1,
      'foto2': instance.foto2,
      'foto3': instance.foto3,
      'gambar1': instance.gambar1,
      'gambar2': instance.gambar2,
      'gambar3': instance.gambar3,
      'buktiBayar': instance.buktiBayar,
    };
