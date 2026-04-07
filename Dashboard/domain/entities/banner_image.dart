import 'package:freezed_annotation/freezed_annotation.dart';

part 'banner_image.freezed.dart';
part 'banner_image.g.dart';  // Add this part directive for the generated JSON code


@freezed
abstract class BannerImage with _$BannerImage {
    const factory BannerImage({
        @JsonKey(name: "id")
        required int id,
        @JsonKey(name: "namaPerusahaan")
        required String namaPerusahaan,
        @JsonKey(name: "idperusahaan")
        required String idperusahaan,
        @JsonKey(name: "status")
        required String status,
        @JsonKey(name: "harga")
        required int harga,
        @JsonKey(name: "totalHarga")
        required int totalHarga,
        @JsonKey(name: "tanggalBayar")
        required DateTime tanggalBayar,
        @JsonKey(name: "tanggalStart")
        required DateTime tanggalStart,
        @JsonKey(name: "tanggalAkhir")
        required DateTime tanggalAkhir,
        @JsonKey(name: "foto1")
        required dynamic foto1,
        @JsonKey(name: "foto2")
        required dynamic foto2,
        @JsonKey(name: "foto3")
        required dynamic foto3,
        @JsonKey(name: "gambar1")
        required String gambar1,
        @JsonKey(name: "gambar2")
        required String gambar2,
        @JsonKey(name: "gambar3")
        required String gambar3,
        @JsonKey(name: "buktiBayar")
        required String buktiBayar,
    }) = _BannerImage;
    factory BannerImage.fromJson(Map<String, dynamic> json) => _$BannerImageFromJson(json);
}
