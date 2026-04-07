// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'invitation.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Invitation _$InvitationFromJson(Map<String, dynamic> json) => _Invitation(
  receiver: json['receiver'] as String,
  sender: json['sender'] as String,
  idPerusahaan: json['idperusahaan'] as String,
  namaPerusahaan: json['namaPerusahaan'] as String,
);

Map<String, dynamic> _$InvitationToJson(_Invitation instance) =>
    <String, dynamic>{
      'receiver': instance.receiver,
      'sender': instance.sender,
      'idperusahaan': instance.idPerusahaan,
      'namaPerusahaan': instance.namaPerusahaan,
    };
