import 'package:freezed_annotation/freezed_annotation.dart';

part 'company.freezed.dart';
part 'company.g.dart';

@freezed
abstract class Company with _$Company {
  const factory Company({
    @Default('HORA-001') @JsonKey(name: 'idperusahaan') String id,
    @Default('PT HORA') @JsonKey(name: 'namaPerusahaan') String name,
    @JsonKey(name: 'logoPerusahaan') String? logo,
    @Default('Jl. Budiluhur No.47 Medan, Indonesia') @JsonKey(name: 'alamatLoc') String alamat,
    String? keterangan,
    @Default('98.6388869') @JsonKey(name: 'alamatLongtitude') String longitude,
    @Default('3.5955809') @JsonKey(name: 'alamatLatitude') String latitude,
    @Default(0) @JsonKey(name: 'totalLike') int like,

    // --- UPDATED: Mapping 'total' dari JSON ke totalEmployee ---
    @Default(0) @JsonKey(name: 'total') int totalEmployee,

    // --- NEW: Field untuk Total Storage (dalam MB) ---
    // Pastikan API/Firebase mengirim field 'totalStorage' atau Anda hitung manual di datasource
    @Default(0.0) @JsonKey(name: 'totalStorage') double totalStorage,

    @JsonKey(name: 'status') String? status,
    @JsonKey(name: 'noTelp') String? noTelp,
    @JsonKey(name: 'noWA') String? noWA,
  }) = _Company;

  factory Company.fromJson(Map<String, dynamic> json) => _$CompanyFromJson(json);

  @override
  Map<String, dynamic> toJson() => {
    'idperusahaan': id,
    'namaPerusahaan': name,
    'logoPerusahaan': logo,
    'alamatLoc': alamat,
    'keterangan': keterangan,
    'alamatLongtitude': longitude,
    'alamatLatitude': latitude,
    'totalLike': like,
    'total': totalEmployee,
    'totalStorage': totalStorage, // Sertakan di toJson
    'status': status,
    'noTelp': noTelp,
    'noWA': noWA,
  };
}