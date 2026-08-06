# 말해봐 · Voice Todo

Chrome 내장 음성 인식(STT)으로 해야 할 일을 말하고, 이 기기의 브라우저에 기록하는 모바일 중심 Next.js To-do 앱입니다.

## 주요 기능

- Chrome Web Speech API(`SpeechRecognition` / `webkitSpeechRecognition`)를 이용한 한국어 음성 입력
- 음성 결과를 입력창에 담아 확인 후 할 일로 등록하는 흐름
- 할 일 추가, 완료/완료 취소, 삭제, 완료 항목 일괄 삭제
- 전체/진행 중/완료 필터와 검색
- `localStorage` 기반 저장으로 새로고침 후에도 데이터 유지
- `/api/health` Next.js Route Handler를 포함한 풀스택 구조

## 실행

```bash
npm install
npm run dev
```

Chrome에서 `http://localhost:3000`을 열고 마이크 권한을 허용하면 음성 입력을 사용할 수 있습니다.
