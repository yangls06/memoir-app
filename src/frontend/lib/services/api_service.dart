import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class ApiService {
  // 根据环境修改 baseUrl
  static const String baseUrl = 'http://localhost:3000/api';
  // 生产环境: 'https://your-api-domain.com/api'
  // 安卓模拟器: 'http://10.0.2.2:3000/api'

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
    
    request.files.add(
      await http.MultipartFile.fromPath('audio', audioPath),
    );
    
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
    // TTS失败不抛异常，静默处理
    return {'audio_url': null};
  }

  // 获取AI追问
  static Future<dynamic> getFollowUp(
    String answer,
    String topic,
    String question,
  ) async {
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

  // 获取时间线
  static Future<dynamic> getTimeline(int memoirId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/memoirs/$memoirId/timeline'),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to get timeline');
  }
}
