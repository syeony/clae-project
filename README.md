# clae-project
<img width="600" alt="image" src="https://github.com/user-attachments/assets/0eaf37a2-04c6-4e51-9408-2a325c272aaf">

- 블록체인을 활용한 수강권 거래 플랫폼 웹서비스

<img width="410" alt="image" src="https://github.com/user-attachments/assets/37743eaa-8056-4891-b482-40aa81f743a9">
<img width="450" alt="image" src="https://github.com/user-attachments/assets/85cbddbd-50b7-48e6-a289-48d501e652f4">

- 온라인 수강권의 높은 거래율과 비례해 사기와 개인정보 유출의 문제가 증가하는 모습을 보고 아이디어를 구상하게 되었습니다.

<img width="1000" alt="image" src="https://github.com/user-attachments/assets/070609e0-abcd-4e44-bf6b-b46059f3c363">

- 개발환경 및 개발도구 : `ubuntu 20.04`, `vscode`

- 사용언어 : `html`, `css`, `javascript`, `go`, `bash`

# 블록체인 기술

1. 거래 기록이 절대 안 지워짐
    - 누가, 언제, 누구한테 수강권을 팔았는지 영구 보관
    - 나중에 "내가 언제 팔았냐" 같은 거짓말 불가능
2. 신원 확인 시스템
    - 인증서(디지털 신분증) 없으면 거래 자체가 안 됨
    - 익명 사기꾼이 끼어들 수 없음
3. 자동 검증 시스템 (스마트 컨트랙트)
    - Go 언어로 짠 자동 프로그램이 규칙을 강제함
    - 예: "학원이 인증 안 한 수강권은 절대 구매 불가" 같은 규칙

# 작동방식 예시

 철수가 영어 수강권을 팔고 싶어함

  1. 철수: "내 수강권 팔게요" → 블록체인에 기록
  2. 학원: "이 수강권 진짜 맞아요" → 블록체인에 기록
  3. 영희: "내가 살게요" → 블록체인이 자동으로
     - 철수가 진짜 주인 맞는지 확인
     - 학원이 인증했는지 확인
     - 모든 조건 OK면 영희에게 소유권 이전
     - 모든 과정이 블록체인에 영구 기록

# 프로젝트 구조
```
clae/
  ├── chaincode/              # 블록체인 스마트 컨트랙트
  │   └── clae/v1.0/
  │       └── clae_function.go  # Go로 작성된 체인코드
  │
  ├── javascript/             # Fabric SDK 유틸리티
  │   ├── AppUtil.js         # 애플리케이션 설정 유틸
  │   └── CAUtil.js          # Certificate Authority 유틸
  │
  ├── public/                 # 프론트엔드 웹 페이지
  │   ├── index.html         # 메인 페이지
  │   ├── admin-wallet.html  # 관리자 지갑 페이지
  │   ├── user-wallet.html   # 사용자 지갑 페이지
  │   ├── voucher-enroll.html # 수강권 등록
  │   ├── register.html      # 판매 등록
  │   ├── vertify.html       # 학원 인증
  │   ├── buy.html          # 수강권 구매
  │   └── query.html        # 수강권 조회
  │
  ├── main.js                # Express 서버 (API 라우팅)
  ├── connection-org1.json   # Fabric 네트워크 연결 설정
  └── package.json           # Node.js 의존성

```

## hyperledger fabric sample
### pre-condition
curl, docker, docker-compose, go, nodejs, python
hyperledger fabric-docker images are installed
GOPATH are configured
hyperledger bineries are installed (cryptogen, configtxgen ... etcs)
## -network(test-network사용)
 fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json
## 1. generating crypto-config directory, genesis.block, channel and anchor peer transactions
cd network

./generate.sh

## 2. starting the network, create channel and join
./start.sh

# -chaincode
## 3. chaincode install, instsantiate and test(invoke, query, invoke)
./cc_tea.sh instantiate v1.0

# -prototype
cd ../prototype

## 4. nodejs module install
npm install

## 5. certification works
node enrollAdmin.js

node registerUser.js

## 6. server start
node server.js

## 7. open web browser and connect to localhost:8080
