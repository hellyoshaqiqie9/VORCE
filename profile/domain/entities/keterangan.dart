import 'package:freezed_annotation/freezed_annotation.dart';

part 'keterangan.freezed.dart';
part 'keterangan.g.dart';

@freezed
abstract class Keterangan with _$Keterangan {
  const factory Keterangan({
    @JsonKey(name: 'NamaPerusahaan') required String namaPerusahaan,
    @JsonKey(name: 'Keterangan') required String keterangan,
  }) = _Keterangan;

  factory Keterangan.fromJson(Map<String, dynamic> json) =>
      _$KeteranganFromJson(json);
}
