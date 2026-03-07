import 'dart:async';
import 'package:flutter_sound/flutter_sound.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;

class AudioService {
  FlutterSoundRecorder? _recorder;
  String? _recordingPath;
  bool _isInitialized = false;

  Future<void> init() async {
    _recorder = FlutterSoundRecorder();
    await _recorder!.openRecorder();
    _isInitialized = true;
  }

  Future<bool> requestPermission() async {
    final status = await Permission.microphone.request();
    return status.isGranted;
  }

  Future<void> startRecording() async {
    if (!_isInitialized) await init();
    
    final tempDir = await getTemporaryDirectory();
    _recordingPath = path.join(tempDir.path, 'recording_${DateTime.now().millisecondsSinceEpoch}.aac');
    
    await _recorder!.startRecorder(
      toFile: _recordingPath,
      codec: Codec.aacADTS,
    );
  }

  Future<String?> stopRecording() async {
    if (_recorder == null) return null;
    
    await _recorder!.stopRecorder();
    return _recordingPath;
  }

  void dispose() {
    _recorder?.closeRecorder();
    _recorder = null;
  }
}
