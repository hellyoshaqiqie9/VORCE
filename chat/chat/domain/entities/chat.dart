import 'package:apppro/feature/auth/domain/entities/user.dart';
import 'dart:convert';

class ChatModel {
  int id;
  int? userId;
  UserModel? user;
  ChatContent? content;
  DateTime? createdAt;
  String? errorMsg;

  ChatModel({
    required this.id,
    required this.userId,
    required this.user,
    required this.content,
    required this.createdAt,
    this.errorMsg,
  });

  factory ChatModel.fromRawJson(String str) => ChatModel.fromJson(json.decode(str));

  String toRawJson() => json.encode(toJson());

  factory ChatModel.fromJson(Map<String, dynamic> json) => ChatModel(
        id: json["id"],
        userId: json["user_id"],
        user: UserModel.fromJson(json["user"]),
        content: ChatContent.fromJson(json["content"]),
        createdAt: DateTime.parse(json["created_at"]),
      );

  Map<String, dynamic> toJson() => {
        "id": id,
        "user_id": userId,
        "user": user?.toJson(),
        "content": content?.toJson(),
        "created_at": createdAt?.toIso8601String(),
      };
}

class ChatContent {
  String text;
  String? imageUrl;

  ChatContent({
    required this.text,
    this.imageUrl,
  });

  factory ChatContent.fromRawJson(String str) => ChatContent.fromJson(json.decode(str));

  String toRawJson() => json.encode(toJson());

  factory ChatContent.fromJson(Map<String, dynamic> json) => ChatContent(
        text: json["text"],
        imageUrl: json["image_url"],
      );

  Map<String, dynamic> toJson() => {
        "text": text,
        "image_url": imageUrl,
      };
}
