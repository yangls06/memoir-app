import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // 根据环境修改 baseUrl
  static const String baseUrl = 'http://localhost:3000/api';
  // 生产环境: 'https://your-api-domain.com/api'

  static Future<dynamic> getTopics() async {
    final response = await http.get(Uri.parse('$baseUrl/topics'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load topics');
  }

  static Future<dynamic> getQuestions(String topicId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/topics/$topicId/questions'),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load questions');
  }

  static Future<dynamic> getFollowUp(String answer) async {
    final response = await http.post(
      Uri.parse('$baseUrl/followup'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'answer': answer}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to get follow-up');
  }

  static Future<dynamic> createMemoir(String userId, String title) async {
    final response = await http.post(
      Uri.parse('$baseUrl/memoirs'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'user_id': userId, 'title': title}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to create memoir');
  }

  static Future<dynamic> createChapter(int memoirId, String topic) async {
    final response = await http.post(
      Uri.parse('$baseUrl/memoirs/$memoirId/chapters'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'topic': topic}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to create chapter');
  }
}
