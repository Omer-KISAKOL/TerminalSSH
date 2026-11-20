class SecurityQuestion {
  const SecurityQuestion(this.id, this.label);

  final String id;
  final String label;
}

const securityQuestions = <SecurityQuestion>[
  SecurityQuestion('childhood-friend', 'İlk çocukluk arkadaşınızın adı nedir?'),
  SecurityQuestion('mother-maiden', 'Annenizin kızlık soyadı nedir?'),
  SecurityQuestion('first-pet', 'İlk evcil hayvanınızın adı nedir?'),
  SecurityQuestion('birth-city', 'Doğduğunuz şehir neresidir?'),
  SecurityQuestion('favorite-teacher', 'En sevdiğiniz öğretmeninizin adı nedir?'),
];

String securityQuestionLabel(String id) {
  for (final question in securityQuestions) {
    if (question.id == id) return question.label;
  }
  return id;
}
