import 'package:json_annotation/json_annotation.dart';

part 'register_company_request.g.dart';

@JsonSerializable()
class RegisterCompanyRequest {
  final String namaPerusahaan;
  final String noTelp;
  final String noWA;
  final String alamatEmail;
  final int staff;
  final String alamatLoc;
  final String alamatLongtitude;
  final String alamatLatitude;
  final int totalLike;
  final String keterangan;

  RegisterCompanyRequest({
    required this.namaPerusahaan,
    required this.noTelp,
    required this.noWA,
    required this.alamatEmail,
    required this.staff,
    required this.alamatLoc,
    required this.alamatLongtitude,
    required this.alamatLatitude,
    required this.totalLike,
    required this.keterangan,
  });

  factory RegisterCompanyRequest.fromJson(Map<String, dynamic> json) => _$RegisterCompanyRequestFromJson(json);

  Map<String, dynamic> toJson() => _$RegisterCompanyRequestToJson(this);
}
