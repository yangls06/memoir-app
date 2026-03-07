import 'package:flutter/material.dart';
import '../services/api_service.dart';

class TopicsScreen extends StatefulWidget {
  const TopicsScreen({super.key});

  @override
  State<TopicsScreen> createState() => _TopicsScreenState();
}

class _TopicsScreenState extends State<TopicsScreen> {
  List<dynamic> topics = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadTopics();
  }

  Future<void> _loadTopics() async {
    try {
      final data = await ApiService.getTopics();
      setState(() {
        topics = data['topics'];
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      // 使用默认数据
      topics = [
        { 'id': 'childhood', 'emoji': '👶', 'title': '童年时光', 'subtitle': '说说您小时候的故事' },
        { 'id': 'youth', 'emoji': '💑', 'title': '青春岁月', 'subtitle': '关于爱情、学习和梦想' },
        { 'id': 'career', 'emoji': '💼', 'title': '工作经历', 'subtitle': '职业生涯的高光时刻' },
        { 'id': 'family', 'emoji': '👨‍👩‍👧', 'title': '家庭生活', 'subtitle': '结婚、育儿、家庭温馨' },
        { 'id': 'wisdom', 'emoji': '🌟', 'title': '人生感悟', 'subtitle': '想对晚辈说的话' },
      ];
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('选择一个主题'),
        backgroundColor: const Color(0xFFFFF8F0),
        foregroundColor: const Color(0xFF2D3436),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.volume_up),
            onPressed: () {
              // TODO: 朗读说明
            },
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: topics.length,
              itemBuilder: (context, index) {
                final topic = topics[index];
                return _buildTopicCard(topic);
              },
            ),
    );
  }

  Widget _buildTopicCard(dynamic topic) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: InkWell(
        onTap: () => Navigator.pushNamed(
          context, 
          '/record',
          arguments: topic,
        ),
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Row(
            children: [
              Text(
                topic['emoji'],
                style: const TextStyle(fontSize: 48),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      topic['title'],
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2D3436),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      topic['subtitle'],
                      style: const TextStyle(
                        fontSize: 18,
                        color: Color(0xFF636E72),
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.arrow_forward_ios,
                color: Color(0xFF6A994E),
                size: 28,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
