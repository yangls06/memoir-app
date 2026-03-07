import 'package:flutter/material.dart';
import 'dart:async';
import '../services/audio_service.dart';
import '../services/api_service.dart';

class RecordScreen extends StatefulWidget {
  const RecordScreen({super.key});

  @override
  State<RecordScreen> createState() => _RecordScreenState();
}

class _RecordScreenState extends State<RecordScreen> {
  final AudioService _audioService = AudioService();
  
  bool isRecording = false;
  bool isPlaying = false;
  String currentQuestion = '';
  String transcribedText = '';
  List<String> followUpQuestions = [];
  int questionIndex = 0;
  
  List<String> questions = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _initAudio();
  }

  Future<void> _initAudio() async {
    await _audioService.init();
    
    // 获取问题列表
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final topic = ModalRoute.of(context)?.settings.arguments as Map?;
      if (topic != null) {
        _loadQuestions(topic['id']);
      }
    });
  }

  Future<void> _loadQuestions(String topicId) async {
    try {
      final data = await ApiService.getQuestions(topicId);
      setState(() {
        questions = List<String>.from(data['questions']);
        currentQuestion = questions.first;
        isLoading = false;
      });
      // 自动朗读问题
      _speakQuestion();
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  Future<void> _speakQuestion() async {
    // TODO: 调用TTS服务朗读问题
    setState(() => isPlaying = true);
    await Future.delayed(const Duration(seconds: 2));
    setState(() => isPlaying = false);
  }

  Future<void> _toggleRecording() async {
    if (isRecording) {
      // 停止录音
      final path = await _audioService.stopRecording();
      setState(() => isRecording = false);
      
      if (path != null) {
        // 模拟语音转文字
        setState(() {
          transcribedText = "（这里会显示语音识别结果...）";
        });
        
        // 获取追问问题
        _getFollowUpQuestions();
      }
    } else {
      // 开始录音
      final hasPermission = await _audioService.requestPermission();
      if (hasPermission) {
        await _audioService.startRecording();
        setState(() => isRecording = true);
      }
    }
  }

  Future<void> _getFollowUpQuestions() async {
    try {
      final data = await ApiService.getFollowUp(transcribedText);
      setState(() {
        followUpQuestions = List<String>.from(data['questions']);
      });
    } catch (e) {
      // 使用默认追问
      followUpQuestions = ["那是哪一年呢？", "当时心情怎么样？"];
    }
  }

  void _nextQuestion() {
    if (questionIndex < questions.length - 1) {
      setState(() {
        questionIndex++;
        currentQuestion = questions[questionIndex];
        transcribedText = '';
        followUpQuestions = [];
      });
      _speakQuestion();
    } else {
      // 完成所有问题
      _showCompletionDialog();
    }
  }

  void _showCompletionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('🎉 完成一个章节'),
        content: const Text('太棒了！您完成了这个主题的回忆记录。'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('返回首页'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final topic = ModalRoute.of(context)?.settings.arguments as Map?;
    
    return Scaffold(
      appBar: AppBar(
        title: Text(topic?['title'] ?? '回忆记录'),
        backgroundColor: const Color(0xFFFFF8F0),
        foregroundColor: const Color(0xFF2D3436),
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(isPlaying ? Icons.stop : Icons.volume_up),
            onPressed: isPlaying ? null : _speakQuestion,
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  // 问题区域
                  Expanded(
                    flex: 2,
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 10,
                            ),
                          ],
                        ),
                        child: Text(
                          currentQuestion,
                          style: const TextStyle(
                            fontSize: 32,
                            height: 1.5,
                            color: Color(0xFF2D3436),
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                  ),
                  
                  // 转录文本
                  if (transcribedText.isNotEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F5E9),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '您的回答：',
                            style: TextStyle(
                              fontSize: 16,
                              color: Color(0xFF6A994E),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            transcribedText,
                            style: const TextStyle(fontSize: 20),
                          ),
                        ],
                      ),
                    ),
                  
                  // 追问问题
                  if (followUpQuestions.isNotEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF3E0),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'AI想多了解一点：',
                            style: TextStyle(
                              fontSize: 16,
                              color: Color(0xFFFF8C42),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          ...followUpQuestions.map((q) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              children: [
                                const Icon(Icons.chat_bubble_outline, 
                                  size: 20, color: Color(0xFFFF8C42)),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(q, style: const TextStyle(fontSize: 18)),
                                ),
                              ],
                            ),
                          )),
                        ],
                      ),
                    ),
                  
                  // 录音按钮
                  GestureDetector(
                    onTap: _toggleRecording,
                    child: Container(
                      width: 140,
                      height: 140,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isRecording ? Colors.red : const Color(0xFFFF8C42),
                        boxShadow: [
                          BoxShadow(
                            color: (isRecording ? Colors.red : const Color(0xFFFF8C42))
                                .withOpacity(0.4),
                            blurRadius: 20,
                            spreadRadius: isRecording ? 10 : 5,
                          ),
                        ],
                      ),
                      child: Icon(
                        isRecording ? Icons.stop : Icons.mic,
                        size: 60,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  Text(
                    isRecording ? '点击停止' : '按住说话',
                    style: const TextStyle(
                      fontSize: 20,
                      color: Color(0xFF636E72),
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // 下一步按钮
                  if (transcribedText.isNotEmpty)
                    SizedBox(
                      width: double.infinity,
                      height: 60,
                      child: ElevatedButton.icon(
                        onPressed: _nextQuestion,
                        icon: const Icon(Icons.arrow_forward),
                        label: const Text('下一题'),
                      ),
                    ),
                ],
              ),
            ),
    );
  }

  @override
  void dispose() {
    _audioService.dispose();
    super.dispose();
  }
}
