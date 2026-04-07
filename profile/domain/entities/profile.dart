import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:apppro/core/utils/helper/fullpath_image_converter.dart';

part 'profile.freezed.dart';
part 'profile.g.dart';

@freezed
abstract class Profile with _$Profile {
  const factory Profile({
    int? id,
    @JsonKey(name: 'namaKaryawan') required String name,
    @Default('no') @JsonKey(name: 'liked') String liked,
    @JsonKey(name: 'alamatEmail') required String email,
    @JsonKey(name: 'noHP') String? phone,
    @JsonKey(name: 'namaPerusahaan') String? perusahaan,
    @JsonKey(name: 'idperusahaan') String? perusahaanId,
    @JsonKey(name: 'alamatLongtitude') String? longitude,
    @JsonKey(name: 'alamatLatitude') String? latitude,
    @JsonKey(name: 'alamatLoc') String? address,
    @FullPathOptionalImageConverter()
    @Default('https://api.horaapp.id/images/companylogo/horawatermark.png')
    @JsonKey(name: 'foto')
    String photo,
    @JsonKey(name: 'joinDate') String? joinDate,
    @JsonKey(name: 'status') String? status,
    @JsonKey(name: 'fcmToken') String? fcmToken,
    @JsonKey(name: 'idkaryawan') String? idkaryawan,
    @JsonKey(name: 'gender') String? gender,
    @JsonKey(name: 'jabatan') String? jabatan
  }) = _Profile;
  factory Profile.fromJson(Map<String, dynamic> json) =>
      _$ProfileFromJson(json);
}