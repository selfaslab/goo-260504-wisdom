
# 오늘의 철학 (Wisdom Today)

랜덤 배경 위에서 오늘의 철학을 한국어·원문으로 보여 줍니다.

OpenAI API로 관련 이미지를 생성하고 낭독용 음성에 가까운 경험을 제공하는 작은 React(Vite) 웹앱입니다.

<img width="1068" height="756" alt="wisdom" src="https://github.com/user-attachments/assets/ccee63a1-95c6-4524-8a73-d3dccbe72f0d" />


## 필요한 것

- Node.js 18 이상 권장
- [OpenAI API 키](https://platform.openai.com/api-keys) (채팅·이미지 생성에 사용)

## 빠른 시작

1. 저장소를 받은 뒤 프로젝트 폴더에서:

   ```bash
   npm install
   ```

2. 루트에 `.env` 파일을 만들고 아래처럼 넣습니다. (예시는 `.env.example` 참고)

   ```
   VITE_OPENAI_API_KEY=sk-실제_키
   VITE_OPENAI_MODEL=gpt-4o-mini
   ```

   `VITE_` 접두사가 없으면 Vite가 브라우저에 넣어 주지 않습니다.

3. 개발 서버 실행:

   ```bash
   npm run dev
   ```

4. 브라우저에서 표시되는 주소(기본 `http://localhost:5173/`)로 접속합니다.

`.env`를 바꾼 뒤에는 개발 서버를 **한 번 끄고 다시** 실행하세요.

## 빌드·미리보기

```bash
npm run build
npm run preview
```

## 보안에 대해 (한국 독자용 요약)

- **`.env`는 Git에 올리지 마세요.** 이 프로젝트는 `.gitignore`에 `.env`를 넣어 두었습니다.
- `VITE_*` 변수는 **프론트 빌드에 포함**되어 브라우저에서 볼 수 있습니다. 공개 사이트라면 API 키는 **백엔드 프록시** 뒤에 두는 편이 안전합니다.
- 키가 문서·채팅·스크린샷 등에 노출된 적이 있다면, OpenAI 대시보드에서 **키를 폐기하고 새로 발급**하는 것이 좋습니다.

자세한 환경 변수 설명은 `env.md`를 참고하세요.

## 라이선스·이미지

배경 이미지는 `public/REF_IMG_DOC/`에 있습니다. 각 파일의 저작권·이용 조건은 해당 출처 정책을 따릅니다.

## 원격 저장소

- <https://github.com/selfaslab/goo-260504-wisdom>
