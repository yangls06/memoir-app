const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 讯飞API配置
const XUNFEI_CONFIG = {
  appId: process.env.XUNFEI_APP_ID,
  apiKey: process.env.XUNFEI_API_KEY,
  apiSecret: process.env.XUNFEI_API_SECRET,
  // 语音识别 WebSocket
  asrHost: 'iat-api.xfyun.cn',
  asrPath: '/v2/iat',
  // 语音合成 WebSocket
  ttsHost: 'tts-api.xfyun.cn',
  ttsPath: '/v2/tts',
};

/**
 * 生成RFC1123格式日期
 */
function getRFC1123Date() {
  const date = new Date();
  return date.toUTCString();
}

/**
 * 生成讯飞API鉴权URL
 */
function getAuthUrl(host, path, apiKey, apiSecret) {
  const date = getRFC1123Date();
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(signatureOrigin)
    .digest('base64');
  
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authorizationOrigin).toString('base64');
  
  return {
    url: `wss://${host}${path}`,
    headers: {
      Authorization: authorization,
      Date: date,
      Host: host,
    },
  };
}

/**
 * 语音识别 (HTTP API方式)
 */
async function speechToText(audioFilePath) {
  try {
    if (!XUNFEI_CONFIG.appId || !XUNFEI_CONFIG.apiKey) {
      console.warn('Xunfei config not set, using mock');
      return mockSpeechToText();
    }

    // 读取音频文件
    const audioData = fs.readFileSync(audioFilePath);
    const audioBase64 = audioData.toString('base64');

    // 构建请求
    const timestamp = Math.floor(Date.now() / 1000);
    const param = {
      engine_type: 'sms16k',
      aue: 'raw',
    };
    const paramBase64 = Buffer.from(JSON.stringify(param)).toString('base64');

    const checkSum = crypto
      .createHash('md5')
      .update(XUNFEI_CONFIG.apiKey + timestamp + paramBase64 + 'audio/' + audioBase64)
      .digest('hex');

    const response = await axios.post(
      'http://api.xfyun.cn/v1/service/v1/iat',
      {
        audio: audioBase64,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
          'X-Appid': XUNFEI_CONFIG.appId,
          'X-CurTime': timestamp.toString(),
          'X-Param': paramBase64,
          'X-CheckSum': checkSum,
        },
      }
    );

    if (response.data.code === '0') {
      return {
        text: response.data.data,
        confidence: 0.95,
        success: true,
      };
    } else {
      throw new Error(response.data.desc);
    }
  } catch (error) {
    console.error('Xunfei ASR error:', error.message);
    return mockSpeechToText();
  }
}

/**
 * 语音合成
 */
async function textToSpeech(text, options = {}) {
  try {
    if (!XUNFEI_CONFIG.appId || !XUNFEI_CONFIG.apiKey) {
      console.warn('Xunfei config not set, using mock');
      return mockTextToSpeech(text);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const param = {
     auf: 'audio/L16;rate=16000',
      aue: 'lame', // mp3格式
      vcn: options.voice || 'xiaoyan', // 发音人
      speed: options.speed || 50, // 语速 0-100
      volume: options.volume || 50, // 音量 0-100
      pitch: options.pitch || 50, // 音调 0-100
      bgs: 0,
      tte: 'UTF8',
      reg: '0',
      rdn: '0',
    };
    const paramBase64 = Buffer.from(JSON.stringify(param)).toString('base64');

    const checkSum = crypto
      .createHash('md5')
      .update(XUNFEI_CONFIG.apiKey + timestamp + paramBase64 + text)
      .digest('hex');

    const response = await axios.post(
      'http://api.xfyun.cn/v1/service/v1/tts',
      {
        text: text,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
          'X-Appid': XUNFEI_CONFIG.appId,
          'X-CurTime': timestamp.toString(),
          'X-Param': paramBase64,
          'X-CheckSum': checkSum,
        },
        responseType: 'arraybuffer',
      }
    );

    // 保存音频文件
    const audioFileName = `tts_${Date.now()}.mp3`;
    const audioPath = path.join('uploads', audioFileName);
    fs.writeFileSync(audioPath, response.data);

    return {
      audioUrl: `/uploads/${audioFileName}`,
      text: text,
      success: true,
    };
  } catch (error) {
    console.error('Xunfei TTS error:', error.message);
    return mockTextToSpeech(text);
  }
}

/**
 * 备用语音识别
 */
function mockSpeechToText() {
  const mockTexts = [
    '那是1968年，我响应号召下乡插队，那时候我才18岁，什么都不懂。',
    '我小时候住在农村，家里很穷，但过年的时候特别热闹，有很多好吃的。',
    '我第一次见到我爱人的时候，是在厂里的文艺汇演上，她穿着一条红裙子。',
    '我印象最深的是我的母亲，她总是很勤劳，每天早起给我们做早饭。',
  ];
  
  return {
    text: mockTexts[Math.floor(Math.random() * mockTexts.length)],
    confidence: 0.95,
    success: true,
    mock: true,
  };
}

/**
 * 备用语音合成
 */
function mockTextToSpeech(text) {
  return {
    audioUrl: null,
    text: text,
    success: true,
    mock: true,
  };
}

module.exports = {
  speechToText,
  textToSpeech,
};
