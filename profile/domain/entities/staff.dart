import 'package:freezed_annotation/freezed_annotation.dart';

part 'staff.freezed.dart';
part 'staff.g.dart';

@freezed
abstract class Staff with _$Staff {
  const factory Staff({
    required String? namaKaryawan,
    required String? liked,
    required String? alamatEmail,
    required String? noHp,
    required String? namaPerusahaan,
    required String? idperusahaan,
    required String? alamatLongtitude,
    required String? alamatLatitude,
    required String? alamatLoc,
    required String? foto,
    @JsonKey(fromJson: _dateTimeFromIsoString, toJson: _dateTimeToIsoString)
    required DateTime? joinDate,
    required String? status,
    required String? fcmToken,
    required int id,
    required String? idkaryawan,
    required String? gender,
    required String? jabatan,
  }) = _Staff;

  factory Staff.fromJson(Map<String, dynamic> json) =>
      _$StaffFromJson(json);
}

// Helper functions to parse DateTime from ISO string and back
DateTime _dateTimeFromIsoString(String? date) =>
    date != null ? DateTime.parse(date) : DateTime.now();
String _dateTimeToIsoString(DateTime? date) => date?.toIso8601String() ?? '';
