# clae-project
<img width="600" alt="image" src="https://github.com/user-attachments/assets/0eaf37a2-04c6-4e51-9408-2a325c272aaf">

- 블록체인을 활용한 수강권 거래 플랫폼 웹서비스

<img width="410" alt="image" src="https://github.com/user-attachments/assets/37743eaa-8056-4891-b482-40aa81f743a9">
<img width="450" alt="image" src="https://github.com/user-attachments/assets/85cbddbd-50b7-48e6-a289-48d501e652f4">

- 온라인 수강권의 높은 거래율과 비례해 사기와 개인정보 유출의 문제가 증가하는 모습을 보고 아이디어를 구상하게 되었습니다.

<img width="1000" alt="image" src="https://github.com/user-attachments/assets/070609e0-abcd-4e44-bf6b-b46059f3c363">

- 개발환경 및 개발도구 : `ubuntu 20.04`, `vscode`

- 사용언어 : `html`, `css`, `javascript`, `go`, `bash`

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
