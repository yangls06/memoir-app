import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFFFF8F0), Color(0xFFFFE4C4)],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(),
                // Logo
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF8C42),
                    borderRadius: BorderRadius.circular(60),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.book,
                    size: 60,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 32),
                // 标题
                const Text(
                  '🌅 时光回忆录',
                  style: TextStyle(
                    fontSize: 42,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D3436),
                  ),
                ),
                const SizedBox(height: 16),
                // 副标题
                const Text(
                  '"帮妈妈记录一生的故事"',
                  style: TextStyle(
                    fontSize: 24,
                    color: Color(0xFF636E72),
                    fontStyle: FontStyle.italic,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 64),
                // 开始按钮
                SizedBox(
                  width: double.infinity,
                  height: 72,
                  child: ElevatedButton.icon(
                    onPressed: () => Navigator.pushNamed(context, '/topics'),
                    icon: const Icon(Icons.play_arrow, size: 32),
                    label: const Text('开始回忆'),
                  ),
                ),
                const SizedBox(height: 20),
                // 继续按钮
                SizedBox(
                  width: double.infinity,
                  height: 72,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      // TODO: 继续上次的
                    },
                    icon: const Icon(Icons.bookmark, size: 28),
                    label: const Text('继续上次的'),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF6A994E), width: 2),
                      textStyle: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                      foregroundColor: const Color(0xFF6A994E),
                    ),
                  ),
                ),
                const Spacer(),
                // 底部提示
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.info_outline, color: Color(0xFF74B9FF)),
                      SizedBox(width: 8),
                      Text(
                        '不用打字，会说话就能写回忆录',
                        style: TextStyle(fontSize: 16, color: Color(0xFF636E72)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
