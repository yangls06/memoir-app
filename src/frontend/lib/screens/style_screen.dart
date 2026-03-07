import 'package:flutter/material.dart';
import '../services/api_service.dart';

class StyleScreen extends StatefulWidget {
  const StyleScreen({super.key});

  @override
  State<StyleScreen> createState() => _StyleScreenState();
}

class _StyleScreenState extends State<StyleScreen> {
  List<dynamic> styles = [];
  String? selectedStyle;
  bool isLoading = false;
  bool isGenerating = false;
  String? generatedText;
  int? memoirId;

  @override
  void initState() {
    super.initState();
    _loadStyles();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = ModalRoute.of(context)?.settings.arguments as Map?;
      if (args != null) {
        setState(() => memoirId = args['memoirId']);
      }
    });
  }

  Future<void> _loadStyles() async {
    try {
      final data = await ApiService.getStyles();
      setState(() {
        styles = data['styles'] ?? [];
      });
    } catch (e) {
      // 使用默认数据
      styles = [
        {'key': 'plain', 'name': '白描版'},
        {'key': 'wang_zengqi', 'name': '汪曾祺风格'},
        {'key': 'zhang_ailing', 'name': '张爱玲风格'},
        {'key': 'yu_hua', 'name': '余华风格'},
        {'key': 'yang_jiang', 'name': '杨绛风格'},
        {'key': 'shi_tiesheng', 'name': '史铁生风格'},
      ];
    }
  }

  Future<void> _generateMemoir() async {
    if (selectedStyle == null || memoirId == null) return;

    setState(() => isGenerating = true);
    try {
      final data = await ApiService.generateMemoir(memoirId!, selectedStyle!);
      setState(() {
        generatedText = data['content'];
        isGenerating = false;
      });

      // 显示生成成功对话框
      _showGeneratedDialog(data);
    } catch (e) {
      setState(() => isGenerating = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('生成失败: $e')),
      );
    }
  }

  void _showGeneratedDialog(dynamic data) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('🎉 回忆录生成成功', style: TextStyle(fontSize: 24)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '风格: ${data['style']?['name'] ?? '白描版'}',
              style: const TextStyle(fontSize: 18),
            ),
            const SizedBox(height: 8),
            Text(
              '字数: ${data['word_count']} 字',
              style: const TextStyle(fontSize: 18),
            ),
            const SizedBox(height: 8),
            Text(
              '问答数: ${data['qa_count']} 个',
              style: const TextStyle(fontSize: 18),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('关闭', style: TextStyle(fontSize: 18)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: 导出功能
            },
            child: const Text('导出PDF', style: TextStyle(fontSize: 18)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('选择写作风格', style: TextStyle(fontSize: 24)),
        backgroundColor: const Color(0xFFFFF8F0),
        foregroundColor: const Color(0xFF2D3436),
        elevation: 0,
      ),
      body: isGenerating
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 24),
                  Text(
                    'AI正在创作中...\n这可能需要1-2分钟',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 20, color: Color(0xFF636E72)),
                  ),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 说明文字
                  const Text(
                    '选择一位作家风格，\nAI将为您改写回忆录',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2D3436),
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    '不同的风格会带来不同的阅读体验',
                    style: TextStyle(
                      fontSize: 18,
                      color: Color(0xFF636E72),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // 风格列表
                  ...styles.map((style) => _buildStyleCard(style)),

                  const SizedBox(height: 32),

                  // 生成按钮
                  if (selectedStyle != null)
                    SizedBox(
                      width: double.infinity,
                      height: 64,
                      child: ElevatedButton.icon(
                        onPressed: _generateMemoir,
                        icon: const Icon(Icons.auto_stories, size: 28),
                        label: const Text(
                          '生成回忆录',
                          style: TextStyle(fontSize: 24),
                        ),
                      ),
                    ),

                  // 预览区域
                  if (generatedText != null) ...[
                    const SizedBox(height: 32),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '预览',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            generatedText!.length > 300
                                ? '${generatedText!.substring(0, 300)}...'
                                : generatedText!,
                            style: const TextStyle(
                              fontSize: 18,
                              height: 1.8,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildStyleCard(dynamic style) {
    final isSelected = selectedStyle == style['key'];
    final styleKey = style['key'] as String;

    // 风格描述
    final descriptions = {
      'plain': '简洁流畅，保留真实',
      'wang_zengqi': '平淡自然，市井气息',
      'zhang_ailing': '细腻敏感，比喻精妙',
      'yu_hua': '冷峻克制，时代感强',
      'yang_jiang': '温润平和，知性优雅',
      'shi_tiesheng': '哲思深邃，内省式',
    };

    // 风格图标
    final icons = {
      'plain': Icons.edit_note,
      'wang_zengqi': Icons.nature,
      'zhang_ailing': Icons.palette,
      'yu_hua': Icons.book,
      'yang_jiang': Icons.menu_book,
      'shi_tiesheng': Icons.self_improvement,
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: isSelected ? 8 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: isSelected
            ? const BorderSide(color: Color(0xFFFF8C42), width: 3)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: () => setState(() => selectedStyle = styleKey),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              // 图标
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFFFF8C42)
                      : const Color(0xFFFFF3E0),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  icons[styleKey] ?? Icons.style,
                  size: 28,
                  color: isSelected ? Colors.white : const Color(0xFFFF8C42),
                ),
              ),
              const SizedBox(width: 20),

              // 文字
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      style['name'],
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: isSelected
                            ? const Color(0xFFFF8C42)
                            : const Color(0xFF2D3436),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      descriptions[styleKey] ?? '',
                      style: const TextStyle(
                        fontSize: 16,
                        color: Color(0xFF636E72),
                      ),
                    ),
                  ],
                ),
              ),

              // 选中标记
              if (isSelected)
                const Icon(
                  Icons.check_circle,
                  color: Color(0xFFFF8C42),
                  size: 32,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
