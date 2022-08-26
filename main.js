'use strict';

var express = require('express');
//body-parser추가
const bodyParser = require("body-parser");
var path = require('path');
var fs = require('fs');

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');

const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('./javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('./javascript/AppUtil.js');

//2. connection.json객체화
const ccpPath = path.resolve(__dirname, "connection-org1.json");
const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

//var app = express();

//3. 서버 설정
const app = express();
const PORT = 3000;
const HOST = "0.0.0.0";

// static /public -> ./public
app.use('/public', express.static(path.join(__dirname, 'public')));

// body-parser app.use
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');

//const ccp = buildCCPOrg1();
const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

//4. "/" GET 라우팅
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

//5. /admin POST 라우팅(id, password)
app.post("/admin", async (req, res) => {
    const id = req.body.id;
    const pw = req.body.password;

    console.log(id, pw);

    try {
        const caInfo = ccp.certificateAuthorities["ca.org1.example.com"];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        const walletPath = path.join(process.cwd(), "wallet");
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const identity = await wallet.get(id);
        if (identity) {
            console.log(`An identity for the admin user ${id} already exists in the wallet`);
            const res_str = `{"result":"failed","msg":"An identity for the admin user ${id} already exists in the wallet"}`;
            res.json(JSON.parse(res_str));
            return;
        }

        const enrollment = await ca.enroll({ enrollmentID: id, enrollmentSecret: pw });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: "Org1MSP",
            type: "X.509",
        };
        await wallet.put(id, x509Identity);

        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
        const res_str = `{"result":"success","msg":"Successfully enrolled admin user ${id} in the wallet"}`;
        res.status(200).json(JSON.parse(res_str));
    } catch (error) {
        console.error(`Failed to enroll admin user ${id}:${error}`);
        const res_str = `{"result":"failed","msg":"failed to enroll admin user - ${id}:${error}"}`;
        res.json(JSON.parse(res_str));
    }
});
//6. /user POST 라우팅(id, userrole)
app.post("/user", async (req, res) => {
    const id = req.body.id;
    const userrole = req.body.userrole;

    console.log(id, userrole);

    try {
        const caInfo = ccp.certificateAuthorities["ca.org1.example.com"];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        const walletPath = path.join(process.cwd(), "wallet");
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const userIdentity = await wallet.get(id);
        if (userIdentity) {
            console.log('An identity for the user "appUser" already exists in the wallet');
            const res_str = `{"result":"failed","msg":"An identity for the user ${id} already exists in the wallet"}`;
            res.json(JSON.parse(res_str));
            return;
        }

        const adminIdentity = await wallet.get("admin");
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            const res_str = `{"result":"failed","msg":"An identity for the admin user ${id} does not exists in the wallet"}`;
            res.json(JSON.parse(res_str));
            return;
        }
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, "admin");

        const secret = await ca.register(
            {
                affiliation: "org1.department1",
                enrollmentID: id,
                role: userrole,
            },
            adminUser
        );
        const enrollment = await ca.enroll({
            enrollmentID: id,
            enrollmentSecret: secret,
        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: "Org1MSP",
            type: "X.509",
        };
        await wallet.put(id, x509Identity);

        console.log('Successfully registered and enrolled admin user "appUser" and imported it into the wallet');
        const res_str = `{"result":"success","msg":"Successfully enrolled user ${id} in the wallet"}`;
        res.status(200).json(JSON.parse(res_str));
    } catch (error) {
        console.error(`Failed to enroll admin user ${id}:${error}`);
        const res_str = `{"result":"failed","msg":"failed to register user - ${id}:${error}"}`;
        res.json(JSON.parse(res_str));
    }
});

