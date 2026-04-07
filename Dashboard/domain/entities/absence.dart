// To parse this JSON data, do
//
//     final absence = absenceFromMap(jsonString);
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

part 'absence.freezed.dart';
part 'absence.g.dart';

// --- CONVERTER KHUSUS (Agar Anti-Error) ---

// 1. Converter: Apapun datanya (Int/String), ubah jadi String
String? _stringFromAny(dynamic value) {
  if (value == null) return null;
  return value.toString();
}

// 2. Converter: Handle Tanggal format ISO String ATAU Firestore Timestamp
class FirestoreDateTimeConverter implements JsonConverter<DateTime?, dynamic> {
  const FirestoreDateTimeConverter();

  @override
  DateTime? fromJson(dynamic json) {
    if (json == null) return null;
    // Jika format String biasa (ISO 8601)
    if (json is String) return DateTime.tryParse(json);
    // Jika format Firestore {_seconds: 123, ...}
    if (json is Map && json.containsKey('_seconds')) {
      final seconds = json['_seconds'];
      if (seconds is int) {
        return DateTime.fromMillisecondsSinceEpoch(seconds * 1000);
      }
    }
    return null;
  }

  @override
  dynamic toJson(DateTime? object) => object?.toIso8601String();
}

@freezed
abstract class Absence with _$Absence {
  const Absence._();

  const factory Absence({
    // PERUBAHAN PENTING: ID sekarang String dan menggunakan converter aman
    @JsonKey(fromJson: _stringFromAny) String? id,

    String? idKaryawan,
    String? namaKaryawan,

    @FirestoreDateTimeConverter() DateTime? tanggal,
    @FirestoreDateTimeConverter() DateTime? waktuCheckIn,
    @FirestoreDateTimeConverter() DateTime? waktuCheckOut,

    String? bluetoothID,
    String? alamatLongtitude,
    String? alamatLatitude,
    String? alamatLoc,
    dynamic telat,
    String? foto,
    String? fotoKaryawan,
    String? idPerusahaan,
    String? namaperusahaan,

    @FirestoreDateTimeConverter() DateTime? tanggalAbsensi,

    String? fotoPulang,
    String? latitudePulang,
    String? longtitudePulang,
    String? durasi,
    String? alamatPulang,
    String? fotoIsitrahatIn,
    String? fotoIstirahatOut,

    @FirestoreDateTimeConverter() DateTime? istirahatIn,
    @FirestoreDateTimeConverter() DateTime? istirahatOut,

    String? latistirahatin,
    String? longistirahatin,
    String? alamatistirahatin,
    String? latistirahatout,
    String? longistirahatout,
    String? alamatistirahatout,
    String? status,

    // --- FIELD BARU ---
    String? shift,

    // --- TAMBAHAN UNTUK FILTERING (INJEKSI DARI FIRESTORE) ---
    String? email,
    String? alamatEmail,
  }) = _Absence;

  factory Absence.fromJson(Map<String, dynamic> json) => _$AbsenceFromJson(json);

  bool get isCheckIn => waktuCheckIn != null;

  bool get isCheckOut => waktuCheckOut != null;

  // Helper Lokasi CheckIn
  LatLng? get checkInLocation {
    if (alamatLatitude != null && alamatLongtitude != null) {
      final lat = double.tryParse(alamatLatitude!);
      final lng = double.tryParse(alamatLongtitude!);
      if (lat != null && lng != null) {
        return LatLng(lat, lng);
      }
    }
    return null;
  }

  // Helper Lokasi CheckOut
  LatLng? get checkOutLocation {
    if (latitudePulang != null && longtitudePulang != null) {
      final lat = double.tryParse(latitudePulang!);
      final lng = double.tryParse(longtitudePulang!);
      if (lat != null && lng != null) {
        return LatLng(lat, lng);
      }
    }
    return null;
  }

  // Helper Lokasi Istirahat Masuk
  LatLng? get restInLocation {
    if (latistirahatin != null && longistirahatin != null) {
      final lat = double.tryParse(latistirahatin!);
      final lng = double.tryParse(longistirahatin!);
      if (lat != null && lng != null) {
        return LatLng(lat, lng);
      }
    }
    return null;
  }

  // Helper Lokasi Istirahat Keluar
  LatLng? get restOutLocation {
    if (latistirahatout != null && longistirahatout != null) {
      final lat = double.tryParse(latistirahatout!);
      final lng = double.tryParse(longistirahatout!);
      if (lat != null && lng != null) {
        return LatLng(lat, lng);
      }
    }
    return null;
  }
}