import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'http://localhost:3000/api';

  // 获取主题列表
  static Future<dynamic> getTopics() async {
    final response = await http.get(Uri.parse('$baseUrl/topics'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load topics');
  }

  // 获取主题问题
  static Future<dynamic> getQuestions(String topicId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/topics/$topicId/questions'),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load questions');
  }

  // 语音识别
  static Future<dynamic> speechToText(String audioPath) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/speech-to-text'),
    );
    request.files.add(await http.MultipartFile.fromPath('audio', audioPath));
    
    final response = await request.send();
    final responseData = await response.stream.bytesToString();
    
    if (response.statusCode == 200) {
      return jsonDecode(responseData);
    }
    throw Exception('Speech to text failed');
  }

  // 语音合成
  static Future<dynamic> textToSpeech(String text) async {
    final response = await http.post(
      Uri.parse('$baseUrl/text-to-speech'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'text': text}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return {'audioUrl': null};
  }

  // 获取AI追问
  static Future<dynamic> getFollowUp(String answer, String topic, String question) async {
    final response = await http.post(
      Uri.parse('$baseUrl/followup'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'answer': answer,
        'topic': topic,
        'question': question,
      }),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to get follow-up');
  }

  // AI润色
  static Future<dynamic> polishText(String text) async {
    final response = await http.post(
      Uri.parse('$baseUrl/polish'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'text': text}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to polish text');
  }

  // 获取风格列表
  static Future<dynamic> getStyles() async {
    final response = await http.get(Uri.parse('$baseUrl/styles'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load styles');
  }

  // 风格改写
  static Future<dynamic> rewriteWithStyle(String text, String style) async {
    final response = await http.post(
      Uri.parse('$baseUrl/rewrite'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'text': text, 'style': style}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to rewrite');
  }

  // 生成回忆录
  static Future<dynamic> generateMemoir(int memoirId, String style) async {
    final response = await http.post(
      Uri.parse('$baseUrl/memoirs/$memoirId/generate'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'style': style}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to generate memoir');
  }

  // 获取时间线
  static Future<dynamic> getTimeline(int memoirId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/memoirs/$memoirId/timeline'),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load timeline');
  }

  // 创建回忆录
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

  // 创建章节
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
