import 'package:freezed_annotation/freezed_annotation.dart';

part 'company_location.freezed.dart';
part 'company_location.g.dart';

@freezed
abstract class CompanyLocation with _$CompanyLocation {
  const factory CompanyLocation({
    @JsonKey(name: 'NamaPerusahaan') required String namaPerusahaan,
    @JsonKey(name: 'AlamatLatitude') required String latitude,
    @JsonKey(name: 'AlamatLongtitude') required String longitude,
    @JsonKey(name: 'AlamatLoc') required String address,
  }) = _CompanyLocation;

  factory CompanyLocation.fromJson(Map<String, dynamic> json) =>
      _$CompanyLocationFromJson(json);
}
