import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'screens/topics_screen.dart';
import 'screens/record_screen.dart';
import 'screens/timeline_screen.dart';
import 'screens/style_screen.dart';

void main() {
  runApp(const TimeMemoirApp());
}

class TimeMemoirApp extends StatelessWidget {
  const TimeMemoirApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '时光回忆录',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.orange,
        scaffoldBackgroundColor: const Color(0xFFFFF8F0),
        fontFamily: 'NotoSansSC',
        textTheme: const TextTheme(
          headlineLarge: TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: Color(0xFF2D3436)),
          headlineMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF2D3436)),
          bodyLarge: TextStyle(fontSize: 24, color: Color(0xFF2D3436)),
          bodyMedium: TextStyle(fontSize: 20, color: Color(0xFF2D3436)),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF6A994E),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            textStyle: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const HomeScreen(),
        '/topics': (context) => const TopicsScreen(),
        '/record': (context) => const RecordScreen(),
        '/timeline': (context) => const TimelineScreen(),
        '/style': (context) => const StyleScreen(),
      },
    );
  }
}
