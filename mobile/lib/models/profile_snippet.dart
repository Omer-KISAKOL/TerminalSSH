class ProfileSnippet {
  const ProfileSnippet({
    required this.id,
    required this.profileId,
    required this.name,
    required this.content,
    required this.sortOrder,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String profileId;
  final String name;
  final String content;
  final int sortOrder;
  final String createdAt;
  final String updatedAt;

  factory ProfileSnippet.fromJson(Map<String, dynamic> json) {
    return ProfileSnippet(
      id: json['id'] as String,
      profileId: json['profileId'] as String,
      name: json['name'] as String,
      content: json['content'] as String,
      sortOrder: json['sortOrder'] as int? ?? 0,
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }
}
