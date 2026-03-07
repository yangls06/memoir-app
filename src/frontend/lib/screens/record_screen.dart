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
  bool isLoading = false;
  
  String currentQuestion = '';
  String transcribedText = '';
  String polishedText = '';
  List<dynamic> followUpQuestions = [];
  int questionIndex = 0;
  
  List<String> questions = [];
  bool isInitializing = true;
  String? topicId;
  String? topicName;

  @override
  void initState() {
    super.initState();
    _initAudio();
  }

  Future<void> _initAudio() async {
    await _audioService.init();
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final topic = ModalRoute.of(context)?.settings.arguments as Map?;
      if (topic != null) {
        setState(() {
          topicId = topic['id'];
          topicName = topic['title'];
        });
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
        isInitializing = false;
      });
      _speakQuestion();
    } catch (e) {
      setState(() => isInitializing = false);
    }
  }

  Future<void> _speakQuestion() async {
    setState(() => isPlaying = true);
    
    // 调用TTS API
    try {
      await ApiService.textToSpeech(currentQuestion);
    } catch (e) {
      // TTS失败则静默
    }
    
    await Future.delayed(const Duration(seconds: 2));
    setState(() => isPlaying = false);
  }

  Future<void> _toggleRecording() async {
    if (isRecording) {
      // 停止录音
      final path = await _audioService.stopRecording();
      setState(() => isRecording = false);
      
      if (path != null) {
        setState(() => isLoading = true);
        
        try {
          // 语音识别
          final sttResult = await ApiService.speechToText(path);
          setState(() {
            transcribedText = sttResult['text'];
          });
          
          // AI润色
          final polishResult = await ApiService.polishText(transcribedText);
          setState(() {
            polishedText = polishResult['polished'];
          });
          
          // 获取AI追问
          final followupResult = await ApiService.getFollowUp(
            transcribedText,
            topicId ?? '',
            currentQuestion,
          );
          setState(() {
            followUpQuestions = followupResult['questions'] ?? [];
          });
          
        } catch (e) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('处理失败: $e')),
          );
        } finally {
          setState(() => isLoading = false);
        }
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

  void _nextQuestion() {
    if (questionIndex < questions.length - 1) {
      setState(() {
        questionIndex++;
        currentQuestion = questions[questionIndex];
        transcribedText = '';
        polishedText = '';
        followUpQuestions = [];
      });
      _speakQuestion();
    } else {
      _showCompletionDialog();
    }
  }

  void _showCompletionDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('🎉 完成一个章节', style: TextStyle(fontSize: 28)),
        content: const Text(
          '太棒了！您完成了这个主题的回忆记录。',
          style: TextStyle(fontSize: 20),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('返回首页', style: TextStyle(fontSize: 20)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: 查看回忆录
            },
            child: const Text('查看记录', style: TextStyle(fontSize: 20)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(topicName ?? '回忆记录', style: const TextStyle(fontSize: 24)),
        backgroundColor: const Color(0xFFFFF8F0),
        foregroundColor: const Color(0xFF2D3436),
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(isPlaying ? Icons.stop : Icons.volume_up, size: 28),
            onPressed: isPlaying ? null : _speakQuestion,
          ),
        ],
      ),
      body: isInitializing
          ? const Center(child: CircularProgressIndicator())
          : isLoading
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 20),
                      Text('AI正在处理...', style: TextStyle(fontSize: 20)),
                    ],
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 进度指示器
                      LinearProgressIndicator(
                        value: (questionIndex + 1) / questions.length,
                        backgroundColor: Colors.grey[300],
                        valueColor: const AlwaysStoppedAnimation(Color(0xFF6A994E)),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '问题 ${questionIndex + 1}/${questions.length}',
                        style: const TextStyle(fontSize: 16, color: Color(0xFF636E72)),
                      ),
                      const SizedBox(height: 24),
                      
                      // 问题区域
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
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
                            fontSize: 28,
                            height: 1.5,
                            color: Color(0xFF2D3436),
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 24),
                      
                      // 原始转录文本
                      if (transcribedText.isNotEmpty)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE8F5E9),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                '🎤 您的原话：',
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Color(0xFF6A994E),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                transcribedText,
                                style: const TextStyle(fontSize: 18),
                              ),
                            ],
                          ),
                        ),
                      
                      const SizedBox(height: 16),
                      
                      // AI润色文本
                      if (polishedText.isNotEmpty)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE3F2FD),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.auto_fix_high, color: Color(0xFF1976D2)),
                                  SizedBox(width: 8),
                                  Text(
                                    'AI润色版：',
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Color(0xFF1976D2),
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                polishedText,
                                style: const TextStyle(fontSize: 18, height: 1.6),
                              ),
                            ],
                          ),
                        ),
                      
                      const SizedBox(height: 16),
                      
                      // AI追问问题
                      if (followUpQuestions.isNotEmpty)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF3E0),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.psychology, color: Color(0xFFFF8C42)),
                                  SizedBox(width: 8),
                                  Text(
                                    'AI想多了解一点：',
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Color(0xFFFF8C42),
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              ...followUpQuestions.asMap().entries.map((entry) {
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: InkWell(
                                    onTap: () {
                                      // 选择追问问题回答
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(
                                            Icons.chat_bubble_outline,
                                            size: 20,
                                            color: Color(0xFFFF8C42),
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              entry.value,
                                              style: const TextStyle(fontSize: 18),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),
                      
                      const SizedBox(height: 32),
                      
                      // 录音按钮
                      Center(
                        child: GestureDetector(
                          onTap: _toggleRecording,
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            width: isRecording ? 160 : 140,
                            height: isRecording ? 160 : 140,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isRecording ? Colors.red : const Color(0xFFFF8C42),
                              boxShadow: [
                                BoxShadow(
                                  color: (isRecording ? Colors.red : const Color(0xFFFF8C42))
                                      .withOpacity(0.4),
                                  blurRadius: isRecording ? 30 : 20,
                                  spreadRadius: isRecording ? 15 : 5,
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
                      ),
                      
                      const SizedBox(height: 16),
                      
                      Center(
                        child: Text(
                          isRecording ? '点击停止录音' : '点击开始录音',
                          style: const TextStyle(
                            fontSize: 20,
                            color: Color(0xFF636E72),
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 24),
                      
                      // 下一步按钮
                      if (transcribedText.isNotEmpty)
                        SizedBox(
                          width: double.infinity,
                          height: 64,
                          child: ElevatedButton.icon(
                            onPressed: _nextQuestion,
                            icon: const Icon(Icons.arrow_forward, size: 28),
                            label: const Text('下一题', style: TextStyle(fontSize: 24)),
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
