class CompanyMember {
  final String email;
  final String username;
  final String photoURL;
  final String noTelp;
  final String noWA;
  final String role;
  final String status;
  final String joinedAt;
  final bool isMe;

  CompanyMember({
    required this.email,
    required this.username,
    required this.photoURL,
    required this.noTelp,
    required this.noWA,
    required this.role,
    required this.status,
    required this.joinedAt,
    required this.isMe,
  });

  factory CompanyMember.fromJson(Map<String, dynamic> json) {
    return CompanyMember(
      email: json['email'] ?? '',
      username: json['username'] ?? '',
      photoURL: json['photoURL'] ?? '',
      noTelp: json['noTelp'] ?? '',
      noWA: json['noWA'] ?? '',
      role: json['role'] ?? '',
      status: json['status'] ?? '',
      joinedAt: json['joinedAt'] ?? '',
      isMe: json['isMe'] ?? false,
    );
  }
}