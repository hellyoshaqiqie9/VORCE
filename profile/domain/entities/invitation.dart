import 'package:freezed_annotation/freezed_annotation.dart';

part 'invitation.freezed.dart';
part 'invitation.g.dart';

/// receiver : email of the person receiving the invitation
/// sender : email of the person sending the invitation
/// idPerusahaan : company ID of the sender
/// namaPerusahaan : name of the company of the sender
@freezed
abstract class Invitation with _$Invitation {
  const factory Invitation({
    required String receiver,
    required String sender,
    @JsonKey(name: 'idperusahaan') required String idPerusahaan,
    required String namaPerusahaan,
  }) = _Invitation;

  factory Invitation.fromJson(Map<String, dynamic> json) =>
      _$InvitationFromJson(json);

  @override
  Map<String, dynamic> toJson() => {
        'receiver': receiver,
        'sender': sender,
        'idperusahaan': idPerusahaan,
        'namaPerusahaan': namaPerusahaan,
      };
}
