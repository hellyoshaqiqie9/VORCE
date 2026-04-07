// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'absence.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Absence _$AbsenceFromJson(Map<String, dynamic> json) => _Absence(
  id: _stringFromAny(json['id']),
  idKaryawan: json['idKaryawan'] as String?,
  namaKaryawan: json['namaKaryawan'] as String?,
  tanggal: const FirestoreDateTimeConverter().fromJson(json['tanggal']),
  waktuCheckIn: const FirestoreDateTimeConverter().fromJson(
    json['waktuCheckIn'],
  ),
  waktuCheckOut: const FirestoreDateTimeConverter().fromJson(
    json['waktuCheckOut'],
  ),
  bluetoothID: json['bluetoothID'] as String?,
  alamatLongtitude: json['alamatLongtitude'] as String?,
  alamatLatitude: json['alamatLatitude'] as String?,
  alamatLoc: json['alamatLoc'] as String?,
  telat: json['telat'],
  foto: json['foto'] as String?,
  fotoKaryawan: json['fotoKaryawan'] as String?,
  idPerusahaan: json['idPerusahaan'] as String?,
  namaperusahaan: json['namaperusahaan'] as String?,
  tanggalAbsensi: const FirestoreDateTimeConverter().fromJson(
    json['tanggalAbsensi'],
  ),
  fotoPulang: json['fotoPulang'] as String?,
  latitudePulang: json['latitudePulang'] as String?,
  longtitudePulang: json['longtitudePulang'] as String?,
  durasi: json['durasi'] as String?,
  alamatPulang: json['alamatPulang'] as String?,
  fotoIsitrahatIn: json['fotoIsitrahatIn'] as String?,
  fotoIstirahatOut: json['fotoIstirahatOut'] as String?,
  istirahatIn: const FirestoreDateTimeConverter().fromJson(json['istirahatIn']),
  istirahatOut: const FirestoreDateTimeConverter().fromJson(
    json['istirahatOut'],
  ),
  latistirahatin: json['latistirahatin'] as String?,
  longistirahatin: json['longistirahatin'] as String?,
  alamatistirahatin: json['alamatistirahatin'] as String?,
  latistirahatout: json['latistirahatout'] as String?,
  longistirahatout: json['longistirahatout'] as String?,
  alamatistirahatout: json['alamatistirahatout'] as String?,
  status: json['status'] as String?,
  shift: json['shift'] as String?,
  email: json['email'] as String?,
  alamatEmail: json['alamatEmail'] as String?,
);

Map<String, dynamic> _$AbsenceToJson(_Absence instance) => <String, dynamic>{
  'id': instance.id,
  'idKaryawan': instance.idKaryawan,
  'namaKaryawan': instance.namaKaryawan,
  'tanggal': const FirestoreDateTimeConverter().toJson(instance.tanggal),
  'waktuCheckIn': const FirestoreDateTimeConverter().toJson(
    instance.waktuCheckIn,
  ),
  'waktuCheckOut': const FirestoreDateTimeConverter().toJson(
    instance.waktuCheckOut,
  ),
  'bluetoothID': instance.bluetoothID,
  'alamatLongtitude': instance.alamatLongtitude,
  'alamatLatitude': instance.alamatLatitude,
  'alamatLoc': instance.alamatLoc,
  'telat': instance.telat,
  'foto': instance.foto,
  'fotoKaryawan': instance.fotoKaryawan,
  'idPerusahaan': instance.idPerusahaan,
  'namaperusahaan': instance.namaperusahaan,
  'tanggalAbsensi': const FirestoreDateTimeConverter().toJson(
    instance.tanggalAbsensi,
  ),
  'fotoPulang': instance.fotoPulang,
  'latitudePulang': instance.latitudePulang,
  'longtitudePulang': instance.longtitudePulang,
  'durasi': instance.durasi,
  'alamatPulang': instance.alamatPulang,
  'fotoIsitrahatIn': instance.fotoIsitrahatIn,
  'fotoIstirahatOut': instance.fotoIstirahatOut,
  'istirahatIn': const FirestoreDateTimeConverter().toJson(
    instance.istirahatIn,
  ),
  'istirahatOut': const FirestoreDateTimeConverter().toJson(
    instance.istirahatOut,
  ),
  'latistirahatin': instance.latistirahatin,
  'longistirahatin': instance.longistirahatin,
  'alamatistirahatin': instance.alamatistirahatin,
  'latistirahatout': instance.latistirahatout,
  'longistirahatout': instance.longistirahatout,
  'alamatistirahatout': instance.alamatistirahatout,
  'status': instance.status,
  'shift': instance.shift,
  'email': instance.email,
  'alamatEmail': instance.alamatEmail,
};
