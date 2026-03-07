import 'package:flutter/material.dart';
import '../services/api_service.dart';

class TimelineScreen extends StatefulWidget {
  const TimelineScreen({super.key});

  @override
  State<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends State<TimelineScreen> {
  List<dynamic> timeline = [];
  bool isLoading = true;
  int? memoirId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = ModalRoute.of(context)?.settings.arguments as Map?;
      if (args != null) {
        memoirId = args['memoirId'];
        _loadTimeline();
      }
    });
  }

  Future<void> _loadTimeline() async {
    if (memoirId == null) return;

    setState(() => isLoading = true);
    try {
      final data = await ApiService.getTimeline(memoirId!);
      setState(() {
        timeline = data['timeline'] ?? [];
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      // 使用示例数据
      timeline = [
        {'year': 1950, 'event': '出生', 'content': '我出生在一个小山村'},
        {'year': 1968, 'event': '下乡', 'content': '响应号召插队到农村'},
        {'year': 1980, 'event': '回城', 'content': '回城参加高考'},
        {'year': 1985, 'event': '工作', 'content': '进入工厂工作'},
        {'year': 1990, 'event': '结婚', 'content': '和爱人结婚'},
      ];
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('我的人生时间线', style: TextStyle(fontSize: 24)),
        backgroundColor: const Color(0xFFFFF8F0),
        foregroundColor: const Color(0xFF2D3436),
        elevation: 0,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : timeline.isEmpty
              ? const Center(
                  child: Text(
                    '还没有记录时间线\n快去添加回忆吧',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 20, color: Color(0xFF636E72)),
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 标题
                      const Text(
                        '人生大事记',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2D3436),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '共记录 ${timeline.length} 个重要时刻',
                        style: const TextStyle(
                          fontSize: 18,
                          color: Color(0xFF636E72),
                        ),
                      ),
                      const SizedBox(height: 32),

                      // 时间线
                      ...timeline.asMap().entries.map((entry) {
                        final index = entry.key;
                        final event = entry.value;
                        final isLast = index == timeline.length - 1;

                        return _buildTimelineItem(event, isLast);
                      }),

                      const SizedBox(height: 32),

                      // 底部提示
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE8F5E9),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Column(
                          children: [
                            Icon(Icons.info_outline,
                                color: Color(0xFF6A994E), size: 32),
                            SizedBox(height: 12),
                            Text(
                              '时间线会根据您的回答自动提取年份生成',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 18,
                                color: Color(0xFF6A994E),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.pushNamed(context, '/style', arguments: {'memoirId': memoirId});
        },
        icon: const Icon(Icons.auto_stories),
        label: const Text('生成回忆录'),
        backgroundColor: const Color(0xFFFF8C42),
      ),
    );
  }

  Widget _buildTimelineItem(dynamic event, bool isLast) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 时间轴
          Column(
            children: [
              // 节点
              Container(
                width: 24,
                height: 24,
                decoration: const BoxDecoration(
                  color: Color(0xFFFF8C42),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Color(0xFFFF8C42),
                      blurRadius: 8,
                      spreadRadius: 2,
                    ),
                  ],
                ),
              ),
              // 连线
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 4,
                    color: const Color(0xFFFF8C42).withOpacity(0.3),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 20),

          // 内容
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(bottom: 32),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 年份
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF8C42),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${event['year']}年',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // 事件标题
                  Text(
                    event['event'] ?? '重要时刻',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2D3436),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // 内容预览
                  Text(
                    event['content'] ?? '',
                    style: const TextStyle(
                      fontSize: 18,
                      color: Color(0xFF636E72),
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
