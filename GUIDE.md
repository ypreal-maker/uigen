# UIGen 가이드

> **AI로 React 컴포넌트를 즉시 생성하는 웹 앱입니다.**
> 채팅창에 원하는 UI를 설명하면, Claude AI가 실시간으로 코드를 만들고 미리보기까지 보여줍니다.

---

## 처음 오신 분께

UIGen에 오신 걸 환영합니다! 이 프로젝트는 별도의 코딩 없이도 AI와 대화하는 것만으로 React 컴포넌트를 만들 수 있는 도구입니다. 생성된 코드는 즉시 편집할 수 있으며, 로그인하면 작업 내용이 저장됩니다.

---

## 시작하기

### 1. 환경 설정

```bash
# 저장소 클론
git clone https://github.com/ypreal-maker/uigen.git
cd uigen
```

`.env` 파일을 열고 Anthropic API 키를 입력합니다 (없어도 Mock 모드로 실행 가능):

```env
ANTHROPIC_API_KEY=your-api-key-here
```

### 2. 설치 및 초기화

```bash
npm run setup
```

이 명령 하나로:
- 패키지 설치
- Prisma 클라이언트 생성
- 데이터베이스 마이그레이션

이 모두 완료됩니다.

### 3. 개발 서버 실행

**Windows:**
```bash
set "NODE_OPTIONS=--require ./node-compat.cjs" && npx next dev --turbopack
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

---

## 사용 방법

1. **회원가입** 또는 **비회원으로 시작** 선택
2. 채팅창에 원하는 컴포넌트를 한국어로 설명
   - 예: "파란색 로그인 폼을 만들어줘"
   - 예: "상품 카드 그리드 레이아웃이 필요해"
3. AI가 실시간으로 코드를 생성하며 **Preview** 탭에서 바로 확인
4. **Code** 탭에서 생성된 파일을 직접 수정 가능
5. 로그인 사용자는 프로젝트가 자동 저장됨

---

## 프로젝트 구조

```
uigen/
├── src/
│   ├── app/                    # Next.js App Router 페이지
│   │   ├── [projectId]/        # 개별 프로젝트 페이지
│   │   └── api/                # API 라우트 (/api/chat, /api/projects 등)
│   ├── components/
│   │   ├── chat/               # 채팅 UI 컴포넌트
│   │   ├── editor/             # Monaco 코드 에디터
│   │   ├── preview/            # 라이브 프리뷰 iframe
│   │   └── auth/               # 로그인/회원가입 UI
│   ├── lib/
│   │   ├── contexts/
│   │   │   ├── file-system-context.tsx   # 가상 파일시스템 상태
│   │   │   └── chat-context.tsx          # AI 채팅 상태
│   │   ├── tools/              # AI 도구 정의 (str_replace_editor, file_manager)
│   │   ├── prompts/            # AI 시스템 프롬프트
│   │   ├── file-system.ts      # 인메모리 가상 파일시스템
│   │   ├── auth.ts             # JWT 인증 로직
│   │   └── provider.ts         # AI 프로바이더 (Claude or Mock)
│   ├── actions/                # Next.js 서버 액션 (인증, 프로젝트 CRUD)
│   └── hooks/                  # React 커스텀 훅
├── prisma/
│   ├── schema.prisma           # DB 스키마 (User, Project)
│   └── migrations/             # 마이그레이션 파일
├── CLAUDE.md                   # Claude AI 작업 지침
└── README.md                   # 기본 설명
```

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| AI 컴포넌트 생성 | Claude AI가 채팅으로 React 컴포넌트 작성 |
| 실시간 프리뷰 | Babel 변환으로 JSX를 즉시 렌더링 |
| 가상 파일시스템 | 디스크에 파일을 쓰지 않고 메모리에서 관리 |
| Monaco 에디터 | VS Code와 동일한 편집기로 코드 수정 |
| 프로젝트 저장 | 로그인 시 SQLite DB에 자동 저장 |
| 비회원 지원 | API 키 없이도 Mock 모드로 체험 가능 |

---

## 유용한 명령어

```bash
# 테스트 실행
npm test

# 단일 테스트 파일 실행
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx

# DB 초기화
npm run db:reset

# Prisma 클라이언트 재생성 (스키마 변경 후)
npx prisma generate

# 마이그레이션 생성
npx prisma migrate dev --name <이름>
```

---

## 기술 스택

- **Next.js 15** (App Router)
- **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Prisma** + **SQLite**
- **Vercel AI SDK** + **Anthropic Claude**
- **Monaco Editor** + **Babel Standalone**

---

## 문의 / 기여

이슈나 개선 아이디어는 [GitHub Issues](https://github.com/ypreal-maker/uigen/issues)에 남겨주세요.
처음 보는 코드라도 질문을 두려워하지 마세요. 함께 만들어가는 프로젝트입니다!
