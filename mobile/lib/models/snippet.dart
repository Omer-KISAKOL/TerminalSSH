class Snippet {
  const Snippet({
    required this.id,
    required this.name,
    required this.content,
    required this.sortOrder,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String name;
  final String content;
  final int sortOrder;
  final String createdAt;
  final String updatedAt;

  factory Snippet.fromJson(Map<String, dynamic> json) {
    return Snippet(
      id: json['id'] as String,
      name: json['name'] as String,
      content: json['content'] as String,
      sortOrder: json['sortOrder'] as int? ?? 0,
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }
}