//수강권 등록
app.post('/voucher', async (req, res) => {
    console.log('/voucher post started');

    var userid = req.body.userid;
    var vid = req.body.vid;
    var academyid = req.body.academyid;
    var date = req.body.date;
    var owner = req.body.owner;

    console.log(userid, vid, owner, academyid, date);

    const gateway = new Gateway();

    try {
        const wallet = await buildWallet(Wallets, walletPath);

        await gateway.connect(ccp, {
            wallet,
            identity: userid,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });

        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("clae");
        await contract.submitTransaction('EnrollLecture', vid, academyid, date, owner);

    } catch (error) {
        var result = `{"result":"fail", "message":"tx has NOT submitted"}`;
        var obj = JSON.parse(result);
        console.log("/asset end -- failed ", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }

    var result = `{"result":"success", "message":"tx has submitted"}`;
    var obj = JSON.parse(result);
    console.log("/aset end -- success");
    res.status(200).send(obj);
});

//수강권 판매등록
app.post('/voucher/tx', async (req, res) => {
    console.log('/voucher/tx post started');
    
    var vid = req.body.vid;
    var owner = req.body.owner;
    var userid = req.body.userid;

    console.log(userid, owner, vid);

    const gateway = new Gateway();
    try {
        const wallet = await buildWallet(Wallets, walletPath);

        await gateway.connect(ccp, {
            wallet,
            identity: userid,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("clae");
        await contract.submitTransaction('SellVoucher', vid, owner);

    } catch (error) {
        var result = `{"result":"fail", "message":"tx has NOT submitted"}`;
        var obj = JSON.parse(result);
        console.log("/asset end -- failed ", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }

    var result = `{"result":"success", "message":"tx has submitted"}`;
    var obj = JSON.parse(result);
    console.log("/aset end -- success");
    res.status(200).send(obj);
});

//수강권 구매
app.post('/voucher/buy', async (req, res) => {
    console.log('/voucher/buy post started');

    var userid = req.body.userid;
    var vid = req.body.vid;
    var oldowner = req.body.oldowner;
    var newowner = req.body.newowner;

    console.log("/asset post start -- ", userid, vid, oldowner, newowner);
    const gateway = new Gateway();

    try {
        const wallet = await buildWallet(Wallets, walletPath);

        console.log('hi3');

        await gateway.connect(ccp, {
            wallet,
            identity: userid,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });

        console.log('hi4');
        const network = await gateway.getNetwork("mychannel");
        console.log('hi5');
        const contract = network.getContract("clae");
        console.log('hi6');
        await contract.submitTransaction('PurchaseVoucher', vid, oldowner, newowner);
        console.log('hi7');

    } catch (error) {
        var result = `{"result":"fail", "message":"tx has NOT submitted"}`;
        var obj = JSON.parse(result);
        console.log("/asset end -- failed ", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }

    var result = `{"result":"success", "message":"tx has submitted"}`;
    var obj = JSON.parse(result);
    console.log("/aset end -- success");
    res.status(200).send(obj);
});

//학원인증
app.post('/voucher/vertify', async (req, res) => {
    //console.log('hi1');

    var userid = req.body.userid;
    var vid = req.body.vid;
    var academy = req.body.academy;

    //console.log('hi2');

    console.log("/voucher/vertify post start -- ", userid, vid, academy);
    const gateway = new Gateway();

    try {
        const wallet = await buildWallet(Wallets, walletPath);

        //console.log('hi3');

        await gateway.connect(ccp, {
            wallet,
            identity: userid,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });

        //console.log('hi4');
        const network = await gateway.getNetwork("mychannel");
        //console.log('hi5');
        const contract = network.getContract("clae");
        //console.log('hi6');
        await contract.submitTransaction('VerifyVoucher', vid, academy);
        //console.log('hi7');

    } catch (error) {
        var result = `{"result":"fail", "message":"tx has NOT submitted"}`;
        var obj = JSON.parse(result);
        console.log("/asset end -- failed ", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }

    var result = `{"result":"success", "message":"tx has submitted"}`;
    var obj = JSON.parse(result);
    console.log("/aset end -- success");
    res.status(200).send(obj);
});

app.get('/voucher/get', async (req, res) => {
    var userid = req.query.userid;
    var vid = req.query.vid;
    console.log("/voucher/get get start -- ", userid, vid);

    const gateway = new Gateway();

    try {
        const wallet = await buildWallet(Wallets, walletPath);
        // GW -> connect -> CH -> CC -> submitTransaction
        await gateway.connect(ccp, {
            wallet,
            identity: userid,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed 
        });
        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("clae");
        var result = await contract.evaluateTransaction('GetVoucher', vid);
        // result 가 byte array라고 생각하고
        var result = `{"result":"success", "message":${result}}`;
        console.log("/asset get end -- success", result);
        var obj = JSON.parse(result);
        res.status(200).send(obj);
    } catch (error) {
        var result = `{"result":"fail", "message":"Get has a error"}`;
        var obj = JSON.parse(result);
        console.log("/asset get end -- failed ", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }
});

app.get('/asset/history', async (req, res) => {
    var userid = req.query.userid;
    var key = req.query.key;
    console.log("/asset/history get start -- ", userid, key);

    const gateway = new Gateway();

    try {
        const wallet = await buildWallet(Wallets, walletPath);
        // GW -> connect -> CH -> CC -> submitTransaction
        await gateway.connect(ccp, {
            wallet,
            identity: userid,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed 
        });
        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("simpleasset");
        var result = await contract.evaluateTransaction('GetHistory', key);
        // result 가 byte array라고 생각하고
        var result = `{"result":"success", "message":${result}}`;
        console.log("/asset get end -- success", result);
        var obj = JSON.parse(result);
        res.status(200).send(obj);
    } catch (error) {
        var result = `{"result":"fail", "message":"GetHistory has a error"}`;
        var obj = JSON.parse(result);
        console.log("/asset get end -- failed ", error);
        res.status(200).send(obj);
        return;
    } finally {
        gateway.disconnect();
    }
});

// server listen
// app.listen(3000, () => {
//     console.log('Express server is started: 3000');
// });

//7. server 시작
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);